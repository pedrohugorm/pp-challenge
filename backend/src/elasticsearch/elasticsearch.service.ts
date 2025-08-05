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
    const esHost: string = this.configService.get(
      'ELASTICSEARCH_HOST',
      'localhost',
    );
    const esPort: string = this.configService.get('ELASTICSEARCH_PORT', '9200');
    const esUrl: string = this.configService.get(
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
    return this.searchMedicationsWithFilters(query, undefined, cursor, limit);
  }

  async searchMedicationsWithFilters(
    query: string,
    filters?: {
      tags_condition?: string[];
      tags_substance?: string[];
      tags_indications?: string[];
      tags_strengths_concentrations?: string[];
      tags_population?: string[];
    },
    cursor?: string,
    limit: number = 20,
  ): Promise<{
    medications: ElasticsearchSearchResult[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    try {
      // Build the search query
      const searchQuery: any = {
        index: this.indexName,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: [
                    'drugName',
                    'genericName',
                    'title',
                    'ai_description',
                    'ai_warnings',
                    'ai_dosing',
                    'ai_use_and_conditions',
                    'ai_contraindications',
                    'metaDescription',
                  ],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: [],
          },
        },
        sort: [{ _score: { order: 'desc' } }],
        size: limit + 1, // Take one extra to check if there are more
        search_after: [],
      };

      // Add tag filters if provided
      if (filters) {
        const filterConditions: any[] = [];
        
        if (filters.tags_condition && filters.tags_condition.length > 0) {
          filterConditions.push({
            terms: {
              tags_condition: filters.tags_condition,
            },
          });
        }
        
        if (filters.tags_substance && filters.tags_substance.length > 0) {
          filterConditions.push({
            terms: {
              tags_substance: filters.tags_substance,
            },
          });
        }
        
        if (filters.tags_indications && filters.tags_indications.length > 0) {
          filterConditions.push({
            terms: {
              tags_indications: filters.tags_indications,
            },
          });
        }
        
        if (filters.tags_strengths_concentrations && filters.tags_strengths_concentrations.length > 0) {
          filterConditions.push({
            terms: {
              tags_strengths_concentrations: filters.tags_strengths_concentrations,
            },
          });
        }
        
        if (filters.tags_population && filters.tags_population.length > 0) {
          filterConditions.push({
            terms: {
              tags_population: filters.tags_population,
            },
          });
        }
        
        searchQuery.query.bool.filter = filterConditions;
      }

      if (cursor) {
        searchQuery.search_after = [cursor];
      }

      console.log(
        'Elasticsearch search query:',
        JSON.stringify(searchQuery, null, 2),
      );
      const response = await this.client.search(searchQuery);
      console.log('Elasticsearch response hits:', response.hits.total);

      const medications = response.hits.hits.map((hit) => {
        const source = hit._source as { slug: string };
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
      // Fallback to an empty result if Elasticsearch is not available
      return {
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      };
    }
  }

  async filterMedicationsByTags(
    filters: {
      tags_condition?: string[];
      tags_substance?: string[];
      tags_indications?: string[];
      tags_strengths_concentrations?: string[];
      tags_population?: string[];
    },
    cursor?: string,
    limit: number = 20,
  ): Promise<{
    medications: ElasticsearchSearchResult[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    try {
      // Build AND query for all provided filters
      const mustClauses: any[] = [];

      // Add each filter as a terms query (exact match for arrays)
      if (filters.tags_condition && filters.tags_condition.length > 0) {
        mustClauses.push({
          terms: {
            tags_condition: filters.tags_condition,
          },
        });
      }

      if (filters.tags_substance && filters.tags_substance.length > 0) {
        mustClauses.push({
          terms: {
            tags_substance: filters.tags_substance,
          },
        });
      }

      if (filters.tags_indications && filters.tags_indications.length > 0) {
        mustClauses.push({
          terms: {
            tags_indications: filters.tags_indications,
          },
        });
      }

      if (filters.tags_strengths_concentrations && filters.tags_strengths_concentrations.length > 0) {
        mustClauses.push({
          terms: {
            tags_strengths_concentrations: filters.tags_strengths_concentrations,
          },
        });
      }

      if (filters.tags_population && filters.tags_population.length > 0) {
        mustClauses.push({
          terms: {
            tags_population: filters.tags_population,
          },
        });
      }

      // If no filters provided, return empty result
      if (mustClauses.length === 0) {
        return {
          medications: [],
          nextCursor: undefined,
          hasMore: false,
        };
      }

      const searchQuery: any = {
        index: this.indexName,
        query: {
          bool: {
            must: mustClauses,
          },
        },
        sort: [{ _score: { order: 'desc' } }],
        size: limit + 1, // Take one extra to check if there are more
        search_after: [],
      };

      if (cursor) {
        searchQuery.search_after = [cursor];
      }

      console.log(
        'Elasticsearch filter query:',
        JSON.stringify(searchQuery, null, 2),
      );
      const response = await this.client.search(searchQuery);
      console.log('Elasticsearch filter response hits:', response.hits.total);

      const medications = response.hits.hits.map((hit) => {
        const source = hit._source as { slug: string };
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
      console.error('Elasticsearch filter error:', error);
      // Fallback to an empty result if Elasticsearch is not available
      return {
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      };
    }
  }
}
