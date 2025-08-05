import { Test, TestingModule } from '@nestjs/testing';
import { ChatService, MedicationListResponse } from './chat.service';
import { SearchMedicalDataService, SearchResult } from './search-medical-data.service';
import { rateLimiter } from '../utils/rate-limiter';
import OpenAI from 'openai';
import { getSearchPrompt, getReviewPrompt, getReviewUserPrompt } from '../prompts/chat-prompts';
import { ChatCompletionMessage } from 'openai/resources/chat/completions/completions';

// Mock dependencies
jest.mock('openai');
jest.mock('../utils/rate-limiter');
jest.mock('../prompts/chat-prompts');
jest.mock('ioredis');

const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
const mockRateLimiter = rateLimiter as jest.Mocked<typeof rateLimiter>;
const mockGetSearchPrompt = getSearchPrompt as jest.MockedFunction<typeof getSearchPrompt>;
const mockGetReviewPrompt = getReviewPrompt as jest.MockedFunction<typeof getReviewPrompt>;
const mockGetReviewUserPrompt = getReviewUserPrompt as jest.MockedFunction<typeof getReviewUserPrompt>;

describe('ChatService', () => {
  let service: ChatService;
  let searchMedicalDataService: jest.Mocked<SearchMedicalDataService>;
  let mockCreateFunction: jest.MockedFunction<any>;

  const mockSearchResult: SearchResult = {
    id: 'test-id',
    score: 0.95,
    payload: {
      item_id: 'med-001',
      drugName: 'Test Medication',
      slug: 'test-medication',
    },
    chunk: 'This is a test medication chunk',
  };

  const mockMedicationListResponse: MedicationListResponse = {
    medications: [
      {
        id: 'med-001',
        name: 'Test Medication',
        slug: 'test-medication',
      },
    ],
    reasoning: 'Based on your query, I found this medication that matches your criteria.',
  };

  beforeEach(async () => {
    // Reset all mocks and timers
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Mock OpenAI client
    mockCreateFunction = jest.fn();
    const mockChatCompletions = {
      create: mockCreateFunction,
    };

    const mockOpenAIClient = {
      chat: {
        completions: mockChatCompletions,
      },
    };

    mockOpenAI.mockImplementation(() => mockOpenAIClient as any);

    // Mock search medical data service
    searchMedicalDataService = {
      searchMedicalData: jest.fn(),
    } as any;

    // Mock rate limiter
    mockRateLimiter.consume = jest.fn().mockResolvedValue(undefined);

    // Mock prompts
    mockGetSearchPrompt.mockReturnValue('Mock search prompt');
    mockGetReviewPrompt.mockReturnValue('Mock review prompt');
    mockGetReviewUserPrompt.mockReturnValue('Mock review user prompt');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: SearchMedicalDataService,
          useValue: searchMedicalDataService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up any remaining timers
    jest.clearAllTimers();
    
    // Wait a bit for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('chat', () => {
    const mockPrompt = 'What are the side effects of aspirin?';
    const mockContext = [
      { role: 'user', content: 'Hello', refusal: null },
      { role: 'assistant', content: 'Hi there!', refusal: null },
    ] as any;

    it('should handle basic chat without tool calls', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Here is some information about aspirin side effects.',
            },
          },
        ],
      };

      mockCreateFunction.mockResolvedValue(mockResponse as any);

      const result = await service.chat(mockPrompt, mockContext);

      expect(mockRateLimiter.consume).toHaveBeenCalledWith('chat', 2);
      expect(mockCreateFunction).toHaveBeenCalledWith({
        model: 'gpt-4.1-mini',
        messages: [
          ...mockContext,
          { role: 'system', content: 'Mock search prompt' },
          { role: 'user', content: mockPrompt },
        ],
        tools: expect.any(Array),
        temperature: 0.2,
        store: true,
      });

      expect(result).toEqual({
        context: [...mockContext, mockResponse.choices[0].message],
        blocks: [
          {
            role: 'assistant',
            contents: ['Here is some information about aspirin side effects.'],
            type: 'p',
          },
        ],
      });
    });

    it('should handle tool calls for medication search', async () => {
      const mockToolCall = {
        id: 'call-123',
        function: {
          name: 'search_medication_data',
          arguments: JSON.stringify({
            userPrompt: 'aspirin side effects',
          }),
        },
      };

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [mockToolCall],
            },
          },
        ],
      };

      const mockReviewResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify(mockMedicationListResponse),
            },
          },
        ],
      };

      mockCreateFunction
        .mockResolvedValueOnce(mockResponse as any)
        .mockResolvedValueOnce(mockReviewResponse as any);

      searchMedicalDataService.searchMedicalData.mockResolvedValue([mockSearchResult]);

      const result = await service.chat(mockPrompt, mockContext);

      expect(searchMedicalDataService.searchMedicalData).toHaveBeenCalledWith({
        userPrompt: 'aspirin side effects',
      });

      expect(mockCreateFunction).toHaveBeenCalledTimes(2);
      expect(mockCreateFunction).toHaveBeenNthCalledWith(2, {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Mock review prompt',
          },
          { role: 'user', content: 'Mock review user prompt' },
        ],
        store: true,
        response_format: expect.any(Object),
      });

      expect(result).toEqual({
        context: [
          mockResponse.choices[0].message,
          {
            ...mockReviewResponse.choices[0].message,
            tool_call_id: 'call-123',
            role: 'tool',
          },
        ],
        blocks: [
          {
            type: 'p',
            role: 'assistant',
            contents: [
              'Based on your query, I found this medication that matches your criteria.',
              {
                id: 'med-001',
                name: 'Test Medication',
                slug: 'test-medication',
              },
            ],
          },
        ],
      });
    });

    it('should handle context truncation when context is too long', async () => {
      const longContext = Array.from({ length: 15 }, (_, i) => ({
        role: 'user',
        content: `Message ${i}`,
      }));

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Response',
            },
          },
        ],
      };

      mockCreateFunction.mockResolvedValue(mockResponse as any);

      await service.chat(mockPrompt, longContext);

      // Should only use the last 10 messages from context
      expect(mockCreateFunction).toHaveBeenCalledWith({
        model: 'gpt-4.1-mini',
        messages: [
          ...longContext.slice(-10),
          { role: 'system', content: 'Mock search prompt' },
          { role: 'user', content: mockPrompt },
        ],
        tools: expect.any(Array),
        temperature: 0.2,
        store: true,
      });
    });

    it('should handle tool calls with empty content', async () => {
      const mockToolCall = {
        id: 'call-123',
        function: {
          name: 'search_medication_data',
          arguments: JSON.stringify({
            userPrompt: 'aspirin side effects',
          }),
        },
      };

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [mockToolCall],
            },
          },
        ],
      };

      const mockReviewResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null, // Empty content
            },
          },
        ],
      };

      mockCreateFunction
        .mockResolvedValueOnce(mockResponse as any)
        .mockResolvedValueOnce(mockReviewResponse as any);

      searchMedicalDataService.searchMedicalData.mockResolvedValue([mockSearchResult]);

      const result = await service.chat(mockPrompt, mockContext);

      expect(result.blocks).toEqual([
        {
          type: 'p',
          role: 'assistant',
          contents: ['Something went wrong. I could not find any information.'],
        },
      ]);
    });

    it('should handle unknown tool calls gracefully', async () => {
      const mockToolCall = {
        id: 'call-123',
        function: {
          name: 'unknown_tool',
          arguments: JSON.stringify({}),
        },
      };

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [mockToolCall],
            },
          },
        ],
      };

      mockCreateFunction.mockResolvedValue(mockResponse as any);

      const result = await service.chat(mockPrompt, mockContext);

      expect(result).toEqual({
        context: [mockResponse.choices[0].message],
        blocks: [],
      });
    });

    it('should handle rate limiter errors', async () => {
      mockRateLimiter.consume.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(service.chat(mockPrompt, mockContext)).rejects.toThrow('Rate limit exceeded');
      expect(mockCreateFunction).not.toHaveBeenCalled();
    });

    it('should handle OpenAI API errors', async () => {
      mockCreateFunction.mockRejectedValue(new Error('OpenAI API error'));

      await expect(service.chat(mockPrompt, mockContext)).rejects.toThrow('OpenAI API error');
    });

    it('should handle search medical data service errors', async () => {
      const mockToolCall = {
        id: 'call-123',
        function: {
          name: 'search_medication_data',
          arguments: JSON.stringify({
            userPrompt: 'aspirin side effects',
          }),
        },
      };

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [mockToolCall],
            },
          },
        ],
      };

      mockCreateFunction.mockResolvedValue(mockResponse as any);
      searchMedicalDataService.searchMedicalData.mockRejectedValue(new Error('Search service error'));

      await expect(service.chat(mockPrompt, mockContext)).rejects.toThrow('Search service error');
    });

    it('should handle invalid JSON in tool call arguments', async () => {
      const mockToolCall = {
        id: 'call-123',
        function: {
          name: 'search_medication_data',
          arguments: 'invalid json',
        },
      };

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [mockToolCall],
            },
          },
        ],
      };

      mockCreateFunction.mockResolvedValue(mockResponse as any);

      await expect(service.chat(mockPrompt, mockContext)).rejects.toThrow();
    });

    it('should handle invalid JSON in review response content', async () => {
      const mockToolCall = {
        id: 'call-123',
        function: {
          name: 'search_medication_data',
          arguments: JSON.stringify({
            userPrompt: 'aspirin side effects',
          }),
        },
      };

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [mockToolCall],
            },
          },
        ],
      };

      const mockReviewResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'invalid json content',
            },
          },
        ],
      };

      mockCreateFunction
        .mockResolvedValueOnce(mockResponse as any)
        .mockResolvedValueOnce(mockReviewResponse as any);

      searchMedicalDataService.searchMedicalData.mockResolvedValue([mockSearchResult]);

      await expect(service.chat(mockPrompt, mockContext)).rejects.toThrow();
    });
  });

  describe('constructor', () => {
    it('should initialize OpenAI client with API key', async () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'test-api-key';

      const module = await Test.createTestingModule({
        providers: [
          ChatService,
          {
            provide: SearchMedicalDataService,
            useValue: searchMedicalDataService,
          },
        ],
      }).compile();

      const service = module.get<ChatService>(ChatService);
      expect(mockOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });

      process.env.OPENAI_API_KEY = originalEnv;
    });
  });
}); 