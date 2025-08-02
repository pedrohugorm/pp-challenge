import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ChatCompletionMessage,
  ChatCompletionTool,
} from 'openai/resources/chat/completions/completions';
import { ChromaClient } from 'chromadb';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

export const ItemSchema = z.object({
  id: z.string({ description: 'id of the medication' }),
  name: z.string({ description: 'name of the medication' }),
});

export type Item = z.infer<typeof ItemSchema>;

export const MedicationListSchema = z.array(ItemSchema);

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

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private chromaClient: ChromaClient;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.chromaClient = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000',
    });
  }

  private async searchMedicalData(args: SearchMedicalDataRequest) {
    try {
      // Get or create the collection
      const collection = await this.chromaClient.getOrCreateCollection({
        name: 'drug_data',
      });

      // Search ChromaDB using text query (ChromaDB handles embeddings automatically)
      const searchResults = await collection.query({
        queryTexts: [args.userPrompt],
        nResults: 10,
      });

      console.log('Medical data search results:', searchResults);

      // Transform results to match the expected format
      return searchResults.ids[0].map((id, index) => ({
        id: id,
        score: 1 - (searchResults.distances?.[0]?.[index] || 0), // Convert distance to similarity score
        payload: searchResults.metadatas?.[0]?.[index] || {},
      }));
    } catch (error) {
      console.error('Error searching medical data:', error);
      throw error;
    }
  }

  async chat(prompt: string): Promise<ChatCompletionMessage[]> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
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
            const searchResult = await this.searchMedicalData(args);
            const medications = searchResult.map((r) => ({
              id: r.id,
              field: r.payload[args.field],
            }));

            const confirmationResult =
              await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: getConfirmationPrompt(JSON.stringify(medications)),
                  },
                  { role: 'user', content: getConfirmationUserPrompt(prompt) },
                ],
                store: true,
                response_format: zodResponseFormat(
                  MedicationListResponseSchema,
                  'medications',
                ),
              });

            result = [...result, confirmationResult.choices[0].message];
          }
        }
      }
    }

    return result;
  }
}

const getTools = () => [
  {
    type: 'function',
    function: {
      name: 'search_medication_data',
      description: 'Searches for medication data by the user prompt.',
      parameters: {
        type: 'object',
        required: ['userPrompt', 'field'],
        properties: {
          userPrompt: {
            type: 'string',
            description: 'the medication info the user is looking for',
          },
          field: {
            type: 'string',
            description: 'the specific field of medication data to search for',
            enum: [
              'name',
              'indicationsAndUsage',
              'dosageAndAdministration',
              'dosageFormsAndStrengths',
              'warningsAndPrecautions',
              'adverseReactions',
              'clinicalPharmacology',
              'clinicalStudies',
              'howSupplied',
              'useInSpecificPopulations',
              'description',
              'nonclinicalToxicology',
              'instructionsForUse',
              'mechanismOfAction',
              'contraindications',
              'boxedWarning',
            ],
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

const getConfirmationPrompt = (searchResults) => {
  return `Your task is to read the search results list below against a user prompt and ONLY include the items that are relevant to what the user asked on your response.
  Do not mention that there were other search results.
  Do not mention search result items that are not relevant. 
  ## BEGIN Search Results:
  ${searchResults}
  ## END Search results
  `;
};

const getConfirmationUserPrompt = (userPrompt: string) => {
  return `## BEGIN USER PROMPT:
  ${userPrompt}
  ## END USER PROMPT
  `;
};

interface SearchMedicalDataRequest {
  userPrompt: string;
  field: string;
}
