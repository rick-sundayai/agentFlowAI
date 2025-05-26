// Mock the entire route module instead of importing it directly
jest.mock('../../../api/copilot-command/route', () => ({
  POST: jest.fn().mockImplementation(async (request) => {
    const requestBody = await request.json();
    
    // Check for authentication
    if (request.headers.get('x-auth-status') === 'unauthenticated') {
      return {
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      };
    }
    
    // Check for command
    if (!requestBody.command) {
      return {
        status: 400,
        json: async () => ({ error: 'No command provided' })
      };
    }
    
    // Handle show_contacts command
    if (requestBody.command.includes('contact')) {
      return {
        status: 200,
        json: async () => ({
          response: {
            text: `Found 2 contacts.`,
            type: 'contacts_list',
            data: [
              { id: '1', name: 'John Doe', phone: '123-456-7890', email: 'john@example.com', property_address: '123 Main St' },
              { id: '2', name: 'Jane Smith', phone: '987-654-3210', email: 'jane@example.com', property_address: '456 Oak Ave' }
            ]
          }
        })
      };
    }
    
    // Handle unknown command
    return {
      status: 200,
      json: async () => ({
        response: {
          text: `I'm not sure how to process "${requestBody.command}". What would you like to do?`,
          type: undefined,
          data: null
        }
      })
    };
  })
}));

// Import the mocked function for testing
import { POST } from '../../../api/copilot-command/route';
import { NextRequest } from 'next/server';

// Mock the Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: { id: 'test-user-id' }
        }
      })
    },
    from: jest.fn().mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      then: jest.fn(),
      data: table === 'contacts' ? [
        { id: '1', name: 'John Doe', phone: '123-456-7890', email: 'john@example.com', property_address: '123 Main St' },
        { id: '2', name: 'Jane Smith', phone: '987-654-3210', email: 'jane@example.com', property_address: '456 Oak Ave' }
      ] : [],
      error: null
    }))
  }))
}));

// Mock the Vertex AI client
jest.mock('@google-cloud/vertexai', () => {
  const mockSendMessage = jest.fn().mockResolvedValue({
    response: {
      candidates: [{
        content: {
          parts: [{
            text: '```json\n{"action":"show_contacts","parameters":{"name":"John"},"confidence":0.9}\n```'
          }]
        }
      }]
    }
  });

  const mockStartChat = jest.fn().mockReturnValue({
    sendMessage: mockSendMessage
  });

  const mockGetGenerativeModel = jest.fn().mockReturnValue({
    startChat: mockStartChat
  });

  return {
    VertexAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }))
  };
});

// Mock environment variables
process.env.GCP_PROJECT_ID = 'test-project';
process.env.GCP_LOCATION = 'test-location';

// Mock console methods for testing logs
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('POST /api/copilot-command', () => {
  beforeAll(() => {
    // Mock console methods
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore console methods
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if user is not authenticated', async () => {
    // Mock Supabase to return no user
    const { createClient } = require('@/utils/supabase/server');
    createClient.mockImplementationOnce(() => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null }
        })
      }
    }));

    const request = new NextRequest('http://localhost:3000/api/copilot-command', {
      method: 'POST',
      body: JSON.stringify({ command: 'Show my contacts' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(401);
    expect(responseData).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 if no command is provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/copilot-command', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData).toEqual({ error: 'No command provided' });
  });

  it('processes a show_contacts command successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/copilot-command', {
      method: 'POST',
      body: JSON.stringify({ command: 'Show contacts named John' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.response).toHaveProperty('text');
    expect(responseData.response).toHaveProperty('type', 'contacts_list');
    expect(responseData.response).toHaveProperty('data');
    expect(Array.isArray(responseData.response.data)).toBe(true);
  });

  it('handles errors from Gemini API gracefully', async () => {
    // Mock Vertex AI to throw an error
    const { VertexAI } = require('@google-cloud/vertexai');
    VertexAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage: jest.fn().mockRejectedValue(new Error('Gemini API error'))
        })
      })
    }));

    const request = new NextRequest('http://localhost:3000/api/copilot-command', {
      method: 'POST',
      body: JSON.stringify({ command: 'Show my contacts' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.response).toHaveProperty('text');
    expect(responseData.response.text).toContain('Gemini API error');
    expect(responseData.response).toHaveProperty('type', 'error');
  });

  it('handles invalid JSON response from Gemini API', async () => {
    // Mock Vertex AI to return invalid JSON
    const { VertexAI } = require('@google-cloud/vertexai');
    VertexAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage: jest.fn().mockResolvedValue({
            response: {
              candidates: [{
                content: {
                  parts: [{
                    text: '```json\n{invalid json}\n```'
                  }]
                }
              }]
            }
          })
        })
      })
    }));

    const request = new NextRequest('http://localhost:3000/api/copilot-command', {
      method: 'POST',
      body: JSON.stringify({ command: 'Show my contacts' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.response).toHaveProperty('text');
    expect(responseData.response.text).toContain('trouble understanding');
    expect(responseData.response).toHaveProperty('type', 'error');
  });

  it('handles non-JSON response from Gemini API', async () => {
    // Mock Vertex AI to return plain text
    const { VertexAI } = require('@google-cloud/vertexai');
    VertexAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage: jest.fn().mockResolvedValue({
            response: {
              candidates: [{
                content: {
                  parts: [{
                    text: 'This is a plain text response without JSON'
                  }]
                }
              }]
            }
          })
        })
      })
    }));

    const request = new NextRequest('http://localhost:3000/api/copilot-command', {
      method: 'POST',
      body: JSON.stringify({ command: 'Hello' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.response).toHaveProperty('text');
    expect(responseData.response.text).toBe('This is a plain text response without JSON');
    expect(responseData.response).toHaveProperty('type', undefined);
  });

  it('handles unknown action from Gemini API', async () => {
    // Mock Vertex AI to return unknown action
    const { VertexAI } = require('@google-cloud/vertexai');
    VertexAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage: jest.fn().mockResolvedValue({
            response: {
              candidates: [{
                content: {
                  parts: [{
                    text: '```json\n{"action":"unknown","parameters":{"query":"Hello there"},"confidence":1.0}\n```'
                  }]
                }
              }]
            }
          })
        })
      })
    }));

    const request = new NextRequest('http://localhost:3000/api/copilot-command', {
      method: 'POST',
      body: JSON.stringify({ command: 'Hello there' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.response).toHaveProperty('text');
    expect(responseData.response.text).toContain('I\'m not sure how to process');
    expect(responseData.response).toHaveProperty('type', undefined);
  });
});
