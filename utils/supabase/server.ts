// utils/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => { // Make the function async
  const cookieStore = await cookies(); // Await the cookies function

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Supabase cookies set method is synchronous but Next.js cookies set is async
            // this is a known issue and can be ignored if you're not using middleware
            // for refreshing session. if you are, use middleware to refresh session
            // and this will be handled automatically.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: -1 });
          } catch (error) {
            // Supabase cookies remove method is synchronous but Next.js cookies set is async
            // this is a known issue and can be ignored if you're not using middleware
            // for refreshing session. if you are, use middleware to refresh session
            // and this will be handled automatically.
          }
        },
      },
    }
  );
};

// This is for direct use in Server Components or API Routes that need await
// Example usage: const supabase = await createClientServer();
// Note: The above simple `createClient` is often sufficient and the one below
// might be more relevant if you were passing `request` directly, but let's stick
// to the Supabase recommended patterns which evolve. The simpler one is preferred
// when `cookies()` is available directly.
/*
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClientServer() {
  const cookieStore = await cookies(); // Await the cookies function

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options }); // Note: still might hit async issues depending on context
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options, maxAge: -1 }); // Note: still might hit async issues depending on context
        },
      },
    }
  );
}
*/