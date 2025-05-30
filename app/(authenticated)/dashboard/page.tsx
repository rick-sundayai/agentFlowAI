// app/(authenticated)/dashboard/page.tsx
// Remove server-side imports for data fetching (handled by layout)
// import { createClient } from '@/utils/supabase/server';
// import { redirect } from 'next/navigation'; // redirect is used implicitly by layout

import SignOutButton from "@/app/(authenticated)/dashboard/signout-button";
// CsvUploadForm removed as requested previously

// Import all the Client Panel Components and the CoPilotChat UI component
import CoPilotChat from '@/app/components/CoPilotChat'; // This is just the chat UI
import ContactListPanel from '@/app/components/ContactListPanel'; // Will place in right stack
import PropertiesPanel from '@/app/components/PropertiesPanel';   // Will place in right stack
import DealsPanel from '@/app/components/DealsPanel';         // Will place in right stack
import SummaryCardsPanel from '@/app/components/SummaryCardsPanel'; // This panel is removed
import RecentContactsPanel from '@/app/components/RecentContactsPanel'; // Will place in right stack
import TotalContactsPanel from '@/app/components/TotalContactsPanel'; // Will place in right stack
import Sidebar from '@/app/components/Sidebar'; // Sidebar component

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      {/* Header remains the same */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            AgentFlow AI
          </h1>
          <SignOutButton />
        </div>
      </header>
      {/* Main Content Area: Sidebar + Dashboard Panels */}
      {/* Use a flex container to put sidebar on the left and main content on the right */}
      <div className="flex flex-grow">
        {" "}
        {/* flex-grow to fill remaining vertical space */}
        {/* --- Left Sidebar --- */}
        <Sidebar /> {/* Sidebar component */}
        {/* --- Main Dashboard Content Area (to the right of the sidebar) --- */}
        {/* This area will contain the welcome, chat, and other panels */}
        <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          {" "}
          {/* Add overflow-y-auto for scrolling */}
          <div className="max-w-7xl mx-auto space-y-8">
            {" "}
            {/* Inner container for spacing */}
            {/* Welcome section (remains the same) */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {" "}
                {/* Increased text size slightly */}
                Welcome to your Command Center!
              </h2>
              <p className="mt-1 text-md text-gray-600 dark:text-gray-300">
                Your AI Co-Pilot is ready to assist.
              </p>
            </div>
            {/* --- Main Layout Grid (AI Chat + Right Panels) --- */}
            {/* Use a grid with CoPilotChat taking 3/4 and panels stacked on the right 1/4 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {" "}
              {/* Adjusted grid: 4 columns on large */}
              {/* Column 1: AI Command Center Panel (Chat UI Only) - Takes 3/4 space */}
              <div className="lg:col-span-3">
                {" "}
                {/* col-span-3 on large screens */}
                <CoPilotChat /> {/* CoPilotChat UI */}
              </div>
              {/* Column 2: Structured Data Panels (Stacked Vertically) - Takes 1/4 space */}
              <div className="flex flex-col gap-8 lg:col-span-1">
                {" "}
                {/* col-span-1 on large screens */}
                {/* Total Contacts Panel (New Summary Card) */}
                <TotalContactsPanel />
                {/* Recent Contacts Panel */}
                <RecentContactsPanel />
                {/* Properties Panel */}
                <PropertiesPanel />
                {/* Deals Panel (Active Deals) */}
                <DealsPanel />
                {/* Original Contact List Panel (Full List) - Decide where this fits */}
                {/* <ContactListPanel /> */}
              </div>
            </div>{" "}
            {/* End Main Layout Grid */}
            {/* CSV Import Section (removed from main dashboard view) */}
            {/* Decide where this fits, e.g., in a settings page/modal */}
          </div>{" "}
          {/* End Inner container */}
        </main>{" "}
        {/* End Main Dashboard Content Area */}
      </div>{" "}
      {/* End Main Content Area: Sidebar + Dashboard Panels */}
      {/* Footer (remains the same) */}
      {/* Footer might need adjustments if the main content area has fixed height/overflow */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} AgentFlow AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
