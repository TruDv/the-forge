import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const ONESIGNAL_APP_ID = "e2ae7af9-258c-4cbe-8397-99a8cc438376"; // Your App ID
const ONESIGNAL_REST_API_KEY = "os_v2_app_4kxhv6jfrrgl5a4xtgumyq4do2a6ttlb6nxe2hujupdz4pls3xhufmvrzjdst4s54nag4u72sczezsdwhz7rvgnq5csdz6bb6yt7kvy"; // <--- NEED THIS FROM DASHBOARD

// Admin Supabase (To fetch user IDs)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { message, author_name, exclude_id } = await req.json();

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
      url: "https://the-forge.vercel.app" // Change this to your actual URL when live
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