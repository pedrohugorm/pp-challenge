import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ChatCompletionMessage,
  ChatCompletionTool,
} from 'openai/resources/chat/completions/completions';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
  SearchMedicalDataRequest,
  SearchMedicalDataService,
} from './search-medical-data.service';

export const MedicationSchema = z.object({
  id: z.string({ description: 'id of the medication' }),
  name: z.string({ description: 'name of the medication' }),
  slug: z.string({ description: 'slug of the medication' }),
});

export type Medication = z.infer<typeof MedicationSchema>;

export const MedicationListSchema = z.array(MedicationSchema);

export type MedicationList = z.infer<typeof MedicationListSchema>;

export const MedicationListResponseSchema = z.object({
  medications: MedicationListSchema,
  reasoning: z.string({
    description:
      'Message on why the medication list was selected in a polite conversational tone for the user.',
  }),
});

export type MedicationListResponse = z.infer<
  typeof MedicationListResponseSchema
>;

type ChatCompletion = Omit<ChatCompletionMessage, 'role'> & {
  tool_call_id?: string;
  role: any;
};

@Injectable()
export class ChatService {
  private openai: OpenAI;

  constructor(
    private readonly searchMedicalDataService: SearchMedicalDataService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(prompt: string, context: ChatCompletion[]): Promise<ChatResponse> {
    const CONTEXT_SIZE = 10;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        ...(context.length > CONTEXT_SIZE
          ? context.slice(-CONTEXT_SIZE)
          : context),
        { role: 'system', content: getSearchPrompt() },
        { role: 'user', content: prompt },
      ],
      tools: getTools(),
      store: true,
    });

    let result = [response.choices[0].message];
    if (
      response.choices[0].message.tool_calls &&
      response.choices[0].message.tool_calls.length > 0
    ) {
      for (const tool of response.choices[0].message.tool_calls) {
        switch (tool.function.name) {
          case 'search_medication_data': {
            const args = JSON.parse(
              tool.function.arguments,
            ) as SearchMedicalDataRequest;
            const searchResult =
              await this.searchMedicalDataService.searchMedicalData(args);
            const medications = searchResult.map((r) => ({
              id: r.payload['item_id'] as string,
              name: r.payload['drugName'] as string,
              slug: r.payload['slug'] as string,
              chunk: r.chunk,
            }));

            const reviewResult = await this.openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: getReviewPrompt(JSON.stringify(medications)),
                },
                { role: 'user', content: getReviewUserPrompt(prompt) },
              ],
              store: true,
              response_format: zodResponseFormat(
                MedicationListResponseSchema,
                'medications',
              ),
            });

            const reviewToolResult: ChatCompletion = {
              ...reviewResult.choices[0].message,
              tool_call_id: tool.id,
              role: 'tool',
            };
            result = [...result, reviewToolResult];
          }
        }
      }

      return convertResultToChatMessage(result);
    }

    return {
      context: [...context, response.choices[0].message],
      blocks: [
        {
          role: 'assistant',
          contents: [response.choices[0].message.content || ''],
          type: 'p',
        },
      ],
    };
  }
}

interface Blocks {
  type: 'p' | 'embed-medication';
  role: 'assistant' | 'user';
  contents: (Medication | string)[];
}

export interface ChatResponse {
  blocks: Blocks[];
  context: ChatCompletion[];
}

const convertResultToChatMessage = (
  chatCompletions: ChatCompletion[],
): ChatResponse => {
  let blocks: Blocks[] = [];

  for (const message of chatCompletions) {
    if (message.tool_calls) {
      continue;
    }

    if (!message.content) {
      blocks = [
        ...blocks,
        {
          type: 'p',
          role: 'assistant',
          contents: ['Something went wrong. I could not find any information.'],
        },
      ];
      continue;
    }

    const medicationList: MedicationListResponse = JSON.parse(
      message.content,
    ) as MedicationListResponse;

    blocks = [
      ...blocks,
      {
        type: 'p',
        role: 'assistant',
        contents: [medicationList.reasoning, ...medicationList.medications],
      },
    ];
  }

  return { blocks, context: chatCompletions };
};

const getTools = () => [
  {
    type: 'function',
    function: {
      name: 'search_medication_data',
      description: 'Searches for medication data by the user prompt.',
      parameters: {
        type: 'object',
        required: ['userPrompt'],
        properties: {
          userPrompt: {
            type: 'string',
            description: 'the medication info the user is looking for',
          },
        },
        additionalProperties: false,
      },
      strict: true,
    },
  } as ChatCompletionTool,
];

const getSearchPrompt = () => {
  return `You must use the search_medication_data tool when searching for anything related to medical or drug data.
  If not specified assume the user is interested in drug data and use the search_medication_data tool.
  `;
};

const getReviewPrompt = (searchResults: string) => {
  return `Your task is to read the search results list below against a user prompt and ONLY include the items that are relevant to what the user asked on your response.
  Do not mention that there were other search results.
  Do not mention search result items that are not relevant. 
  If you cannot find any items, just say that you cannot find any item and do not hallucinate or look for information anywhere else.
  ## BEGIN Search Results:
  ${searchResults}
  ## END Search results
  `;
};

const getReviewUserPrompt = (userPrompt: string) => {
  return `## BEGIN USER PROMPT:
  ${userPrompt}
  ## END USER PROMPT
  `;
};
