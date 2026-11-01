import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/src/lib/access";
import { sheetsConfigured } from "@/src/lib/reports/sheets";
import { loadWeeklyReports } from "@/src/lib/reports/load";
import type { Submission } from "@/src/lib/reports/parse";

function label(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Super admin: Excel workbook for one week (?date=YYYY-MM-DD, default latest),
// compared with the week before. ?meeting=1 leaves out reports sent after 8pm;
// ?offering=1 includes offering.
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  if (!sheetsConfigured()) return NextResponse.json({ error: "Google Sheets is not connected yet." }, { status: 501 });

  const params = new URL(request.url).searchParams;
  const meeting = params.get("meeting") === "1";
  const withOffering = params.get("offering") === "1";
  const weeks = await loadWeeklyReports(26);
  const index = Math.max(0, weeks.findIndex((w) => w.date === params.get("date")));
  const week = weeks[index];
  const previous = weeks[index + 1];
  if (!week) return NextResponse.json({ error: "No reports found" }, { status: 404 });

  const pick = (subs: Submission[]) => (meeting ? subs.filter((s) => !s.late) : subs);
  const sumBy = (subs: Submission[], district: string, f: keyof Submission) =>
    subs.filter((s) => s.district === district).reduce((n, s) => n + ((s[f] as number | null) ?? 0), 0);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Faith Connect";

  // Summary in the same shape as the weekly meeting report.
  const summary = wb.addWorksheet("Summary");
  const weekSubs = pick(week.submissions);
  const prevSubs = previous ? pick(previous.submissions) : [];
  const head = ["District", "No of DHC"];
  const blocks = [previous && { date: previous.date, subs: prevSubs }, { date: week.date, subs: weekSubs }].filter(
    Boolean
  ) as { date: string; subs: Submission[] }[];
  summary.addRow(["", "", ...blocks.flatMap((b) => [label(b.date), "", "", ...(withOffering ? [""] : [])])]);
  summary.addRow([
    ...head,
    ...blocks.flatMap(() => ["DHC Submissions", "Attendance", "New Comers", ...(withOffering ? ["Offering"] : [])]),
  ]);
  const width = withOffering ? 4 : 3;
  blocks.forEach((_, i) => summary.mergeCells(1, 3 + i * width, 1, 2 + (i + 1) * width));
  for (const d of week.districts) {
    summary.addRow([
      d.district,
      d.dhcCount ?? "",
      ...blocks.flatMap((b) => [
        b.subs.filter((s) => s.district === d.district).length,
        sumBy(b.subs, d.district, "attendance"),
        sumBy(b.subs, d.district, "newComers"),
        ...(withOffering ? [sumBy(b.subs, d.district, "offering")] : []),
      ]),
    ]);
  }
  summary.addRow([
    "Total",
    week.totals.dhcCount ?? "",
    ...blocks.flatMap((b) => [
      b.subs.length,
      b.subs.reduce((n, s) => n + (s.attendance ?? 0), 0),
      b.subs.reduce((n, s) => n + (s.newComers ?? 0), 0),
      ...(withOffering ? [b.subs.reduce((n, s) => n + (s.offering ?? 0), 0)] : []),
    ]),
  ]);
  summary.getRow(1).font = { bold: true };
  summary.getRow(2).font = { bold: true };
  summary.lastRow!.font = { bold: true };
  summary.columns.forEach((c, i) => (c.width = i === 0 ? 16 : 15));

  // One row per home church.
  const detail = wb.addWorksheet("Home churches");
  detail.addRow([
    "District", "Home church", "Leader", "Leader phone", "Attendance", "New comers", "Souls won",
    "Slips collected", "Slips followed up", "DHC birthed", "Fresh DHC", ...(withOffering ? ["Offering"] : []),
    "Submitted", "After 8pm",
  ]);
  for (const s of weekSubs) {
    detail.addRow([
      s.district, s.homeChurch, s.leader, s.leaderPhone, s.attendance ?? "", s.newComers ?? "", s.soulsWon ?? "",
      s.slipsCollected ?? "", s.slipsFollowedUp ?? "", s.dhcBirthed ?? "", s.freshDhc ?? "",
      ...(withOffering ? [s.offering ?? ""] : []),
      new Date(s.timestamp).toLocaleString("en-GB"), s.late ? "Yes" : "",
    ]);
  }
  detail.getRow(1).font = { bold: true };
  detail.columns.forEach((c, i) => (c.width = i === 1 ? 34 : i === 2 ? 24 : 14));

  // Home churches that reported recently but not this week.
  const missing = wb.addWorksheet("Not submitted");
  missing.addRow(["District", "Home church"]);
  for (const [district, names] of Object.entries(week.notSubmitted)) {
    names.forEach((n) => missing.addRow([district, n]));
  }
  missing.getRow(1).font = { bold: true };
  missing.columns.forEach((c, i) => (c.width = i === 0 ? 16 : 40));

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="home-church-report-${week.date}.xlsx"`,
    },
  });
}
