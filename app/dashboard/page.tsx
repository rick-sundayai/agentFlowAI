// app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server'; // Use the server client
import { redirect } from 'next/navigation';
import SignOutButton from './signout-button'; // Client Component for sign out
import AddContactButton from './add-contact-button'; // Client Component for adding contacts
import CsvUploadForm from '../components/csvUploadForm'; // CSV import functionality

// Define the type for contact data
interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  property_address: string | null;
  // Add other fields as needed
}

export default async function Dashboard() {
  // Create a Supabase client instance on the server side
  const supabase = await createClient();

  // Fetch the user session. Use getUser() for a secure check on the server.
  const { data: { user } } = await supabase.auth.getUser();

  // If no user is logged in, redirect to the login page
  if (!user) {
    redirect('/login');
  }

  // Fetch contacts for the logged-in user
  // Note: This assumes you have a 'contacts' table with RLS configured
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, user_id, name, phone, email, property_address')
    .order('name');

  if (contactsError) {
    console.error('Error fetching contacts:', contactsError);
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header with navigation */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            AgentFlow AI
          </h1>
          <SignOutButton />
        </div>
      </header>
      
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome section */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome, <span className="text-indigo-600 dark:text-indigo-400">{user.email}</span>
            </h2>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              This is your Command Center. Your AI Co-Pilot is ready to assist.
            </p>
          </div>
          
          {/* AI Command Center Area */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8 border border-indigo-100 dark:border-indigo-900">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-indigo-600 dark:text-indigo-400 mr-2">AI</span> Co-Pilot
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400 italic">
              <p>Imagine a chat window here where you can type commands like "Show my contacts," "Add John Doe," etc.</p>
            </div>
          </div>
          
          {/* Contacts Section */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-indigo-100 dark:border-indigo-900">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Contacts</h3>
              <AddContactButton />
            </div>
            
            {contactsError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md mb-4">
                Error loading contacts. Please try again.
              </div>
            )}
            
            {/* Display the contacts */}
            {contacts && contacts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {contacts.map((contact: Contact) => (
                  <div key={contact.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">{contact.name}</h4>
                      <div className="flex space-x-1">
                        <button className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                          <span className="sr-only">Edit</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {contact.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {contact.email}
                      </p>
                    )}
                    {contact.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {contact.phone}
                      </p>
                    )}
                    {contact.property_address && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {contact.property_address}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No contacts found. Add some to get started!</p>
                <div className="mt-4">
                  <AddContactButton />
                </div>
              </div>
            )}
          </div>
          
          {/* CSV Import Section */}
          <CsvUploadForm />
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} AgentFlow AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}