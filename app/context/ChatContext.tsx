// app/context/ChatContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// Import the client-side Supabase client
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for initial placeholder/temp IDs

// Define the types for our chat data
// Use string for DB UUIDs later, but number or string for temporary IDs now
export interface ContactData {
  id?: string; // Optional, if your fetched contacts include ID from DB
  name: string;
  phone: string | null;
  email: string | null;
  property_address: string | null;
  // Add other fields as needed
}

export interface ChatMessage {
  // Changed ID to allow for temporary numbers and future DB string UUIDs
  id: number | string;
  sender: 'user' | 'ai';
  text: string;
  // Using 'type' consistently with backend response, replacing dataType
  type: 'text' | 'contacts_list' | 'error' | 'warning' | string;
  data?: Record<string, unknown> | ContactData[] | null; // Allow null for data
  // Timestamp to match backend structure and for ordering
  timestamp: number; // Unix timestamp (milliseconds)
  isProcessing?: boolean; // Frontend state: AI thinking
  isError?: boolean; // Frontend state: Message resulted in error
  isRetryable?: boolean; // Frontend state: Can the message be retried
  // Add other frontend state properties as needed
}

interface ChatContextType {
  messages: ChatMessage[];
  isProcessing: boolean;
  isTyping: boolean;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  sendMessage: (text: string) => Promise<void>;
  retryMessage: (messageId: number | string) => Promise<void>; // Updated ID type
  clearConversation: () => Promise<void>; // Clear is async now
  lastError: string | null;
  userId: string;
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
  // Accept initial messages fetched from the database (optional)
  initialMessages?: ChatMessage[];
}

