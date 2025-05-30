// app/context/ChatContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Import Supabase User type
import { User } from '@supabase/supabase-js';

// Define the types for our chat data
export interface ContactData { 
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  property_address?: string;
}

export interface ChatMessage {
  id: string | number;
  sender: 'user' | 'ai';
  text: string;
  type: string;
  data?: any;
  timestamp: number;
  isProcessing?: boolean;
  isError?: boolean;
  isRetryable?: boolean;
}

interface MockProperty { 
  id: string; 
  address: string; 
  city: string; 
  state: string; 
  zip: string; 
  type: string; 
  status: string; 
  price: number; 
}

interface MockDeal { 
  id: string; 
  clientName: string; 
  propertyAddress: string; 
  type: string; 
  status: string; 
  closeDate?: string; 
  commission?: number; 
}

interface SummaryData { 
  totalContacts: number; 
  activeDeals: number; 
}

interface RecentContact { 
  id: string; 
  name: string; 
  status?: string; 
  lastActivity?: string; 
  value?: number; 
}


interface ChatContextType {
  messages: ChatMessage[]; isProcessing: boolean; isTyping: boolean;
  sendMessage: (text: string) => Promise<void>;
  retryMessage: (messageId: number | string) => Promise<void>;
  clearConversation: () => Promise<void>;
  lastError: string | null;
  userId: string;
  // --- New: Provide User Object via Context ---
  user: User | null; // Add the user object to the context type
  // --- Panel Data States (Keep these) ---
  displayedContacts: ContactData[];
  displayedProperties: MockProperty[];
  displayedDeals: MockDeal[];
  displayedSummaryData: SummaryData;
  displayedRecentContacts: RecentContact[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
  // Remove userId here as it comes from initialUser
  // userId: string;
  // --- New: Accept Initial User Object ---
  initialUser: User | null; // Accept the user object fetched in the layout
  initialMessages: ChatMessage[];
  initialContacts: ContactData[];
  initialProperties: MockProperty[];
  initialDeals: MockDeal[];
  initialSummaryData: SummaryData;
  initialRecentContacts: RecentContact[];
}

export function ChatProvider({
  children,
  // Accept initial user instead of userId string
  initialUser,
  initialMessages, initialContacts, initialProperties, initialDeals,
  initialSummaryData, initialRecentContacts,
}: ChatProviderProps) {
  // --- New: State for User Object, initialized with initialUser ---
  const [userState, setUserState] = useState<User | null>(initialUser);
  // Derive userId from userState
  const userId = userState?.id || ''; // Provide a default empty string if user is null


  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  // --- Panel Data States (Keep these) ---
  const [displayedContacts, setDisplayedContacts] = useState<ContactData[]>(initialContacts);
  const [displayedProperties, setDisplayedProperties] = useState<MockProperty[]>(initialProperties);
  const [displayedDeals, setDisplayedDeals] = useState<MockDeal[]>(initialDeals);
  const [displayedSummaryData, setDisplayedSummaryData] = useState<SummaryData>(initialSummaryData);
  const [displayedRecentContacts, setDisplayedRecentContacts] = useState<RecentContact[]>(initialRecentContacts);


  const supabase = createClient();

  // Initial message placeholder logic (remains the same)
  useEffect(() => {
      if (initialMessages.length === 0 && messages.length === 0) { /* ... add welcome message ... */ }
  }, [initialMessages, messages.length]);

  // Function to add a message to the state (remains the same)
  const addMessageToState = useCallback((messageData: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => { /* ... */ }, []);


  // Send a message to the API and handle persistence and Panel updates
  // userId dependency now comes from userState
  const sendMessage = useCallback(async (text: string) => { /* ... */ }, [isProcessing, userState, messages, addMessageToState, setDisplayedContacts, setDisplayedProperties, setDisplayedDeals, setDisplayedSummaryData, setDisplayedRecentContacts]);


  // retryMessage dependency now comes from userState
  const retryMessage = useCallback(async (messageId: number | string) => { /* ... */ }, [messages, sendMessage, userState]);


  // clearConversation dependency now comes from userState
  const clearConversation = useCallback(async () => { /* ... */ }, [userState]);


  const value: ChatContextType = {
    messages, isProcessing, isTyping, sendMessage, retryMessage,
    clearConversation, lastError, userId, // userId derived from userState
    // --- Provide User Object and Panel Data States via Context ---
    user: userState, // Provide the user object
    displayedContacts, displayedProperties, displayedDeals,
    displayedSummaryData, displayedRecentContacts,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}