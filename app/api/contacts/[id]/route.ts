// app/api/contacts/[id]/route.ts

import { NextResponse } from "next/server";
import { canSeeContact, requireAdmin, requireCounsellor } from "@/src/lib/access";
import { getSupabase } from "@/src/lib/supabase";


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

// GET a single contact by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireCounsellor();
    if (guard.error) return guard.error;
    const { id } = await params;
    if (!(await canSeeContact())) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    
    const { data, error } = await getSupabase()
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching contact:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// UPDATE a contact by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireCounsellor();
    if (guard.error) return guard.error;
    const { id } = await params;
    if (!(await canSeeContact())) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    const body = await request.json();

    // Validate required fields
    if (!body.phone || !body.contactDate) {
      return NextResponse.json(
        { error: "Missing required fields: phone and contactDate are required" },
        { status: 400 }
      );
    }

    // Validate phone number format (Nigerian format)
    const phoneRegex = /^0[7-9]\d{9}$/;
    if (!phoneRegex.test(body.phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Use Nigerian format (e.g., 08012345678)" },
        { status: 400 }
      );
    }

    // Validate district if provided
    if (body.district && !VALID_DISTRICTS.includes(body.district)) {
      return NextResponse.json(
        { error: `Invalid district. Must be one of: ${VALID_DISTRICTS.join(", ")}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      firstName: body.firstName?.trim() || null,
      lastName: body.lastName?.trim() || null,
      address: body.address?.trim() || null,
      phone: body.phone.trim(),
      prayerPoint: body.prayerPoint?.trim() || null,
      contactType: body.contactType || null,
      serviceType: body.serviceType || null,
      contactDate: body.contactDate,
      gender: body.gender || null,
      district: body.district || null,
    };

    const { data, error } = await getSupabase()
      .from("contacts")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating contact:", error);
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
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE a contact by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;
    const { id } = await params;

    // First, delete related feedback rows to avoid foreign key violation
    const { error: feedbackError } = await getSupabase()
      .from("feedback")
      .delete()
      .eq("contact_id", id);

    if (feedbackError) {
      console.error("Error deleting feedback for contact:", feedbackError);
      return NextResponse.json(
        { error: `Failed to delete related feedback: ${feedbackError.message}` },
        { status: 500 }
      );
    }

    // Now, delete the contact
    const { data, error } = await getSupabase()
      .from("contacts")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error deleting contact:", error);
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
        message: "Contact deleted successfully",
        data: data[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}