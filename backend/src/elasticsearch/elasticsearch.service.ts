import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

export interface ElasticsearchSearchResult {
  slug: string;
  score?: number;
}

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private client: Client;
  private readonly indexName = 'drugs_db';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const esHost = this.configService.get('ELASTICSEARCH_HOST', 'localhost');
    const esPort = this.configService.get('ELASTICSEARCH_PORT', '9200');
    const esUrl = this.configService.get(
      'ELASTICSEARCH_URL',
      `http://${esHost}:${esPort}`,
    );

    this.client = new Client({
      node: esUrl,
    });

    // Test connection
    try {
      await this.client.ping();
      console.log('Elasticsearch connection established');
    } catch (error) {
      console.error('Failed to connect to Elasticsearch:', error);
    }
  }

  async searchMedications(
    query: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{
    medications: ElasticsearchSearchResult[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    try {
      // Simple search query
      const searchQuery: any = {
        index: this.indexName,
        query: {
          multi_match: {
            query,
            fields: ['drugName', 'genericName', 'title', 'ai_description', 'ai_warnings', 'ai_dosing', 'ai_use_and_conditions', 'ai_contraindications', 'metaDescription'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        },
        sort: [{ _score: { order: 'desc' } }],
        size: limit + 1, // Take one extra to check if there are more
      };

      if (cursor) {
        searchQuery.search_after = [cursor];
      }

      console.log('Elasticsearch search query:', JSON.stringify(searchQuery, null, 2));
      const response = await this.client.search(searchQuery);
      console.log('Elasticsearch response hits:', response.hits.total);

      const medications = response.hits.hits.map((hit) => {
        const source = hit._source as any;
        return {
          slug: source.slug,
          score: hit._score,
        };
      }) as ElasticsearchSearchResult[];

      // Check if there are more items
      const hasMore = medications.length > limit;
      const itemsToReturn = hasMore ? medications.slice(0, limit) : medications;

      // Get the next cursor (search_after)
      let nextCursor: string | undefined;
      if (hasMore && itemsToReturn.length > 0) {
        const lastHit = response.hits.hits[limit - 1];
        nextCursor = lastHit.sort?.[0]?.toString();
      }

      return {
        medications: itemsToReturn,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      console.error('Elasticsearch search error:', error);
      // Fallback to empty result if Elasticsearch is not available
      return {
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      };
    }
  }

  async indexMedication(medication: any): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: medication.id,
        body: medication,
      });
    } catch (error) {
      console.error('Error indexing medication:', error);
    }
  }

  async bulkIndexMedications(medications: any[]): Promise<void> {
    try {
      const operations = medications.flatMap((medication) => [
        { index: { _index: this.indexName, _id: medication.id } },
        medication,
      ]);

      await this.client.bulk({ body: operations });
    } catch (error) {
      console.error('Error bulk indexing medications:', error);
    }
  }
}
