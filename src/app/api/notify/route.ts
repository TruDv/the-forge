import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const ONESIGNAL_APP_ID = "e2ae7af9-258c-4cbe-8397-99a8cc438376"; 
// SAFETY FIX: Read from environment variable
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { message, author_name, exclude_id } = await req.json();

  // Safety check
  if (!ONESIGNAL_REST_API_KEY) {
    return NextResponse.json({ error: "Server API Key missing" }, { status: 500 });
  }

  // 1. Get all users who have an ID (except the sender)
  const { data: users } = await supabase
    .from('profiles')
    .select('onesignal_id')
    .neq('id', exclude_id) 
    .not('onesignal_id', 'is', null);

  if (!users || users.length === 0) {
    return NextResponse.json({ status: 'No users subscribed yet' });
  }

  // Extract IDs
  const playerIds = users.map(u => u.onesignal_id);

  // 2. Send the Notification via OneSignal
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: author_name || "The Forge" },
      contents: { en: message },
      // Use your production URL, or localhost for testing
      url: process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://the-forge.vercel.app"
    })
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', options);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}