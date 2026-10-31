/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { contactScopeFilter, requireCounsellor } from "@/src/lib/access";
import { getSupabase, selectAll } from "@/src/lib/supabase";
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
    const scope = await contactScopeFilter();
    if (scope) query = query.or(scope);

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
    // Page past PostgREST's 1000-row cap; the builder re-runs on each await.
    const ordered = query.order("id", { ascending: true });
    let data;
    try {
      data = await selectAll((from, to) => ordered.range(from, to));
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
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
    header += `*📍 Sorted by:* District (1-12, then Out station)\n\n`;

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

      // Build message grouped by district with proper numerical sorting
      contactsMessage = Object.entries(contactsByDistrict)
        .sort(([a], [b]) => sortDistricts(a, b)) // Use custom district sorting
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

    // Create multiple sharing options
    const encodedMessage = encodeURIComponent(message);
    
    const sharingUrls = {
      // Simple WhatsApp API link (most reliable)
      whatsappApi: `https://api.whatsapp.com/send?text=${encodedMessage}`,
      
      // WhatsApp Web link (alternative)
      whatsappWeb: `https://web.whatsapp.com/send?text=${encodedMessage}`,
      
      // Mobile WhatsApp scheme (for mobile browsers)
      whatsappMobile: `whatsapp://send?text=${encodedMessage}`,
      
      // Raw message for manual copying
      rawMessage: message
    };

    return NextResponse.json({ 
      message, 
      sharingUrls,
      // Keep backward compatibility
      whatsappUrl: sharingUrls.whatsappApi 
    }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Custom sorting function for districts
function sortDistricts(a: string, b: string): number {
  // Helper function to extract district number
  const getDistrictNumber = (district: string): number => {
    const match = district.match(/District (\d+)/i);
    return match ? parseInt(match[1], 10) : Infinity;
  };

  const numA = getDistrictNumber(a);
  const numB = getDistrictNumber(b);

  // If both are numbered districts, sort numerically
  if (numA !== Infinity && numB !== Infinity) {
    return numA - numB;
  }

  // If one is numbered and other is not, numbered comes first
  if (numA !== Infinity && numB === Infinity) {
    return -1;
  }
  if (numA === Infinity && numB !== Infinity) {
    return 1;
  }

  // If both are non-numbered (like "Out station"), sort alphabetically
  return a.localeCompare(b);
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