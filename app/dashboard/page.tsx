// app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server'; // Use the server client
import { redirect } from 'next/navigation'; // Use Next.js redirect

export default async function Dashboard() {
  // Create a Supabase client instance on the server side
  const supabase = await createClient();

  // Fetch the user session. Use getUser() for a secure check on the server.
  const { data: { user } } = await supabase.auth.getUser();

  // If no user is logged in, redirect to the login page
  if (!user) {
    // Use the Next.js redirect function for server-side redirects
    redirect('/login');
  }

  // If a user is logged in, fetch some user-specific data (optional for MVP, but good pattern)
  // const { data: profile, error: profileError } = await supabase
  //   .from('profiles') // Assuming you have a profiles table linked to auth.users
  //   .select('*')
  //   .eq('id', user.id)
  //   .single();

  // if (profileError) {
  //   console.error('Error fetching profile:', profileError);
  //   // Handle profile fetch error (e.g., show a message, maybe redirect)
  // }

  // --- Render the Dashboard UI ---
  // This part should contain your actual dashboard content,
  // potentially using the 'user' and 'profile' data

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome to AgentFlow AI, {user.email}!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          This is your dashboard. More content coming soon!
        </p>
        {/* Add a basic logout button */}
        <form action="/auth/signout" method="post">
          <button className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}