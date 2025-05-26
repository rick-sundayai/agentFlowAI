import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatProvider, useChatContext } from '../../context/ChatContext';

// Mock fetch
global.fetch = jest.fn();

// Create a test component that uses the chat context
function TestComponent() {
  const { 
    messages, 
    isProcessing, 
    isTyping, 
    addMessage, 
    sendMessage, 
    clearConversation,
    lastError 
  } = useChatContext();

  return (
    <div>
      <div data-testid="messages-count">{messages.length}</div>
      <div data-testid="processing">{isProcessing ? 'true' : 'false'}</div>
      <div data-testid="typing">{isTyping ? 'true' : 'false'}</div>
      <div data-testid="last-error">{lastError || 'no-error'}</div>
      <button 
        data-testid="add-message-btn" 
        onClick={() => addMessage({ text: 'Test message', sender: 'user' })}
      >
        Add Message
      </button>
      <button 
        data-testid="send-message-btn" 
        onClick={() => sendMessage('Hello AI')}
      >
        Send Message
      </button>
      <button 
        data-testid="clear-btn" 
        onClick={clearConversation}
      >
        Clear
      </button>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id} data-testid={`message-${msg.id}`}>
            {msg.sender}: {msg.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

describe('ChatContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock fetch implementation
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          response: {
            text: 'AI response',
            type: undefined,
            data: undefined
          }
        })
      })
    );
  });

  it('should initialize with a welcome message', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Check that we have 1 message (the welcome message)
    expect(screen.getByTestId('messages-count').textContent).toBe('1');
    
    // Check that the message is from the AI
    const messageElements = screen.getAllByTestId(/^message-/);
    expect(messageElements.length).toBe(1);
    expect(messageElements[0].textContent).toContain('ai:');
    expect(messageElements[0].textContent).toContain("Hello! I'm your AgentFlow AI Co-Pilot");
  });

  it('should add a message when addMessage is called', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Initial count (welcome message)
    expect(screen.getByTestId('messages-count').textContent).toBe('1');
    
    // Add a message
    fireEvent.click(screen.getByTestId('add-message-btn'));
    
    // Check that we now have 2 messages
    expect(screen.getByTestId('messages-count').textContent).toBe('2');
    
    // Check that the new message is displayed
    const messageElements = screen.getAllByTestId(/^message-/);
    expect(messageElements.length).toBe(2);
    expect(messageElements[1].textContent).toContain('user: Test message');
  });

  it('should send a message and receive a response', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Initial count (welcome message)
    expect(screen.getByTestId('messages-count').textContent).toBe('1');
    
    // Click send message button
    fireEvent.click(screen.getByTestId('send-message-btn'));
    
    // Check that processing and typing indicators are set to true
    expect(screen.getByTestId('processing').textContent).toBe('true');
    expect(screen.getByTestId('typing').textContent).toBe('true');
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(screen.getByTestId('processing').textContent).toBe('false');
      expect(screen.getByTestId('typing').textContent).toBe('false');
    }, { timeout: 2000 });
    
    // Check that fetch was called with the right arguments
    expect(global.fetch).toHaveBeenCalledWith('/api/copilot-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'Hello AI' }),
    });
    
    // Check that we now have 3 messages (welcome, user, and AI response)
    expect(screen.getByTestId('messages-count').textContent).toBe('3');
    
    // Check that the messages are displayed correctly
    const messageElements = screen.getAllByTestId(/^message-/);
    expect(messageElements.length).toBe(3);
    expect(messageElements[1].textContent).toContain('user: Hello AI');
    expect(messageElements[2].textContent).toContain('ai: AI response');
  });

  it('should handle API errors', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      })
    );

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Click send message button
    fireEvent.click(screen.getByTestId('send-message-btn'));
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(screen.getByTestId('processing').textContent).toBe('false');
    }, { timeout: 2000 });
    
    // Check that we have an error message
    expect(screen.getByTestId('last-error').textContent).toBe('Server error');
    
    // Check that we have 3 messages (welcome, user, and error)
    expect(screen.getByTestId('messages-count').textContent).toBe('3');
    
    // Check that the error message is displayed
    const messageElements = screen.getAllByTestId(/^message-/);
    expect(messageElements[2].textContent).toContain('Sorry, I encountered an error');
    expect(messageElements[2].textContent).toContain('Server error');
  });

  it('should clear the conversation', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Add a message
    fireEvent.click(screen.getByTestId('add-message-btn'));
    
    // Check that we have 2 messages
    expect(screen.getByTestId('messages-count').textContent).toBe('2');
    
    // Clear the conversation
    fireEvent.click(screen.getByTestId('clear-btn'));
    
    // Check that we're back to 1 message (just the welcome message)
    expect(screen.getByTestId('messages-count').textContent).toBe('1');
    
    // Check that localStorage no longer has the previous messages
    // Note: The welcome message is still saved in localStorage, so we can't check for null
    const savedMessages = localStorage.getItem('chatMessages');
    expect(savedMessages).not.toBeNull();
    const parsedMessages = JSON.parse(savedMessages || '[]');
    expect(parsedMessages.length).toBe(1); // Just the welcome message
  });

  it('should persist messages in localStorage', async () => {
    const { unmount } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Add a message
    fireEvent.click(screen.getByTestId('add-message-btn'));
    
    // Unmount and remount to simulate a page refresh
    unmount();
    
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    // Check that we still have 2 messages
    expect(screen.getByTestId('messages-count').textContent).toBe('2');
  });
});
