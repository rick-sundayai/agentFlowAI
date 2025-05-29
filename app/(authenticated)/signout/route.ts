// app/auth/signout/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
// No need to import { cookies } from 'next/headers' directly here
// if createClient already handles it internally

export async function POST(request: Request) { // Accept the request object
  // Instantiate the Supabase client using the server utility
  // The utility itself gets the cookies() instance internally
  const supabase = await createClient();

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to the login page (or home page, as you had)
  // Using request.url.origin is generally safer for redirects
  const requestUrl = new URL(request.url);
  return NextResponse.redirect(new URL('/login', requestUrl.origin), {
     status: 307, // Use 307 for temporary redirect with POST
  });
  // Or if you prefer redirecting to home:
  // return NextResponse.redirect(new URL('/', requestUrl.origin), { status: 307 });
}