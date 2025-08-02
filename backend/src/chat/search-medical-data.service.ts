import { Injectable } from '@nestjs/common';
import { ChromaClient } from 'chromadb';

export interface SearchMedicalDataRequest {
  userPrompt: string;
  field: string;
}

export interface SearchResult {
  id: string;
  score: number;
  payload: Record<string, any>;
}

@Injectable()
export class SearchMedicalDataService {
  private chromaClient: ChromaClient;

  constructor() {
    this.chromaClient = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000',
    });
  }

  async searchMedicalData(
    args: SearchMedicalDataRequest,
  ): Promise<SearchResult[]> {
    try {
      // Get or create the collection
      const collection = await this.chromaClient.getOrCreateCollection({
        name: 'drug_data',
      });

      // Search ChromaDB using a text query (ChromaDB handles embeddings automatically)
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
}
