import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MedicationAssistant from '../MedicationAssistant';
import { chatService } from '@/services/chatService';

// Mock the chatService
jest.mock('@/services/chatService', () => ({
  chatService: {
    sendMessage: jest.fn(),
  },
}));

// Mock the ChatBalloon component
jest.mock('../ChatBalloon', () => {
  return function MockChatBalloon({ block }: any) {
    return (
      <div data-testid="chat-balloon" data-role={block.role}>
        {block.contents.map((content: string, index: number) => (
          <span key={index}>{content}</span>
        ))}
      </div>
    );
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('MedicationAssistant', () => {
  const mockChatService = chatService as jest.Mocked<typeof chatService>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  it('renders the component with header and input area', () => {
    render(<MedicationAssistant />);
    
    expect(screen.getByText('Medication Assistant')).toBeInTheDocument();
    expect(screen.getByText('Ask questions about your medications')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('shows initial assistant message when no chat blocks exist', () => {
    render(<MedicationAssistant />);
    
    const assistantBalloon = screen.getByTestId('chat-balloon');
    expect(assistantBalloon).toHaveAttribute('data-role', 'assistant');
    expect(screen.getByText("Hello! I'm here to help you with medication information. How can I assist you today?")).toBeInTheDocument();
  });

  it('updates message text when typing', async () => {
    const user = userEvent.setup();
    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    await user.type(textarea, 'Test message');
    
    expect(textarea).toHaveValue('Test message');
  });

  it('sends message when Send button is clicked', async () => {
    const user = userEvent.setup();
    mockChatService.sendMessage.mockResolvedValue({
      response: {
        blocks: [
          {
            type: 'p',
            contents: ['Test response'],
            role: 'assistant'
          }
        ],
        context: [
          {
            role: 'assistant',
            content: 'Test response'
          }
        ]
      }
    });

    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    await user.type(textarea, 'Test message');
    await user.click(sendButton);
    
    expect(mockChatService.sendMessage).toHaveBeenCalledWith({
      userPrompt: 'Test message',
      context: []
    });
  });

  it('sends message when Enter key is pressed', async () => {
    const user = userEvent.setup();
    mockChatService.sendMessage.mockResolvedValue({
      response: {
        blocks: [
          {
            type: 'p',
            contents: ['Test response'],
            role: 'assistant'
          }
        ],
        context: [
          {
            role: 'assistant',
            content: 'Test response'
          }
        ]
      }
    });

    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    await user.type(textarea, 'Test message');
    await user.keyboard('{Enter}');
    
    expect(mockChatService.sendMessage).toHaveBeenCalledWith({
      userPrompt: 'Test message',
      context: []
    });
  });

  it('does not send message when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    await user.type(textarea, 'Test message');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    
    expect(mockChatService.sendMessage).not.toHaveBeenCalled();
  });

  it('does not send empty messages', async () => {
    const user = userEvent.setup();
    render(<MedicationAssistant />);
    
    const sendButton = screen.getByRole('button', { name: 'Send' });
    await user.click(sendButton);
    
    expect(mockChatService.sendMessage).not.toHaveBeenCalled();
  });

  it('does not send whitespace-only messages', async () => {
    const user = userEvent.setup();
    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    await user.type(textarea, '   ');
    await user.click(sendButton);
    
    expect(mockChatService.sendMessage).not.toHaveBeenCalled();
  });

  it('shows loading state when sending message', async () => {
    const user = userEvent.setup();
    mockChatService.sendMessage.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    await user.type(textarea, 'Test message');
    await user.click(sendButton);
    
    expect(sendButton).toHaveTextContent('Sending...');
    expect(sendButton).toBeDisabled();
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('displays user message and assistant response', async () => {
    const user = userEvent.setup();
    mockChatService.sendMessage.mockResolvedValue({
      response: {
        blocks: [
          {
            type: 'p',
            contents: ['Test response'],
            role: 'assistant'
          }
        ],
        context: [
          {
            role: 'assistant',
            content: 'Test response'
          }
        ]
      }
    });

    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    await user.type(textarea, 'Test message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });

  it('handles multiple messages in conversation', async () => {
    const user = userEvent.setup();
    mockChatService.sendMessage
      .mockResolvedValueOnce({
        response: {
          blocks: [
            {
              type: 'p',
              contents: ['First response'],
              role: 'assistant'
            }
          ],
          context: [
            {
              role: 'assistant',
              content: 'First response'
            }
          ]
        }
      })
      .mockResolvedValueOnce({
        response: {
          blocks: [
            {
              type: 'p',
              contents: ['Second response'],
              role: 'assistant'
            }
          ],
          context: [
            {
              role: 'assistant',
              content: 'Second response'
            }
          ]
        }
      });

    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    // Send first message
    await user.type(textarea, 'First message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('First response')).toBeInTheDocument();
    });
    
    // Send second message
    await user.type(textarea, 'Second message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Second response')).toBeInTheDocument();
    });
    
    // Check that both messages are displayed
    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
    expect(screen.getByText('First response')).toBeInTheDocument();
    expect(screen.getByText('Second response')).toBeInTheDocument();
  });

  it('handles error when chat service fails', async () => {
    const user = userEvent.setup();
    mockChatService.sendMessage.mockRejectedValue(new Error('Network error'));

    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    await user.type(textarea, 'Test message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error while processing your request. Please try again.')).toBeInTheDocument();
    });
  });

  it('clears chat when Clear button is clicked', async () => {
    const user = userEvent.setup();
    mockChatService.sendMessage.mockResolvedValue({
      response: {
        blocks: [
          {
            type: 'p',
            contents: ['Test response'],
            role: 'assistant'
          }
        ],
        context: [
          {
            role: 'assistant',
            content: 'Test response'
          }
        ]
      }
    });

    render(<MedicationAssistant />);
    
    // Send a message first
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    await user.type(textarea, 'Test message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
    
    // Clear the chat
    const clearButton = screen.getByRole('button', { name: 'Clear' });
    await user.click(clearButton);
    
    // Should show initial assistant message
    expect(screen.getByText("Hello! I'm here to help you with medication information. How can I assist you today?")).toBeInTheDocument();
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    expect(screen.queryByText('Test response')).not.toBeInTheDocument();
    
    // Check that localStorage was cleared
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('medication-assistant-state');
  });

  it('loads state from localStorage on mount', () => {
    const savedState = {
      chatBlocks: [
        {
          type: 'p',
          contents: ['Saved user message'],
          role: 'user'
        },
        {
          type: 'p',
          contents: ['Saved assistant response'],
          role: 'assistant'
        }
      ],
      messageText: 'Saved input text',
      isLoading: false,
      contextList: [
        {
          role: 'user',
          content: 'Saved user message'
        }
      ]
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));
    
    render(<MedicationAssistant />);
    
    expect(screen.getByText('Saved user message')).toBeInTheDocument();
    expect(screen.getByText('Saved assistant response')).toBeInTheDocument();
  });

  it('handles localStorage parsing error gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');
    
    render(<MedicationAssistant />);
    
    // Should still render the component with initial state
    expect(screen.getByText('Medication Assistant')).toBeInTheDocument();
    expect(screen.getByText("Hello! I'm here to help you with medication information. How can I assist you today?")).toBeInTheDocument();
  });

  it('saves state to localStorage when sending messages', async () => {
    const user = userEvent.setup();
    mockChatService.sendMessage.mockResolvedValue({
      response: {
        blocks: [
          {
            type: 'p',
            contents: ['Test response'],
            role: 'assistant'
          }
        ],
        context: [
          {
            role: 'assistant',
            content: 'Test response'
          }
        ]
      }
    });

    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    await user.type(textarea, 'Test message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  it('maintains conversation context across messages', async () => {
    const user = userEvent.setup();
    mockChatService.sendMessage
      .mockResolvedValueOnce({
        response: {
          blocks: [
            {
              type: 'p',
              contents: ['First response'],
              role: 'assistant'
            }
          ],
          context: [
            {
              role: 'assistant',
              content: 'First response'
            }
          ]
        }
      })
      .mockResolvedValueOnce({
        response: {
          blocks: [
            {
              type: 'p',
              contents: ['Second response'],
              role: 'assistant'
            }
          ],
          context: [
            {
              role: 'assistant',
              content: 'Second response'
            }
          ]
        }
      });

    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });
    
    // Send first message
    await user.type(textarea, 'First message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(mockChatService.sendMessage).toHaveBeenCalledWith({
        userPrompt: 'First message',
        context: []
      });
    });
    
    // Send second message
    await user.type(textarea, 'Second message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(mockChatService.sendMessage).toHaveBeenCalledWith({
        userPrompt: 'Second message',
        context: [
          {
            role: 'user',
            content: 'First message'
          },
          {
            role: 'assistant',
            content: 'First response'
          }
        ]
      });
    });
  });

  it('applies correct CSS classes to main container', () => {
    render(<MedicationAssistant />);
    
    // Find the main container by looking for the outermost div with the specific classes
    const container = document.querySelector('.hidden.lg\\:flex.w-80.bg-white.border-l.border-gray-200.flex-col');
    expect(container).toBeInTheDocument();
  });

  it('applies correct CSS classes to send button', () => {
    render(<MedicationAssistant />);
    
    const sendButton = screen.getByRole('button', { name: 'Send' });
    expect(sendButton).toHaveClass(
      'px-4',
      'py-2',
      'bg-blue-500',
      'text-white',
      'rounded-lg',
      'hover:bg-blue-600',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-blue-500',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed'
    );
  });

  it('applies correct CSS classes to textarea', () => {
    render(<MedicationAssistant />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    expect(textarea).toHaveClass(
      'flex-1',
      'resize-none',
      'border',
      'border-gray-300',
      'rounded-lg',
      'px-3',
      'py-2',
      'text-sm',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-blue-500',
      'focus:border-transparent'
    );
  });
}); 