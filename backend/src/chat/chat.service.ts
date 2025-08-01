import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionTool } from 'openai/resources/chat/completions/completions';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private qdrantClient: QdrantClient;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  private async searchMedicalData(args: SearchMedicalDataRequest) {
    try {
      // Search Qdrant using built-in embedding
      const searchResults = await this.qdrantClient.search('drug_data', {
        query: args.userPrompt,
        limit: 10,
        with_payload: true,
        score_threshold: 0.7,
      });

      console.log('Medical data search results:', searchResults);

      return searchResults.map(result => ({
        id: result.id,
        score: result.score,
        payload: result.payload,
      }));
    } catch (error) {
      console.error('Error searching medical data:', error);
      throw error;
    }
  }

  async chat(prompt: string): Promise<string[]> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: prompt }],
      tools,
      store: true,
    });

    let result = [response.choices[0].message.content!];
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

const tools: ChatCompletionTool[] = [
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
  },
];

interface SearchMedicalDataRequest {
  userPrompt: string;
}

