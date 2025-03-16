import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First, delete related feedback rows to avoid foreign key violation
    const { error: feedbackError } = await supabase
      .from("feedback")
      .delete()
      .eq("contact_id", id);

    if (feedbackError) {
      console.error("Error deleting feedback for contact:", feedbackError);
      return NextResponse.json({ error: feedbackError.message }, { status: 500 });
    }

    // Now, delete the contact
    const { data, error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting contact:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Contact deleted successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE endpoint:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params; // Await params to get the id
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Error fetching contact:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
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
  
  export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params;
      const body = await request.json();
      // Expect body to include fields such as firstName, lastName, address, phone, and prayerPoint
      const { data, error } = await supabase
        .from("contacts")
        .update(body)
        .eq("id", id);
      if (error) {
        console.error("Error updating contact:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(
        { message: "Contact updated successfully", data },
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