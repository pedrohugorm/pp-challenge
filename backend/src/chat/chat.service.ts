import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ChatCompletionMessage,
  ChatCompletionTool,
} from 'openai/resources/chat/completions/completions';
import { QdrantClient } from '@qdrant/js-client-rest';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Item = z.infer<typeof ItemSchema>;

export const MedicationListSchema = z.array(ItemSchema);

export type MedicationList = z.infer<typeof MedicationListSchema>;

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private qdrantClient: QdrantClient;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private embeddingPipeline: any | null;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });

    // Initialize the embedding pipeline with all-MiniLM-L6-v2
    // Note: This is async, so we'll initialize it lazily when needed
    this.embeddingPipeline = null;
  }

  private async initializeEmbeddingPipeline() {
    try {
      // Dynamically import the transformers package
      const { pipeline, env } = await import('@xenova/transformers');

      // Allow remote models to be downloaded if not available locally
      env.allowLocalModels = true;
      env.allowRemoteModels = true;

      // Load the all-MiniLM-L6-v2 model
      this.embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
      );
      console.log('Embedding pipeline initialized successfully');
    } catch (error) {
      console.error('Error initializing embedding pipeline:', error);
      throw error;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.embeddingPipeline) {
        throw new Error('Embedding pipeline not initialized');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
      const result = await this.embeddingPipeline(text, {
        pooling: 'mean',
        normalize: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
      return Array.from(result.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  private async ensureEmbeddingPipelineReady(): Promise<void> {
    if (!this.embeddingPipeline) {
      await this.initializeEmbeddingPipeline();
    }
  }

  private async searchMedicalData(args: SearchMedicalDataRequest) {
    try {
      // Ensure embedding pipeline is ready
      await this.ensureEmbeddingPipelineReady();

      // Generate embedding using all-MiniLM-L6-v2
      const queryVector = await this.generateEmbedding(args.userPrompt);

      // Search Qdrant using vector search
      const searchResults = await this.qdrantClient.search('drug_data', {
        vector: queryVector,
        limit: 10,
        with_payload: true,
        score_threshold: 0.2,
      });

      console.log('Medical data search results:', searchResults);

      return searchResults.map((result) => ({
        id: result.id,
        score: result.score,
        payload: result.payload,
      }));
    } catch (error) {
      console.error('Error searching medical data:', error);
      throw error;
    }
  }

  async chat(prompt: string): Promise<ChatCompletionMessage[]> {
    // Ensure embedding pipeline is initialized
    await this.ensureEmbeddingPipelineReady();

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
              field: r.payload![args.field],
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
                tools: getTools(),
                store: true,
                response_format: zodResponseFormat(
                  MedicationListSchema,
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
