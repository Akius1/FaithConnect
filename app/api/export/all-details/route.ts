import { NextRequest, NextResponse } from "next/server";
import { contactScopeFilter, requireCounsellor } from "@/src/lib/access";
import { getSupabase, selectAll } from "@/src/lib/supabase";
import ExcelJS from "exceljs";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";


export async function GET(request: NextRequest) {
  try {
    const guard = await requireCounsellor();
    if (guard.error) return guard.error;
    const { searchParams } = request.nextUrl;

    // Retrieve query parameters
    const period = searchParams.get("period") || "all";
    const search = searchParams.get("search") || "";

    // Build a base query from the "contacts" table
    let query = getSupabase().from("contacts").select("*");
    // Counsellors only export the contacts they can see.
    const scope = await contactScopeFilter(guard.access);
    if (scope) query = query.or(scope);

    // Optional filtering by phone
    if (search) {
      query = query.ilike("phone", `%${search}%`);
    }

    const now = new Date();
    if (period === "day") {
      const start = startOfDay(now).toISOString();
      const end = endOfDay(now).toISOString();
      query = query.gte("createdAt", start).lte("createdAt", end);
    } else if (period === "week") {
      const start = startOfWeek(now, { weekStartsOn: 0 }).toISOString();
      const end = endOfWeek(now, { weekStartsOn: 0 }).toISOString();
      query = query.gte("createdAt", start).lte("createdAt", end);
    } else if (period === "month") {
      const start = startOfMonth(now).toISOString();
      const end = endOfMonth(now).toISOString();
      query = query.gte("createdAt", start).lte("createdAt", end);
    } else if (period === "year") {
      const start = startOfYear(now).toISOString();
      const end = endOfYear(now).toISOString();
      query = query.gte("createdAt", start).lte("createdAt", end);
    } else if (period === "custom") {
      // Validate that custom date parameters are provided
      const customStart = searchParams.get("start");
      const customEnd = searchParams.get("end");

      if (!customStart || !customEnd) {
        return NextResponse.json(
          { error: "Custom date range parameters 'start' and 'end' are required." },
          { status: 400 }
        );
      }

      const startDate = new Date(customStart);
      const endDate = new Date(customEnd);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format provided for custom date range." },
          { status: 400 }
        );
      }

      if (startDate > endDate) {
        return NextResponse.json(
          { error: "Start date must be before or equal to end date." },
          { status: 400 }
        );
      }

      query = query
        .gte("createdAt", startDate.toISOString())
        .lte("createdAt", endDate.toISOString());
    }

    // Execute the query
    // Page past PostgREST's 1000-row cap; the builder re-runs on each await.
    const ordered = query.order("id", { ascending: true });
    let data;
    try {
      data = await selectAll((from, to) => ordered.range(from, to));
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    // Create an Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("AllDetails");

    if (data && data.length > 0) {
      // Dynamically build column headers based on keys from the first row
      const columns = Object.keys(data[0]).map((key) => ({
        header: key,
        key,
      }));
      worksheet.columns = columns;

      // Add each data row to the worksheet
      data.forEach((row) => {
        worksheet.addRow(row);
      });
    } else {
      // If no data is available, add a single row stating so
      worksheet.addRow({ info: "No data available" });
    }

    // Convert the workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return the file as a downloadable attachment
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="all_details.xlsx"',
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
