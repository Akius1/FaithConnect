// Turns rows from the "Weekly Home Church Report" Google Form responses into
// weekly district summaries. Pure functions with no imports, so the same code
// runs on the server and in tests.
//
// Sheet layout: A Timestamp, B Date Home Church Held, C Leader, D Leader phone,
// E District ("2A-District 2A"), then 13 blocks of 10 columns (one per
// district branch of the form). A response fills only its own block:
//   name, address, DHC birthed, fresh DHC, offering, new comers, attendance,
//   souls won, slips collected, slips followed up.

export interface Submission {
  timestamp: string; // ISO, local time of the form
  submittedAt: number; // ms, for sorting
  reportDate: string; // Saturday the report belongs to, YYYY-MM-DD
  late: boolean; // sent after 8pm on the report day
  district: string; // "District 2A"
  districtCode: string; // "2A"
  homeChurch: string;
  address: string;
  leader: string;
  leaderPhone: string;
  dhcBirthed: number | null;
  freshDhc: number | null;
  offering: number | null;
  newComers: number | null;
  attendance: number | null;
  soulsWon: number | null;
  slipsCollected: number | null;
  slipsFollowedUp: number | null;
}

export interface DistrictWeek {
  district: string;
  dhcCount: number | null; // registered home churches ("No of DHC")
  submissions: number;
  attendance: number;
  newComers: number;
  soulsWon: number;
  offering: number;
  slipsCollected: number;
  slipsFollowedUp: number;
  dhcBirthed: number;
  freshDhc: number;
  late: number;
  missingAttendance: number;
}

export interface WeekReport {
  date: string; // Saturday, YYYY-MM-DD
  districts: DistrictWeek[];
  totals: Omit<DistrictWeek, "district">;
  submissions: Submission[]; // one per home church (latest wins)
  duplicatesRemoved: number;
  notSubmitted: Record<string, string[]>; // district -> home churches seen recently but not this week
}

const BLOCK_START = 5;
const BLOCK_SIZE = 10;
const BLOCKS = 13;
const LATE_HOUR = 20;

const ZERO_WORDS = new Set([
  "none", "nil", "nill", "nile", "null", "nl", "no", "non", "na", "n/a", "zero", "o", "nothing", "nope",
]);

const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
};

function wordsToNumber(text: string): number | null {
  const words = text.toLowerCase().replace(/[^a-z\s-]/g, " ").split(/[\s-]+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let seen = false;
  for (const w of words) {
    if (w in SMALL) {
      current += SMALL[w];
      seen = true;
    } else if (w === "hundred") {
      current = (current || 1) * 100;
      seen = true;
    } else if (w === "thousand") {
      total += (current || 1) * 1000;
      current = 0;
      seen = true;
    } else if (w === "and" || w === "naira" || w === "only") {
      continue;
    } else if (seen) {
      break;
    }
  }
  return seen ? total + current : null;
}

// "None", "Nil", "O" -> 0; "#1,200", "N2000", "One (1)" -> numbers;
// blank or unreadable ("Yes", "All previous") -> null.
export function toNumber(raw: unknown): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const lower = text.toLowerCase().replace(/[.\s]+$/, "");
  if (ZERO_WORDS.has(lower)) return 0;
  const digits = text.replace(/,/g, "").match(/\d+(\.\d+)?/);
  if (digits) return Number(digits[0]);
  return wordsToNumber(text);
}