export function ChatProvider({ children, userId, initialMessages = [] }: ChatProviderProps) {
  // Initialize state with messages fetched from the database or empty array if undefined
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  // Processing state (when sending a message)
  const [isProcessing, setIsProcessing] = useState(false);
  // Typing indicator state (optional simulation)
  const [isTyping, setIsTyping] = useState(false);
  // Last error message
  const [lastError, setLastError] = useState<string | null>(null);

  // Remove localStorage useEffects - history is now loaded from DB


  // Initial message placeholder logic (only if no history is loaded)
  useEffect(() => {
      // If no messages are currently in state
      if (messages.length === 0) {
          const welcomeMessage: ChatMessage = {
              id: uuidv4(), // Use uuid for unique ID, not Date.now()
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
  }, [messages.length]); // Only depend on messages.length


  // Function to save a message to the database
  const saveMessageToDb = useCallback(async (
    supabaseClient: ReturnType<typeof createClient>,
    messageToSave: Omit<ChatMessage, 'id' | 'isProcessing' | 'isError' | 'isRetryable'>,
    userIdToUse: string
  ) => {
    try {
      const { error } = await supabaseClient
        .from('chat_messages')
        .insert({
          user_id: userIdToUse,
          sender: messageToSave.sender,
          text: messageToSave.text,
          type: messageToSave.type,
          data: messageToSave.data, // Supabase handles JSON/JSONB from JS object/array
          created_at: new Date(messageToSave.timestamp).toISOString(), // Convert timestamp number to ISO string
        }); // Don't need to select ID/created_at if not updating state immediately

      if (error) {
        console.error(`Error saving ${messageToSave.sender} message to DB:`, error);
        // Handle DB save error - for MVP, just log
      } else {
        // Optional: Log successful save
        // console.log(`${messageToSave.sender} message saved to DB.`);
      }
    } catch (dbError) {
      console.error(`Unexpected error saving ${messageToSave.sender} message to DB:`, dbError);
      // Handle unexpected errors - for MVP, just log
    }
  }, []);

  // Function to add a message to the state with temporary ID and timestamp
  const addMessageToState = useCallback((messageData: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
      const newMessage: ChatMessage = {
          ...messageData,
          id: uuidv4(), // Use UUID for temporary ID before DB save/realtime sync
          timestamp: Date.now(),
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      return newMessage; // Return the message object including its temp ID
  }, []);


  // Send a message to the API and handle persistence
  const sendMessage = useCallback(async (text: string) => {
    if (isProcessing || text.trim() === '') return;

    // 1. Add user message to state immediately (with temporary ID)
    const userMessageToAdd = {
      text: text,
      sender: 'user' as const, // Assert sender type
      type: 'text', // User messages are typically text
      data: null,
      isProcessing: false, // User message isn't processing state
      isError: false,
      isRetryable: false,
    };
    const tempUserMessage = addMessageToState(userMessageToAdd); // Add to state and get temp ID
    
    // Save user message to database immediately
    const timestamp = tempUserMessage.timestamp;
    const clientSupabase = createClient();
    saveMessageToDb(clientSupabase, {
      sender: 'user',
      text: text,
      type: 'text',
      data: null,
      timestamp: timestamp
    }, userId);

    setIsProcessing(true); // Indicate processing starts for the entire exchange
    setIsTyping(true); // Simulate typing


    let aiResponseContent: any = null; // To hold the parsed response from n8n
    let commandApiError: Error | null = null;

    try {
      // --- Send command to backend API route (which calls n8n) ---
      const response = await fetch('/api/copilot-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text, userId: userId }),
      });

      if (!response.ok) {
        // Handle non-2xx API errors
        const errorBody = await response.json();
        const errorMessage = errorBody.response?.text || errorBody.error || `HTTP error! status: ${response.status}`;
        commandApiError = new Error(errorMessage);
        throw commandApiError; // Throw to be caught by the outer catch
      }

      // Get the AI response from the API route
      const result = await response.json(); // Expected format: { response: { text, type, data } }
      aiResponseContent = result.response;

      if (!aiResponseContent || typeof aiResponseContent.text === 'undefined') {
         // Handle unexpected response format from n8n via API route
         commandApiError = new Error("Invalid response format from Co-Pilot backend.");
         throw commandApiError; // Throw to be caught by the outer catch
      }

      // 2. Add AI message to state (with temporary ID)
      const aiMessageToAdd = {
          text: aiResponseContent.text || '', // Ensure text is string
          sender: 'ai' as const, // Assert sender type
          type: aiResponseContent.type || 'text', // Default type if not provided
          data: aiResponseContent.data || null, // Ensure data is null if not provided
          isProcessing: false,
          isError: false, // Assume success unless type is 'error'
          isRetryable: aiResponseContent.type === 'error', // Example: mark as retryable if AI signals error type
      };
      addMessageToState(aiMessageToAdd); // Add to state with temp ID


    } catch (error: any) {
      console.error("Error sending command or getting AI response:", error);
      setLastError(error.message || 'Unknown error'); // Set last error state

      // Add an error message to state for the user
       const errorAiMessageToAdd = {
           text: error.message || 'An unknown error occurred.',
           sender: 'ai' as const,
           type: 'error', // Indicate this is an error message
           data: null,
           isProcessing: false,
           isError: true, // Mark as error
           isRetryable: true, // Mark as retryable
       };
       addMessageToState(errorAiMessageToAdd); // Add to state with temp ID


    } finally {
      setIsProcessing(false); // Processing finished (success or failure)
      setIsTyping(false);

      // --- Persistence MVP: Save messages to DB asynchronously ---
      // We save the messages that were just added to the state.
      // Note: This simple approach saves messages based on their state at this moment,
      // using temporary IDs. For robust persistence with DB IDs and realtime sync,
      // you'd need a more complex state management or listen to DB inserts.
      // For MVP, this gets the data into the DB.

      // Get a Supabase client instance for saving AI response
      const clientSupabase = createClient();

      // Save the AI message data IF the API call succeeded and we got a response
      if (aiResponseContent) {
           const aiDataToSave = {
               sender: aiResponseContent.sender || 'ai', // Ensure sender is 'ai'
               text: aiResponseContent.text || '',
               type: aiResponseContent.type || 'text',
               data: aiResponseContent.data || null,
               timestamp: Date.now(), // Use current time for AI response save timestamp
           };
           saveMessageToDb(clientSupabase, aiDataToSave, userId);
       } else if (commandApiError) {
           // Save the AI error message data if the API call failed
            const errorAiMessageToSave = {
                sender: 'ai' as const,
                text: commandApiError.message || 'An unknown error occurred.',
                type: 'error',
                data: null,
                timestamp: Date.now(), // Use current time
            };
            saveMessageToDb(clientSupabase, errorAiMessageToSave, userId);
       }
      // --- End Persistence MVP ---
    }
  }, [isProcessing, userId, messages, addMessageToState, saveMessageToDb]); // Include saveMessageToDb in dependencies


  const retryMessage = useCallback(async (messageId: number | string) => {
       // Find the message to retry in the current state
       const messageToRetry = messages.find(msg => msg.id === messageId);
       if (!messageToRetry || messageToRetry.sender !== 'ai' || !messageToRetry.isRetryable) {
           console.warn("Attempted to retry non-retryable or non-AI message");
           return; // Cannot retry
       }

       // Find the previous user message that triggered this AI message
       // Assuming messages are ordered by timestamp (from DB load + state adds)
       const messageIndex = messages.findIndex(msg => msg.id === messageId);
        if (messageIndex <= 0) {
             console.error("Could not find message to retry or it's the first message.");
             return;
        }
        let userMessageIndex = messageIndex - 1;
        while(userMessageIndex >= 0 && messages[userMessageIndex].sender !== 'user') {
            userMessageIndex--;
        }

       const userMessage = userMessageIndex >= 0 ? messages[userMessageIndex] : null;


       if (!userMessage) {
           console.error("Could not find original user message to retry from state.");
           // Optionally, mark the AI message as non-retryable if the source is lost
           setMessages(prevMessages => prevMessages.map(msg =>
               msg.id === messageId ? { ...msg, isRetryable: false, text: msg.text + "\n(Source message lost, cannot retry)" } : msg
           ));
           return;
       }

       // Optional: Remove the error message from view temporarily or mark it as retrying
       // setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId)); // Remove old error message from state

       // TODO: If using DB persistence, you might also want to delete the old error message from the DB here.
       // const clientSupabase = createClient();
       // await clientSupabase.from('chat_messages').delete().eq('id', messageToRetry.id).eq('user_id', userId); // Needs DELETE RLS

       // Re-send the command from the original user message text
       // sendMessage will add a new user message, call API, add a new AI response, and save them.
       await sendMessage(userMessage.text);

        // After sendMessage finishes, the state will be updated with the new exchange.
        // The old error message *might* still be in state if you didn't filter it out above.
        // Ensure your state update logic prevents duplicates or explicitly removes the old one if needed.
        // Given our current simple state update (just appending), we might need to manually filter:
        // setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId)); // Re-filter after sendMessage updates
   }, [messages, sendMessage, userId]); // Dependencies include messages to find history, and userId/sendMessage


  const clearConversation = useCallback(async () => {
       // Clear state
       setMessages([]);

       // Persistence MVP: Delete messages from database for this user
       const clientSupabase = createClient(); // Get client instance inside async function
       try {
            const { error } = await clientSupabase
                .from('chat_messages')
                .delete()
                .eq('user_id', userId); // Delete only messages for the current user

            if (error) {
                console.error("Error clearing messages from DB:", error);
                // Handle error clearing DB
                setLastError("Failed to clear conversation history from database.");
            } else {
                 console.log("Conversation history cleared from DB.");
                 setLastError(null); // Clear error if successful
                 // Add initial welcome message again after clearing
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
       } catch (dbError) {
            console.error("Unexpected error clearing messages from DB:", dbError);
             setLastError("An unexpected error occurred while clearing history.");
       }

   }, [userId]); // Depend on userId and potentially supabase client if passed as prop


  const value: ChatContextType = {
    messages,
    isProcessing,
    isTyping,
    addMessage: addMessageToState, // Expose the internal addMessage function
    sendMessage,
    retryMessage,
    clearConversation,
    lastError,
    userId, // Expose userId if needed by consumers
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}