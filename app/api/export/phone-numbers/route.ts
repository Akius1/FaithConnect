import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

// Make sure these environment variables are set
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // 'period' can be 'all', 'day', 'week', 'month', 'year', or 'custom'
    const period = searchParams.get("period") || "all";
    // 'search' can be any string you want to filter by
    const search = searchParams.get("search") || "";

    // Build a base query from the "contacts" table
    let query = supabase.from("contacts").select("*");

    // Optional: Filter by phone or other fields (here we do an iLike on phone)
    if (search) {
      query = query.ilike("phone", `%${search}%`);
    }

    // If the user selects day/week/month/year, filter by date range
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
      // If you have custom date fields, read them from query params:
      // const customStart = searchParams.get("start");
      // const customEnd = searchParams.get("end");
      // if (customStart && customEnd) {
      //   query = query
      //     .gte("createdAt", new Date(customStart).toISOString())
      //     .lte("createdAt", new Date(customEnd).toISOString());
      // }
      // Otherwise, you might just rely on 'search' or other logic
    }

    // Execute the query
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate an Excel file with phone numbers
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("PhoneNumbers");
    worksheet.columns = [{ header: "Phone Number", key: "phone" }];

    data?.forEach((row) => {
      worksheet.addRow({ phone: row.phone });
    });

    // Convert workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return the file as a downloadable attachment
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="phone_numbers.xlsx"',
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
