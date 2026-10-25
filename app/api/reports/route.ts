import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/access";
import { reportSheetUrl, sheetsConfigured } from "@/src/lib/reports/sheets";
import { loadWeeklyReports } from "@/src/lib/reports/load";

// Super admin: weekly home church reports from the Google Form sheet.
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  if (!sheetsConfigured()) {
    return NextResponse.json(
      {
        setup: true,
        sheetUrl: reportSheetUrl(),
        error: "Google Sheets is not connected yet.",
      },
      { status: 501 }
    );
  }

  const params = new URL(request.url).searchParams;
  const weeks = Math.min(Math.max(Number(params.get("weeks")) || 8, 1), 26);
  try {
    const reports = await loadWeeklyReports(weeks, params.get("refresh") === "1");
    return NextResponse.json({ sheetUrl: reportSheetUrl(), fetchedAt: new Date().toISOString(), weeks: reports });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message, sheetUrl: reportSheetUrl() }, { status: 502 });
  }
}
