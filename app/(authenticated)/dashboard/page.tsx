// app/(authenticated)/dashboard/page.tsx (Note the new folder)
// Remove server-side imports for data fetching and user check (handled by layout)
// import { createClient } from '@/utils/supabase/server';
// import { redirect } from 'next/navigation';

import SignOutButton from "@/app/(authenticated)/dashboard/signout-button";
import CsvUploadForm from "../../components/csvUploadForm"; // Keep if placed outside chat/panels
// Import all the Client Panel Components and the CoPilotChat UI component
import CoPilotChat from "../../components/CoPilotChat"; // This is now just the chat UI
import ContactListPanel from "../../components/ContactListPanel";
import PropertiesPanel from "../../components/PropertiesPanel";
import DealsPanel from "../../components/DealsPanel";

// No need to import ChatMessage or data interfaces here, they are in context
// import { ChatMessage } from '@/app/context/ChatContext';
// interface Contact { ... }
// interface MockProperty { ... }
// interface MockDeal { ... }
// Mock data can also be removed from here if defined in the layout

// No need for async as data is fetched in the layout
export default function Dashboard() {
  // Get the user from context if needed for display, or pass from layout
  // For simplicity, let's pass email from layout or context if available
  // Or fetch user client-side if only needed for display in a client component
  // For now, let's remove the welcome message that used user.email here.

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header (can be in layout or page) */}
      {/* Keeping header in page for now, needs SignOutButton which is client */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            AgentFlow AI
          </h1>
          <SignOutButton /> {/* SignOutButton needs to be a Client Component */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8">
        {/* Main container for ALL dashboard content */}
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome section (Simplified or removed if user data not readily available here) */}
          {/* Moved Welcome message to layout or a client component */}
          {/* <div className="text-center"> ... </div> */}
          {/* --- Main Layout Grid for Co-Pilot and Panels --- */}
          {/* This grid is now in the page, arranging chat and panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: AI Command Center Panel (Chat UI Only) */}
            {/* CoPilotChat now ONLY renders the chat UI */}
            <div>
              {" "}
              {/* Simple div for grid item */}
              <CoPilotChat /> {/* No initial data props needed here anymore */}
            </div>

            {/* Column 2: Structured Data Panels (Stacked Vertically) */}
            <div className="flex flex-col gap-8">
              {/* Properties Panel */}
              <PropertiesPanel />{" "}
              {/* No initial data props needed here anymore */}
              {/* Deals Panel */}
              <DealsPanel /> {/* No initial data props needed here anymore */}
            </div>
          </div>{" "}
          {/* End Grid */}
          {/* Contacts Panel (Optional: Render here if it doesn't fit the grid layout above) */}
          {/* OR keep it in the grid as in previous steps. Let's keep it in the grid. */}
          {/* CSV Import Section (remains outside the main grid) */}
          <div className="max-w-md mx-auto mt-8">
            <CsvUploadForm />{" "}
            {/* CsvUploadForm needs to be a Client Component */}
          </div>
        </div>{" "}
        {/* End Max Width Container */}
      </main>

      {/* Footer (remains the same) */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} AgentFlow AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
