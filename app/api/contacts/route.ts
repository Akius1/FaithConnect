// app/api/contacts/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
}

// Supabase Admin Client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

// Valid district values
const VALID_DISTRICTS = [
  "District 1",
  "District 2A",
  "District 2B",
  "District 3A",
  "District 3B",
  "District 4",
  "District 5",
  "District 7",
  "District 8",
  "District 9",
  "District 10",
  "District 11",
  "Out Station",
];

export async function POST(request: Request) {
  try {
    const {
      firstName,
      lastName,
      address,
      phone,
      prayerPoint,
      contactType,
      serviceType,
      contactDate,
      gender,
      district,
    } = await request.json();

    // Validate required fields
    if (!phone || !contactDate) {
      return NextResponse.json(
        { error: "Missing required fields: phone and contactDate are required" },
        { status: 400 }
      );
    }

    // Validate phone number format (Nigerian format)
    const phoneRegex = /^0[7-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Use Nigerian format (e.g., 08012345678)" },
        { status: 400 }
      );
    }

    // Validate district if provided
    if (district && !VALID_DISTRICTS.includes(district)) {
      return NextResponse.json(
        { error: `Invalid district. Must be one of: ${VALID_DISTRICTS.join(", ")}` },
        { status: 400 }
      );
    }

    // Prepare data for insertion
    const contactData = {
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      address: address?.trim() || null,
      phone: phone.trim(),
      prayerPoint: prayerPoint?.trim() || null,
      contactType: contactType || null,
      serviceType: serviceType || null,
      contactDate: contactDate,
      gender: gender || null,
      district: district || null, // Will be auto-assigned by trigger if null
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from("contacts")
      .insert([contactData])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Contact added successfully",
        data: data[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");
    const contactType = searchParams.get("contactType");
    const serviceType = searchParams.get("serviceType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = supabase
      .from("contacts")
      .select("*")
      .order("contactDate", { ascending: false });

    // Apply filters if provided
    if (district && district !== "all") {
      query = query.eq("district", district);
    }

    if (contactType && contactType !== "all") {
      query = query.eq("contactType", contactType);
    }

    if (serviceType && serviceType !== "all") {
      query = query.eq("serviceType", serviceType);
    }

    if (startDate) {
      query = query.gte("contactDate", startDate);
    }

    if (endDate) {
      query = query.lte("contactDate", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Optional: Add PUT endpoint for updates
export async function PUT(request: Request) {
  try {
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // Validate district if being updated
    if (updateData.district && !VALID_DISTRICTS.includes(updateData.district)) {
      return NextResponse.json(
        { error: `Invalid district. Must be one of: ${VALID_DISTRICTS.join(", ")}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Contact updated successfully",
        data: data[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Optional: Add DELETE endpoint
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Contact deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}