// app/context/ChatContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the types for our chat data
export interface ContactData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  property_address: string | null;
}

export interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  dataType?: 'contacts_list' | 'error' | 'warning';
  data?: Record<string, unknown> | ContactData[];
  timestamp: number;
  isRetryable?: boolean;
}

interface ChatContextType {
  messages: ChatMessage[];
  isProcessing: boolean;
  isTyping: boolean;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  sendMessage: (text: string) => Promise<void>;
  retryMessage: (messageId: number) => Promise<void>;
  clearConversation: () => void;
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
}

export function ChatProvider({ children, userId }: ChatProviderProps) {
  // State for chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Processing state (when sending a message)
  const [isProcessing, setIsProcessing] = useState(false);
  // Typing indicator state
  const [isTyping, setIsTyping] = useState(false);
  // Last error message
  const [lastError, setLastError] = useState<string | null>(null);

  // Load messages from localStorage on initial render
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages) as ChatMessage[];
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Failed to parse saved messages:', error);
        // If parsing fails, initialize with welcome message
        initializeWithWelcomeMessage();
      }
    } else {
      // If no saved messages, initialize with welcome message
      initializeWithWelcomeMessage();
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Initialize with welcome message
  const initializeWithWelcomeMessage = () => {
    const welcomeMessage: ChatMessage = {
      id: Date.now(),
      text: "Hello! I'm your AgentFlow AI Co-Pilot. How can I assist you today?",
      sender: 'ai',
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);
  };

  // Add a message to the chat
  const addMessage = (messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...messageData,
      id: Date.now(),
      timestamp: Date.now(),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    return newMessage.id;
  };

  // Send a message to the API
  const sendMessage = async (text: string) => {
    if (text.trim() === '') return;

    // Add user message
    addMessage({
      text,
      sender: 'user',
    });

    // Show typing indicator
    setIsTyping(true);
    setIsProcessing(true);
    setLastError(null);

    try {

      const response = await fetch('/api/copilot-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text, userId }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        const errorMessage = errorBody.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const aiResponseContent = result.response;

      if (!aiResponseContent || typeof aiResponseContent.text === 'undefined') {
        throw new Error("Invalid response format from Co-Pilot backend.");
      }

      // Add AI response
      addMessage({
        text: aiResponseContent.text,
        sender: 'ai',
        dataType: aiResponseContent.type,
        data: aiResponseContent.data,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      
      // Add error message
      addMessage({
        text: `Sorry, I encountered an error: ${errorMessage}`,
        sender: 'ai',
        dataType: 'error',
        isRetryable: true,
      });
    } finally {
      setIsTyping(false);
      setIsProcessing(false);
    }
  };

  // Retry a failed message
  const retryMessage = async (messageId: number) => {
    // Find the user message that preceded the error
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex <= 0) return;

    // Look backwards for the last user message
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].sender !== 'user') {
      userMessageIndex--;
    }

    if (userMessageIndex >= 0) {
      const userMessage = messages[userMessageIndex];
      // Remove all messages after the user message
      setMessages(messages.slice(0, userMessageIndex + 1));
      // Retry sending the user message
      await sendMessage(userMessage.text);
    }
  };

  // Clear the conversation
  const clearConversation = () => {
    // Clear messages but keep the welcome message
    initializeWithWelcomeMessage();
    // Clear localStorage
    localStorage.removeItem('chatMessages');
  };

  const value = {
    messages,
    isProcessing,
    isTyping,
    addMessage,
    sendMessage,
    retryMessage,
    clearConversation,
    lastError,
    userId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
