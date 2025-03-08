import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

// Ensure these environment variables are set
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Retrieve query parameters
    const period = searchParams.get("period") || "all";
    const search = searchParams.get("search") || "";

    // Build a base query from the "contacts" table
    let query = supabase.from("contacts").select("*");

    // Optional filtering by phone (or any other field)
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

    // Execute the query to get matching contacts
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Define keys to exclude from the share message
    const excludedKeys = [
      "createdAt",
      "prayerPoint",
      "serviceType",
      "contactType",
      "contactDate",
      "id",
      "firstName",
      "lastName",
    ];

    // Build the shareable WhatsApp message
    const count = data ? data.length : 0;
    let header = `*Contacts Share Summary:*\n`;
    header += `*Period:* ${period}\n`;
    header += `*Search:* ${search || "None"}\n`;
    header += `*Found:* ${count} contact${count !== 1 ? "s" : ""}\n\n`;

    let contactsMessage = "";
    if (data && data.length > 0) {
      contactsMessage = data
        .map((record, index) => {
          let recordStr = `*Contact ${index + 1}:*\n`;

          // Concatenate firstName and lastName into a single "Name" field; if empty, use "N/A"
          const fullName = [record.firstName, record.lastName].filter(Boolean).join(" ");
          recordStr += `*Name:* ${fullName || "N/A"}\n`;

          // Iterate over all keys excluding the ones specified.
          for (const [key, value] of Object.entries(record)) {
            if (!excludedKeys.includes(key)) {
              // If value is null, undefined, or an empty string, show "N/A"
              const displayValue = value == null || value === "" ? "N/A" : value;
              recordStr += `*${key}:* ${displayValue}\n`;
            }
          }
          return recordStr.trim();
        })
        .join("\n\n");
    } else {
      contactsMessage = "No contacts available.";
    }

    const message = header + contactsMessage;

    return NextResponse.json({ message }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
