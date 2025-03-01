// app/api/submit/route.ts

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
    } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !phone || !contactType || !serviceType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("contacts")
      .insert([
        { firstName, lastName, address, phone, prayerPoint, contactType, serviceType, contactDate },
      ])
      .select(); // Returns the inserted row

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Contact added successfully", data },
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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("contactDate", { ascending: false }); // Get newest first

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