// "10/24/2026 19:00:22" or "10/24/2026" (US order, as the sheet exports).
function parseSheetDate(text: string): Date | null {
  const m = String(text ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  const d = new Date(+m[3], +m[1] - 1, +m[2], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  return isNaN(d.getTime()) ? null : d;
}

function ymd(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function dayOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Saturday on or before the given day.
function saturdayOf(d: Date) {
  const day = dayOnly(d);
  day.setDate(day.getDate() - ((day.getDay() + 1) % 7));
  return day;
}

// "2A-District 2A" -> { code: "2A", label: "District 2A" }
export function parseDistrict(raw: string): { code: string; label: string } | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const label = (text.includes("-") ? text.slice(text.indexOf("-") + 1) : text).trim();
  const code = label.replace(/^district\s*/i, "").trim().toUpperCase();
  if (!code) return null;
  return { code, label: /^district/i.test(label) ? `District ${code}` : label };
}

function homeChurchKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function districtSortKey(label: string) {
  const m = label.match(/(\d+)\s*([A-Z]*)/i);
  return m ? Number(m[1]) * 100 + (m[2] ? m[2].toUpperCase().charCodeAt(0) - 64 : 0) : 9999;
}

export function parseResponses(rows: string[][]): Submission[] {
  const out: Submission[] = [];
  for (const row of rows) {
    const submitted = parseSheetDate(row[0]);
    const district = parseDistrict(row[4]);
    if (!submitted || !district) continue;

    let block = -1;
    for (let k = 0; k < BLOCKS; k++) {
      const start = BLOCK_START + k * BLOCK_SIZE;
      if (row.slice(start, start + BLOCK_SIZE).some((v) => String(v ?? "").trim() !== "")) {
        block = k;
        break;
      }
    }
    if (block < 0) continue;
    const b = row.slice(BLOCK_START + block * BLOCK_SIZE, BLOCK_START + (block + 1) * BLOCK_SIZE);
    const homeChurch = String(b[0] ?? "").replace(/\s+/g, " ").trim();
    if (!homeChurch) continue;

    // Trust the "date held" only when it is close to when the form was sent;
    // typos such as 2035 or a month off fall back to the submission date.
    const held = parseSheetDate(row[1]);
    const sentDay = dayOnly(submitted);
    const heldOk =
      held &&
      held.getTime() <= sentDay.getTime() + 86400000 &&
      held.getTime() >= sentDay.getTime() - 7 * 86400000;
    const report = saturdayOf(heldOk ? held! : submitted);
    const lateCutoff = new Date(report.getFullYear(), report.getMonth(), report.getDate(), LATE_HOUR);

    out.push({
      timestamp: submitted.toISOString(),
      submittedAt: submitted.getTime(),
      reportDate: ymd(report),
      late: submitted.getTime() > lateCutoff.getTime(),
      district: district.label,
      districtCode: district.code,
      homeChurch,
      address: String(b[1] ?? "").trim(),
      leader: String(row[2] ?? "").trim(),
      leaderPhone: String(row[3] ?? "").trim(),
      dhcBirthed: toNumber(b[2]),
      freshDhc: toNumber(b[3]),
      offering: toNumber(b[4]),
      newComers: toNumber(b[5]),
      attendance: toNumber(b[6]),
      soulsWon: toNumber(b[7]),
      slipsCollected: toNumber(b[8]),
      slipsFollowedUp: toNumber(b[9]),
    });
  }
  return out;
}

// "No of DHC" per district from rows like ["District 1", "11"].
export function parseDhcCounts(rows: string[][]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const d = parseDistrict(String(row[0] ?? ""));
    const n = toNumber(row[1]);
    if (d && n !== null && /^district/i.test(String(row[0]).trim())) out[d.label] = n;
  }
  return out;
}

function emptyTotals(): Omit<DistrictWeek, "district"> {
  return {
    dhcCount: 0, submissions: 0, attendance: 0, newComers: 0, soulsWon: 0, offering: 0,
    slipsCollected: 0, slipsFollowedUp: 0, dhcBirthed: 0, freshDhc: 0, late: 0, missingAttendance: 0,
  };
}

// Builds one report per Saturday, newest first.
export function buildWeeks(
  submissions: Submission[],
  dhcCounts: Record<string, number>,
  rosterWeeks = 8
): WeekReport[] {
  const byWeek = new Map<string, Map<string, Submission>>();
  const duplicates = new Map<string, number>();
  for (const s of [...submissions].sort((a, b) => a.submittedAt - b.submittedAt)) {
    const week = byWeek.get(s.reportDate) ?? new Map<string, Submission>();
    const key = `${s.district}|${homeChurchKey(s.homeChurch)}`;
    if (week.has(key)) duplicates.set(s.reportDate, (duplicates.get(s.reportDate) ?? 0) + 1);
    week.set(key, s); // latest submission wins
    byWeek.set(s.reportDate, week);
  }

  const dates = [...byWeek.keys()].sort().reverse();
  const allDistricts = new Set<string>(Object.keys(dhcCounts));
  submissions.forEach((s) => allDistricts.add(s.district));
  const districtList = [...allDistricts].sort((a, b) => districtSortKey(a) - districtSortKey(b));

  return dates.map((date, index) => {
    const subs = [...byWeek.get(date)!.values()];
    const districts: DistrictWeek[] = districtList.map((district) => {
      const mine = subs.filter((s) => s.district === district);
      const sum = (f: keyof Submission) => mine.reduce((n, s) => n + ((s[f] as number | null) ?? 0), 0);
      return {
        district,
        dhcCount: dhcCounts[district] ?? null,
        submissions: mine.length,
        attendance: sum("attendance"),
        newComers: sum("newComers"),
        soulsWon: sum("soulsWon"),
        offering: sum("offering"),
        slipsCollected: sum("slipsCollected"),
        slipsFollowedUp: sum("slipsFollowedUp"),
        dhcBirthed: sum("dhcBirthed"),
        freshDhc: sum("freshDhc"),
        late: mine.filter((s) => s.late).length,
        missingAttendance: mine.filter((s) => s.attendance === null).length,
      };
    });

    const totals = emptyTotals();
    for (const d of districts) {
      totals.dhcCount = (totals.dhcCount ?? 0) + (d.dhcCount ?? 0);
      for (const k of Object.keys(totals) as (keyof typeof totals)[]) {
        if (k !== "dhcCount") (totals[k] as number) += d[k] as number;
      }
    }

    // Home churches that reported in the previous few weeks but not this one.
    const recent = new Map<string, Map<string, string>>();
    for (const older of dates.slice(index + 1, index + 1 + rosterWeeks)) {
      for (const s of byWeek.get(older)!.values()) {
        const m = recent.get(s.district) ?? new Map<string, string>();
        if (!m.has(homeChurchKey(s.homeChurch))) m.set(homeChurchKey(s.homeChurch), s.homeChurch);
        recent.set(s.district, m);
      }
    }
    const thisWeek = new Set(subs.map((s) => `${s.district}|${homeChurchKey(s.homeChurch)}`));
    const notSubmitted: Record<string, string[]> = {};
    for (const [district, names] of recent) {
      const missing = [...names.entries()]
        .filter(([key]) => !thisWeek.has(`${district}|${key}`))
        .map(([, name]) => name)
        .sort();
      if (missing.length) notSubmitted[district] = missing;
    }

    return {
      date,
      districts,
      totals,
      submissions: subs.sort(
        (a, b) => districtSortKey(a.district) - districtSortKey(b.district) || a.homeChurch.localeCompare(b.homeChurch)
      ),
      duplicatesRemoved: duplicates.get(date) ?? 0,
      notSubmitted,
    };
  });
}
