// app/api/submit/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    const { firstName, lastName, address, phone, prayerPoint } = await request.json();

    // Insert a new record into the "contacts" table
    const { data, error } = await supabase
      .from('contacts')
      .insert([{ firstName, lastName, address, phone, prayerPoint }]);

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Contact added successfully', data },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}




export async function GET() {
  const { data, error } = await supabase.from('contacts').select('*');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 200 });
}
