import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatCompletionMessage } from 'openai/resources/chat/completions/completions';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;

  const mockChatService = {
    chat: jest.fn(),
  };

  const mockChatResponse = {
    blocks: [
      {
        type: 'p',
        role: 'assistant',
        contents: ['Hello! I can help you find information about medications.'],
      },
      {
        type: 'embed-medication',
        role: 'assistant',
        contents: [
          {
            id: '1',
            name: 'Acetaminophen',
            slug: 'acetaminophen',
          },
        ],
      },
    ],
    context: [
      {
        role: 'user',
        content: 'What medications are available for pain relief?',
      },
      {
        role: 'assistant',
        content: 'I found some medications that can help with pain relief.',
      },
    ],
  };

  const mockChatRequest = {
    userPrompt: 'What medications are available for pain relief?',
    context: [
      {
        role: 'user',
        content: 'Hello',
      },
      {
        role: 'assistant',
        content: 'Hi! How can I help you today?',
      },
    ] as ChatCompletionMessage[],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chat', () => {
    it('should return chat response with blocks and context', async () => {
      mockChatService.chat.mockResolvedValue(mockChatResponse);

      const result = await controller.chat(mockChatRequest);

      expect(chatService.chat).toHaveBeenCalledWith(
        mockChatRequest.userPrompt,
        mockChatRequest.context,
      );

      expect(result).toEqual({
        response: mockChatResponse,
      });
    });

    it('should handle chat request with empty context', async () => {
      const requestWithEmptyContext = {
        userPrompt: 'Tell me about aspirin',
        context: [],
      };

      mockChatService.chat.mockResolvedValue(mockChatResponse);

      const result = await controller.chat(requestWithEmptyContext);

      expect(chatService.chat).toHaveBeenCalledWith(
        'Tell me about aspirin',
        [],
      );

      expect(result).toEqual({
        response: mockChatResponse,
      });
    });

    it('should handle chat request with long context', async () => {
      const longContext = Array.from({ length: 15 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i + 1}`,
      })) as ChatCompletionMessage[];

      const requestWithLongContext = {
        userPrompt: 'What about ibuprofen?',
        context: longContext,
      };

      mockChatService.chat.mockResolvedValue(mockChatResponse);

      const result = await controller.chat(requestWithLongContext);

      expect(chatService.chat).toHaveBeenCalledWith(
        'What about ibuprofen?',
        longContext,
      );

      expect(result).toEqual({
        response: mockChatResponse,
      });
    });

    it('should handle chat response with only text blocks', async () => {
      const textOnlyResponse = {
        blocks: [
          {
            type: 'p',
            role: 'assistant',
            contents: ['I can help you find information about medications.'],
          },
          {
            type: 'p',
            role: 'assistant',
            contents: ['What specific medication are you looking for?'],
          },
        ],
        context: [
          {
            role: 'user',
            content: 'Hello',
          },
          {
            role: 'assistant',
            content: 'Hi! How can I help you today?',
          },
        ],
      };

      mockChatService.chat.mockResolvedValue(textOnlyResponse);

      const result = await controller.chat(mockChatRequest);

      expect(result).toEqual({
        response: textOnlyResponse,
      });
    });

    it('should handle chat response with medication embeddings', async () => {
      const responseWithMedications = {
        blocks: [
          {
            type: 'p',
            role: 'assistant',
            contents: ['Here are some medications for pain relief:'],
          },
          {
            type: 'embed-medication',
            role: 'assistant',
            contents: [
              {
                id: '1',
                name: 'Acetaminophen',
                slug: 'acetaminophen',
              },
              {
                id: '2',
                name: 'Ibuprofen',
                slug: 'ibuprofen',
              },
            ],
          },
        ],
        context: [
          {
            role: 'user',
            content: 'What medications are available for pain relief?',
          },
          {
            role: 'assistant',
            content: 'Here are some medications for pain relief:',
          },
        ],
      };

      mockChatService.chat.mockResolvedValue(responseWithMedications);

      const result = await controller.chat(mockChatRequest);

      expect(result).toEqual({
        response: responseWithMedications,
      });
    });

    it('should handle chat response with mixed content', async () => {
      const mixedResponse = {
        blocks: [
          {
            type: 'p',
            role: 'assistant',
            contents: ['I found some medications that might help:'],
          },
          {
            type: 'embed-medication',
            role: 'assistant',
            contents: [
              {
                id: '1',
                name: 'Acetaminophen',
                slug: 'acetaminophen',
              },
            ],
          },
          {
            type: 'p',
            role: 'assistant',
            contents: ['These are commonly used for pain relief.'],
          },
        ],
        context: [
          {
            role: 'user',
            content: 'What medications are available for pain relief?',
          },
          {
            role: 'assistant',
            content: 'I found some medications that might help:',
          },
        ],
      };

      mockChatService.chat.mockResolvedValue(mixedResponse);

      const result = await controller.chat(mockChatRequest);

      expect(result).toEqual({
        response: mixedResponse,
      });
    });

    it('should handle service errors gracefully', async () => {
      mockChatService.chat.mockRejectedValue(new Error('Service error'));

      await expect(controller.chat(mockChatRequest)).rejects.toThrow(
        'Service error',
      );

      expect(chatService.chat).toHaveBeenCalledWith(
        mockChatRequest.userPrompt,
        mockChatRequest.context,
      );
    });

    it('should handle rate limiting errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      mockChatService.chat.mockRejectedValue(rateLimitError);

      await expect(controller.chat(mockChatRequest)).rejects.toThrow(
        'Rate limit exceeded',
      );
    });

    it('should handle OpenAI API errors', async () => {
      const openAIError = new Error('OpenAI API error');
      openAIError.name = 'OpenAIError';
      mockChatService.chat.mockRejectedValue(openAIError);

      await expect(controller.chat(mockChatRequest)).rejects.toThrow(
        'OpenAI API error',
      );
    });

    it('should handle empty user prompt', async () => {
      const requestWithEmptyPrompt = {
        userPrompt: '',
        context: mockChatRequest.context,
      };

      mockChatService.chat.mockResolvedValue(mockChatResponse);

      const result = await controller.chat(requestWithEmptyPrompt);

      expect(chatService.chat).toHaveBeenCalledWith('', mockChatRequest.context);

      expect(result).toEqual({
        response: mockChatResponse,
      });
    });

    it('should handle very long user prompt', async () => {
      const longPrompt = 'A'.repeat(1000);
      const requestWithLongPrompt = {
        userPrompt: longPrompt,
        context: mockChatRequest.context,
      };

      mockChatService.chat.mockResolvedValue(mockChatResponse);

      const result = await controller.chat(requestWithLongPrompt);

      expect(chatService.chat).toHaveBeenCalledWith(
        longPrompt,
        mockChatRequest.context,
      );

      expect(result).toEqual({
        response: mockChatResponse,
      });
    });

    it('should handle special characters in user prompt', async () => {
      const specialPrompt = 'What about medications with "special" characters & symbols?';
      const requestWithSpecialChars = {
        userPrompt: specialPrompt,
        context: mockChatRequest.context,
      };

      mockChatService.chat.mockResolvedValue(mockChatResponse);

      const result = await controller.chat(requestWithSpecialChars);

      expect(chatService.chat).toHaveBeenCalledWith(
        specialPrompt,
        mockChatRequest.context,
      );

      expect(result).toEqual({
        response: mockChatResponse,
      });
    });

    it('should handle context with different message types', async () => {
      const mixedContext = [
        {
          role: 'user',
          content: 'Hello',
        },
        {
          role: 'assistant',
          content: 'Hi! How can I help you?',
        },
        {
          role: 'user',
          content: 'I need pain medication',
        },
        {
          role: 'assistant',
          content: 'I can help you find pain medications.',
        },
      ] as ChatCompletionMessage[];

      const requestWithMixedContext = {
        userPrompt: 'What about ibuprofen?',
        context: mixedContext,
      };

      mockChatService.chat.mockResolvedValue(mockChatResponse);

      const result = await controller.chat(requestWithMixedContext);

      expect(chatService.chat).toHaveBeenCalledWith(
        'What about ibuprofen?',
        mixedContext,
      );

      expect(result).toEqual({
        response: mockChatResponse,
      });
    });

    it('should handle response with empty blocks', async () => {
      const emptyResponse = {
        blocks: [],
        context: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      };

      mockChatService.chat.mockResolvedValue(emptyResponse);

      const result = await controller.chat(mockChatRequest);

      expect(result).toEqual({
        response: emptyResponse,
      });
    });

    it('should handle response with empty context', async () => {
      const responseWithEmptyContext = {
        blocks: [
          {
            type: 'p',
            role: 'assistant',
            contents: ['Hello! How can I help you?'],
          },
        ],
        context: [],
      };

      mockChatService.chat.mockResolvedValue(responseWithEmptyContext);

      const result = await controller.chat(mockChatRequest);

      expect(result).toEqual({
        response: responseWithEmptyContext,
      });
    });
  });
}); 