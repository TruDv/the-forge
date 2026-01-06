import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Default to the update page if 'next' is missing
  const next = searchParams.get('next') ?? '/auth/update-password';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there is an error, send to login with the error message
  return NextResponse.redirect(`${origin}/auth/login?error=Session link expired`);
}