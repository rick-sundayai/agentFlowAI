// app/context/ChatContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Define the types for our chat data (Keep these)
export interface ContactData {
  id?: string; // Optional, if your fetched contacts include ID from DB
  name: string;
  phone: string | null;
  email: string | null;
  property_address: string | null;
  // Add other fields as needed
}

export interface ChatMessage {
  id: number | string;
  sender: 'user' | 'ai';
  text: string;
  type: 'text' | 'contacts_list' | 'error' | 'warning' | string;
  data?: Record<string, unknown> | ContactData[] | null;
  timestamp: number;
  isProcessing?: boolean;
  isError?: boolean;
  isRetryable?: boolean;
}

// Define the types for the data displayed in the panels
// Use the same interfaces as defined in dashboard/page.tsx
interface MockProperty {
  id: string; address: string; city: string; state: string; zip: string;
  type: string; status: string; price: number;
}

interface MockDeal {
  id: string; clientName: string; propertyAddress: string;
  type: string; status: string; closeDate?: string; commission?: number;
}


interface ChatContextType {
  messages: ChatMessage[];
  isProcessing: boolean;
  isTyping: boolean;
  sendMessage: (text: string) => Promise<void>;
  retryMessage: (messageId: number | string) => Promise<void>;
  clearConversation: () => Promise<void>;
  lastError: string | null;
  userId: string;
  // --- New: State for Panel Data ---
  displayedContacts: ContactData[];
  displayedProperties: MockProperty[];
  displayedDeals: MockDeal[];
  // --- Optional Setters for Panels (if panels need to update themselves) ---
  // setDisplayedContacts: (contacts: ContactData[]) => void;
  // setDisplayedProperties: (properties: MockProperty[]) => void;
  // setDisplayedDeals: (deals: MockDeal[]) => void;
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
  userId: string;
  initialMessages: ChatMessage[];
  // --- New: Initial Data Props for Panels ---
  initialContacts: ContactData[];
  initialProperties: MockProperty[];
  initialDeals: MockDeal[];
}

