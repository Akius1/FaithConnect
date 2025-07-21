/* eslint-disable @typescript-eslint/no-explicit-any */
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

    // Add sorting by district (ascending order) and then by createdAt (descending for most recent first)
    query = query.order("district", { ascending: true }).order("createdAt", { ascending: false });

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
    let header = `*📋 Contacts Share Summary*\n`;
    header += `*📅 Period:* ${getPeriodLabel(period)}\n`;
    header += `*📊 Found:* ${count} contact${count !== 1 ? "s" : ""}\n`;
    header += `*📍 Sorted by:* District (A-Z)\n\n`;

    let contactsMessage = "";
    if (data && data.length > 0) {
      // Group contacts by district for better organization
      const contactsByDistrict = data.reduce((acc: any, contact: any) => {
        const district = contact.district || "Unknown District";
        if (!acc[district]) {
          acc[district] = [];
        }
        acc[district].push(contact);
        return acc;
      }, {});

      // Build message grouped by district
      contactsMessage = Object.entries(contactsByDistrict)
        .sort(([a], [b]) => a.localeCompare(b)) // Sort districts alphabetically
        .map(([district, contacts]: [string, any]) => {
          let districtSection = `*🏘️ ${district}*\n`;
          districtSection += `━━━━━━━━━━━━━━━━\n`;
          
          districtSection += (contacts as any[])
            .map((record, index) => {
              let recordStr = `*${index + 1}.* `;

              // Concatenate firstName and lastName into a single "Name" field
              const fullName = [record.firstName, record.lastName].filter(Boolean).join(" ");
              recordStr += `*${fullName || "N/A"}*\n`;

              // Iterate over all keys excluding the ones specified
              for (const [key, value] of Object.entries(record)) {
                if (!excludedKeys.includes(key) && key !== "district") {
                  // Format key names for better readability
                  const formattedKey = formatKeyName(key);
                  const displayValue = value == null || value === "" ? "N/A" : value;
                  recordStr += `   ${formattedKey}: ${displayValue}\n`;
                }
              }
              return recordStr.trim();
            })
            .join("\n\n");
          
          return districtSection;
        })
        .join("\n\n");
    } else {
      contactsMessage = "📭 No contacts available for the selected criteria.";
    }

    const message = header + contactsMessage;

    return NextResponse.json({ message }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to get readable period labels
function getPeriodLabel(period: string): string {
  switch (period) {
    case "day":
      return "Today";
    case "week":
      return "This Week";
    case "month":
      return "This Month";
    case "year":
      return "This Year";
    case "custom":
      return "Custom Range";
    default:
      return "All Time";
  }
}

// Helper function to format database key names for display
function formatKeyName(key: string): string {
  // Convert camelCase to readable format
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
}