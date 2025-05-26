import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoPilotChat from '../../components/CoPilotChat';

// Mock scrollIntoView since it's not available in the test environment
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock the ChatContext
jest.mock('../../context/ChatContext', () => {
  const originalModule = jest.requireActual('../../context/ChatContext');
  
  // Create a mock implementation of useChatContext
  const mockMessages = [
    {
      id: 1,
      text: "Hello! I'm your AgentFlow AI Co-Pilot. How can I assist you today?",
      sender: 'ai',
      timestamp: Date.now()
    }
  ];
  
  const mockSendMessage = jest.fn().mockImplementation(async (text) => {
    // This is just a mock implementation
  });
  
  const mockRetryMessage = jest.fn().mockImplementation(async (id) => {
    // This is just a mock implementation
  });
  
  const mockClearConversation = jest.fn();
  
  return {
    ...originalModule,
    useChatContext: jest.fn().mockReturnValue({
      messages: mockMessages,
      isProcessing: false,
      isTyping: false,
      sendMessage: mockSendMessage,
      retryMessage: mockRetryMessage,
      clearConversation: mockClearConversation,
      lastError: null,
      addMessage: jest.fn()
    })
  };
});

// Mock the child components
jest.mock('../../components/ChatUI/TypingIndicator', () => {
  return function MockTypingIndicator() {
    return <div data-testid="typing-indicator">Typing...</div>;
  };
});

jest.mock('../../components/ChatUI/MessageBubble', () => {
  return function MockMessageBubble({ message, onRetry }) {
    return (
      <div data-testid={`message-${message.id}`} className={message.sender}>
        {message.text}
        {onRetry && (
          <button 
            data-testid={`retry-${message.id}`}
            onClick={() => onRetry(message.id)}
          >
            Retry
          </button>
        )}
      </div>
    );
  };
});

jest.mock('../../components/ChatUI/ChatInput', () => {
  return function MockChatInput({ onSendMessage, isProcessing }) {
    return (
      <div data-testid="chat-input">
        <input 
          data-testid="message-input"
          type="text"
          disabled={isProcessing}
        />
        <button 
          data-testid="send-button"
          onClick={() => onSendMessage('Test message')}
          disabled={isProcessing}
        >
          Send
        </button>
      </div>
    );
  };
});

describe('CoPilotChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chat interface with welcome message', () => {
    render(<CoPilotChat />);
    
    // Check that the header is rendered
    expect(screen.getByText('Co-Pilot')).toBeInTheDocument();
    
    // Check that the clear button is rendered
    expect(screen.getByText('Clear Chat')).toBeInTheDocument();
    
    // Check that the welcome message is rendered
    expect(screen.getByTestId('message-1')).toBeInTheDocument();
    expect(screen.getByTestId('message-1')).toHaveClass('ai');
    expect(screen.getByTestId('message-1').textContent).toContain("Hello! I'm your AgentFlow AI Co-Pilot");
    
    // Check that the chat input is rendered
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('shows typing indicator when isTyping is true', () => {
    // Override the mock to set isTyping to true
    const { useChatContext } = require('../../context/ChatContext');
    useChatContext.mockReturnValueOnce({
      messages: [
        {
          id: 1,
          text: "Hello! I'm your AgentFlow AI Co-Pilot. How can I assist you today?",
          sender: 'ai',
          timestamp: Date.now()
        }
      ],
      isProcessing: true,
      isTyping: true,
      sendMessage: jest.fn(),
      retryMessage: jest.fn(),
      clearConversation: jest.fn(),
      lastError: null,
      addMessage: jest.fn()
    });
    
    render(<CoPilotChat />);
    
    // Check that the typing indicator is rendered
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  it('calls clearConversation when clear button is clicked', () => {
    render(<CoPilotChat />);
    
    // Get the clear button
    const clearButton = screen.getByText('Clear Chat');
    
    // Click the clear button
    fireEvent.click(clearButton);
    
    // Check that clearConversation was called
    const { useChatContext } = require('../../context/ChatContext');
    const { clearConversation } = useChatContext();
    expect(clearConversation).toHaveBeenCalled();
  });

  it('calls sendMessage when send button is clicked', () => {
    render(<CoPilotChat />);
    
    // Get the send button
    const sendButton = screen.getByTestId('send-button');
    
    // Click the send button
    fireEvent.click(sendButton);
    
    // Check that sendMessage was called with the correct text
    const { useChatContext } = require('../../context/ChatContext');
    const { sendMessage } = useChatContext();
    expect(sendMessage).toHaveBeenCalledWith('Test message');
  });

  it('calls retryMessage when retry button is clicked', () => {
    // Create a mock for retryMessage that we can check later
    const mockRetryMessage = jest.fn();
    
    // Override the mock to include a retryable message
    const { useChatContext } = require('../../context/ChatContext');
    useChatContext.mockReturnValue({
      messages: [
        {
          id: 1,
          text: "Hello! I'm your AgentFlow AI Co-Pilot. How can I assist you today?",
          sender: 'ai',
          timestamp: Date.now()
        },
        {
          id: 2,
          text: "Sorry, I encountered an error",
          sender: 'ai',
          dataType: 'error',
          isRetryable: true,
          timestamp: Date.now()
        }
      ],
      isProcessing: false,
      isTyping: false,
      sendMessage: jest.fn(),
      retryMessage: mockRetryMessage, // Use our specific mock here
      clearConversation: jest.fn(),
      lastError: null,
      addMessage: jest.fn()
    });
    
    render(<CoPilotChat />);
    
    // Get the retry button
    const retryButton = screen.getByTestId('retry-2');
    
    // Click the retry button
    fireEvent.click(retryButton);
    
    // Check that retryMessage was called with the correct ID
    expect(mockRetryMessage).toHaveBeenCalledWith(2);
  });

  it('disables chat input when processing', () => {
    // Override the mock to set isProcessing to true
    const { useChatContext } = require('../../context/ChatContext');
    useChatContext.mockReturnValueOnce({
      messages: [
        {
          id: 1,
          text: "Hello! I'm your AgentFlow AI Co-Pilot. How can I assist you today?",
          sender: 'ai',
          timestamp: Date.now()
        }
      ],
      isProcessing: true,
      isTyping: false,
      sendMessage: jest.fn(),
      retryMessage: jest.fn(),
      clearConversation: jest.fn(),
      lastError: null,
      addMessage: jest.fn()
    });
    
    render(<CoPilotChat />);
    
    // Check that the input is disabled
    const input = screen.getByTestId('message-input');
    expect(input).toBeDisabled();
    
    // Check that the send button is disabled
    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();
  });
});
