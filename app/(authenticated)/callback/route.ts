import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  
  // If there's an error, redirect to login with error parameters
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${error}&error_description=${error_description}`, requestUrl.origin)
    );
  }

  // If there's a code, exchange it for a session
  if (code) {
    try {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      // If there's an error, redirect to login with a generic error message
      return NextResponse.redirect(
        new URL('/login?error=server_error&error_description=Failed+to+sign+in', requestUrl.origin)
      );
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
}
