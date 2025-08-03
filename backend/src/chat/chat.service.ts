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
      temperature: 0.2,
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
  return `
You must use the \`search_medication_data\` tool when the user prompt involves medical or drug-related information, including but not limited to brand names, generic names, pharmacologic classes, side effects, dosage, administration routes, interactions, or regulatory data.

Unless the user explicitly requests a non-medication topic, assume the request pertains to drug or medication data, and call the \`search_medication_data\` tool.

Set the \`userPrompt\` parameter with a concise, normalized search phrase optimized for vector similarity search in ChromaDB:
- Extract only the medically relevant terms from the user input (e.g., drug names, conditions, symptoms, keywords such as “dosage” or “adverse effects”).
- Strip filler language and extraneous context.
- Preserve clinical terminology or codes (e.g., NDC, ATC, ingredient names).
- If multiple terms are present, prioritize the primary drug or target concept in the \`userPrompt\`.

Example transformations:
- Input: “What are the side effects of Verzenio?”
  → userPrompt: “Verzenio side effects”
- Input: “How do you dose pirtobrutinib in MCL?”
  → userPrompt: “pirtobrutinib dosage mantle cell lymphoma”
- Input: “Give me the ATC classification of ibuprofen”
  → userPrompt: “ibuprofen ATC classification”

Do not modify or simplify the user's original intent. Preserve specificity in medical terminology.
  `;
};

const getReviewPrompt = (searchResults: string) => {
  return `
You are given a list of search result chunks related to a user's prompt. Your task is to generate a clear, accurate response based on the content of these results.

Guidelines:
- Focus first on addressing the user’s prompt as directly as possible using the information in the search results.
- You may synthesize or paraphrase information across multiple chunks if they clearly relate to the user’s request (e.g., dosage, indications, contraindications, adverse reactions).
- You may infer obvious clinical meanings only if they are supported by the text (e.g., pregnancy listed under contraindications implies the drug should not be used during pregnancy).
- Do **not** fabricate or introduce information not present in the search results.
- Do **not** mention missing or unrelated results, or speculate beyond the content provided.
- If no search results are directly relevant to the user's prompt, do not say “no relevant results found.” Instead, provide a **brief, factual summary** of what the data *does* contain (e.g., "The search results include pharmacokinetic data, formulation details, and manufacturer information.").

## BEGIN Search Results:
${searchResults}
## END Search Results
  `;
};

const getReviewUserPrompt = (userPrompt: string) => {
  return `## BEGIN USER PROMPT:
  ${userPrompt}
  ## END USER PROMPT
  `;
};
