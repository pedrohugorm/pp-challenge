import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ChatCompletionMessage,
  ChatCompletionTool,
} from 'openai/resources/chat/completions/completions';
import { QdrantClient } from '@qdrant/js-client-rest';
import { pipeline, env, FeatureExtractionPipeline } from '@xenova/transformers';

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private qdrantClient: QdrantClient;
  private embeddingPipeline: FeatureExtractionPipeline | null;

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
      // Set environment to use local models
      env.allowLocalModels = true;
      env.allowRemoteModels = false;

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

      const result = await this.embeddingPipeline(text, {
        pooling: 'mean',
        normalize: true,
      });

      return Array.from(result.data as any);
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
        score_threshold: 0.7,
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
      messages: [{ role: 'user', content: prompt }],
      tools: getTools(),
      store: true,
    });

    const result = [response.choices[0].message];
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
            await this.searchMedicalData(args);
          }
        }
      }
    }

    return result;
  }
}

const getTools = () => ([
  {
    type: 'function',
    function: {
      name: 'search_medication_data',
      description: 'Searches for medication data by the user prompt.',
      parameters: {
        type: 'object',
        properties: {
          userPrompt: {
            type: 'string',
            description: 'the medication info the user is looking for',
          },
        },
      },
      strict: true,
    },
  } as ChatCompletionTool,
]);

interface SearchMedicalDataRequest {
  userPrompt: string;
}
