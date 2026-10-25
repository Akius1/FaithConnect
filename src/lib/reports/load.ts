import "server-only";
import { buildWeeks, parseDhcCounts, parseResponses, type WeekReport } from "./parse";
import { fetchReportSheet } from "./sheets";

// Used when the summary tab cannot be read (matches the 2026 summary sheet).
const FALLBACK_DHC: Record<string, number> = {
  "District 1": 11, "District 2A": 10, "District 2B": 6, "District 3A": 18, "District 3B": 15,
  "District 4": 7, "District 5": 2, "District 7": 15, "District 8": 2, "District 9": 1,
  "District 10": 14, "District 11": 15,
};

export async function loadWeeklyReports(weeks = 8, force = false): Promise<WeekReport[]> {
  const { responses, dhc } = await fetchReportSheet(force);
  const counts = parseDhcCounts(dhc);
  const all = buildWeeks(parseResponses(responses), Object.keys(counts).length ? counts : FALLBACK_DHC);
  // Ignore far-future typo weeks (for example 2035) so "latest" is real.
  const horizon = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  return all.filter((w) => w.date <= horizon).slice(0, weeks);
}