export function ChatProvider({
  children,
  userId,
  initialMessages,
  // Destructure new initial data props
  initialContacts,
  initialProperties,
  initialDeals,
}: ChatProviderProps) {
  // Initialize state with initial data
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  // --- New: State for Panel Data, initialized with initial props ---
  const [displayedContacts, setDisplayedContacts] = useState<ContactData[]>(initialContacts);
  const [displayedProperties, setDisplayedProperties] = useState<MockProperty[]>(initialProperties);
  const [displayedDeals, setDisplayedDeals] = useState<MockDeal[]>(initialDeals);


  const supabase = createClient();


  // Initial message placeholder logic (remains the same)
  useEffect(() => {
      if (initialMessages.length === 0 && messages.length === 0) {
          const welcomeMessage: ChatMessage = {
              id: uuidv4(),
              text: "Hello! I'm your AgentFlow AI Co-Pilot. How can I assist you today?",
              sender: 'ai',
              type: 'text',
              data: null,
              timestamp: Date.now(),
              isProcessing: false,
              isError: false,
              isRetryable: false,
          };
          setMessages([welcomeMessage]);
      }
  }, [initialMessages, messages.length]);


  // Function to add a message to the state (remains the same)
  const addMessageToState = useCallback((messageData: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
      const newMessage: ChatMessage = {
          ...messageData,
          id: uuidv4(),
          timestamp: Date.now(),
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      return newMessage;
  }, []);


  // Send a message to the API and handle persistence and Panel updates
  const sendMessage = useCallback(async (text: string) => {
    if (isProcessing || text.trim() === '') return;

    // 1. Add user message to state immediately (remains the same)
    const userMessageToAdd = {
      text: text, sender: 'user' as const, type: 'text', data: null,
      isProcessing: false, isError: false, isRetryable: false,
    };
    const tempUserMessage = addMessageToState(userMessageToAdd);

    setIsProcessing(true);
    setIsTyping(true);
    setLastError(null);

    let aiResponseContent: any = null;
    let commandApiError: Error | null = null;

    try {
      // --- Send command to backend API route (remains the same) ---
      const response = await fetch('/api/copilot-command', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text, userId: userId }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        const errorMessage = errorBody.response?.text || errorBody.error || `HTTP error! status: ${response.status}`;
        commandApiError = new Error(errorMessage);
        throw commandApiError;
      }

      // Get the AI response from the API route
      const result = await response.json();
      aiResponseContent = result.response;

      if (!aiResponseContent || typeof aiResponseContent.text === 'undefined') {
         commandApiError = new Error("Invalid response format from Co-Pilot backend.");
         throw commandApiError;
      }

      // 2. Add AI message to state (remains the same)
      const aiMessageToAdd = {
           text: aiResponseContent.text || '', sender: 'ai' as const,
           type: aiResponseContent.type || 'text', data: aiResponseContent.data || null,
           isProcessing: false, isError: false,
           isRetryable: aiResponseContent.type === 'error',
       };
       addMessageToState(aiMessageToAdd);

       // --- New: Update Panel Data Based on AI Response Type ---
       // Check the type of the AI response and update the corresponding state
       if (aiResponseContent.type === 'contacts_list' && Array.isArray(aiResponseContent.data?.contacts)) {
           // Assuming 'contacts_list' type means the 'data.contacts' should update the contacts panel
           setDisplayedContacts(aiResponseContent.data.contacts as ContactData[]);
       }
       // --- Add checks for other panel types here ---
       // else if (aiResponseContent.type === 'properties_list' && Array.isArray(aiResponseContent.data?.properties)) {
       //     setDisplayedProperties(aiResponseContent.data.properties as MockProperty[]);
       // }
       // else if (aiResponseContent.type === 'deals_list' && Array.isArray(aiResponseContent.data?.deals)) {
       //     setDisplayedDeals(aiResponseContent.data.deals as MockDeal[]);
       // }
       // Add other types that might clear panels or update specific items

    } catch (error: any) {
      console.error("Error sending command or getting AI response:", error);
      setLastError(error.message || 'Unknown error');

      // Add an error message to state (remains the same)
       const errorAiMessageToAdd = {
           text: error.message || 'An unknown error occurred.', sender: 'ai' as const,
           type: 'error', data: null, isProcessing: false, isError: true, isRetryable: true,
       };
       addMessageToState(errorAiMessageToAdd);

    } finally {
      setIsProcessing(false);
      setIsTyping(false);

      // --- Persistence MVP: Save messages to DB asynchronously (remains the same) ---
       const clientSupabase = createClient();
       const saveMessageToDb = async (messageToSave: Omit<ChatMessage, 'id' | 'isProcessing' | 'isError' | 'isRetryable'>) => { /* ... save logic ... */ };

       // Find the user message we just added by its text and temp ID (might need refinement)
       // A more robust way is to save using data captured BEFORE addMessageToState
       const latestUserMessage = messages.find(msg => msg.id === tempUserMessage.id && msg.sender === 'user');
       if (latestUserMessage) {
            const userDataToSave = { /* ... map fields ... */ sender: 'user' as const, text: userMessageToAdd.text, type: userMessageToAdd.type, data: userMessageToAdd.data, timestamp: tempUserMessage.timestamp };
           saveMessageToDb(userDataToSave);
       }

       if (aiResponseContent) {
           const aiDataToSave = { /* ... map fields ... */ sender: 'ai' as const, text: aiResponseContent.text || '', type: aiResponseContent.type || 'text', data: aiResponseContent.data || null, timestamp: Date.now() };
           saveMessageToDb(aiDataToSave);
       } else if (commandApiError) {
            const errorAiMessageToSave = { /* ... map fields ... */ sender: 'ai' as const, text: commandApiError.message || 'An unknown error occurred.', type: 'error', data: null, timestamp: Date.now() };
            saveMessageToDb(errorAiMessageToSave);
       }
      // --- End Persistence MVP ---
    }
  }, [isProcessing, userId, messages, addMessageToState]);


  const retryMessage = useCallback(async (messageId: number | string) => { /* ... retry logic ... */ }, [messages, sendMessage, userId]); // Dependencies


  const clearConversation = useCallback(async () => {
       // Clear state messages
       setMessages([]);
       // Clear panel state as well
       setDisplayedContacts([]);
       setDisplayedProperties([]);
       setDisplayedDeals([]);

       // Persistence MVP: Delete messages from database (remains the same)
       const clientSupabase = createClient();
       try {
            const { error } = await clientSupabase.from('chat_messages').delete().eq('user_id', userId);
            if (error) { console.error("Error clearing messages from DB:", error); setLastError("Failed to clear conversation history from database."); }
            else { console.log("Conversation history cleared from DB."); setLastError(null); }
       } catch (dbError) { console.error("Unexpected error clearing messages from DB:", dbError); setLastError("An unexpected error occurred while clearing history."); }

       // Re-add the initial welcome message after clearing state (useEffect handles if messages.length becomes 0)
        // Add initial welcome message after clearing state if desired immediately
        // const welcomeMessage: ChatMessage = { ... }; addMessageToState(welcomeMessage); // Or let useEffect handle it

   }, [userId]); // Depend on userId


  const value: ChatContextType = {
    messages, isProcessing, isTyping, sendMessage, retryMessage,
    clearConversation, lastError, userId,
    // --- New: Provide Panel Data State via Context ---
    displayedContacts, displayedProperties, displayedDeals,
    // --- Provide Setters if panels need to update themselves directly (less common) ---
    // setDisplayedContacts, setDisplayedProperties, setDisplayedDeals,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}