import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Drug } from '@prisma/client';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

export interface MedicationsResult {
  medications: Partial<Drug>[];
  nextCursor?: string;
  hasMore: boolean;
}

@Injectable()
export class MedicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async getMedications(
    cursor?: string,
    limit: number = 10,
  ): Promise<MedicationsResult> {
    // Decode cursor if provided
    let decodedCursor: string | undefined;
    if (cursor) {
      try {
        decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      } catch (error) {
        console.log(error);
        decodedCursor = undefined;
      }
    }

    // Get medications with cursor-based pagination
    const medications = await this.prisma.drug.findMany({
      take: limit + 1, // Take one extra to check if there are more
      ...(decodedCursor && {
        cursor: {
          id: decodedCursor,
        },
      }),
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        name: true,
        generic_name: true,
        product_type: true,
        effective_time: true,
        title: true,
        slug: true,
        updated_at: true,
        meta_description: true,
        meta_description_blocks: true,
        labeler: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Check if there are more items
    const hasMore = medications.length > limit;
    const itemsToReturn = hasMore ? medications.slice(0, limit) : medications;

    // Get the next cursor
    let nextCursor: string | undefined;
    if (hasMore && itemsToReturn.length > 0) {
      const lastItem = itemsToReturn[itemsToReturn.length - 1];
      nextCursor = Buffer.from(lastItem.id).toString('base64');
    }

    return {
      medications: itemsToReturn,
      nextCursor,
      hasMore,
    };
  }

  async getMedicationBySlug(slug: string) {
    const medication = await this.prisma.drug.findUnique({
      where: {
        slug: slug,
      },
      select: {
        id: true,
        name: true,
        generic_name: true,
        product_type: true,
        effective_time: true,
        title: true,
        slug: true,
        updated_at: true,
        meta_description: true,
        ai_warnings: true,
        ai_dosing: true,
        ai_use_and_conditions: true,
        ai_contraindications: true,
        ai_description: true,
        vector_similar_ranking: true,
        meta_description_blocks: true,
        description_blocks: true,
        use_and_conditions_blocks: true,
        contra_indications_blocks: true,
        warning_blocks: true,
        dosing_blocks: true,
        labeler: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return medication;
  }

  async searchMedications(
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
  ): Promise<MedicationsResult> {
    try {
      // Try Elasticsearch search with filters first
      const elasticsearchResult =
        await this.elasticsearchService.searchMedicationsWithFilters(
          query,
          filters,
          cursor,
          limit,
        );

      // If Elasticsearch returns results, fetch full data from Prisma
      if (elasticsearchResult.medications.length > 0) {
        const slugs = elasticsearchResult.medications.map((m) => m.slug);

        // Fetch full medication data from Prisma using the slugs
        const medications = await this.prisma.drug.findMany({
          where: {
            slug: {
              in: slugs,
            },
          },
          select: {
            id: true,
            name: true,
            generic_name: true,
            product_type: true,
            effective_time: true,
            title: true,
            slug: true,
            updated_at: true,
            meta_description: true,
            meta_description_blocks: true,
            labeler: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Sort medications to match the order returned by Elasticsearch
        const sortedMedications = slugs
          .map((slug) => medications.find((m) => m.slug === slug))
          .filter(
            (medication): medication is NonNullable<typeof medication> =>
              medication !== undefined,
          );

        return {
          medications: sortedMedications,
          nextCursor: elasticsearchResult.nextCursor,
          hasMore: elasticsearchResult.hasMore,
        };
      }
    } catch (error) {
      console.log(
        'Elasticsearch search with filters failed, falling back to database search:',
        error,
      );
    }

    // Fallback to database search if Elasticsearch fails or returns no results
    return this.searchMedicationsInDatabase(query, filters, cursor, limit);
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
  ): Promise<MedicationsResult> {
    try {
      // Try Elasticsearch filter first
      const elasticsearchResult =
        await this.elasticsearchService.filterMedicationsByTags(
          filters,
          cursor,
          limit,
        );

      // If Elasticsearch returns results, fetch full data from Prisma
      if (elasticsearchResult.medications.length > 0) {
        const slugs = elasticsearchResult.medications.map((m) => m.slug);

        // Fetch full medication data from Prisma using the slugs
        const medications = await this.prisma.drug.findMany({
          where: {
            slug: {
              in: slugs,
            },
          },
          select: {
            id: true,
            name: true,
            generic_name: true,
            product_type: true,
            effective_time: true,
            title: true,
            slug: true,
            updated_at: true,
            meta_description: true,
            meta_description_blocks: true,
            labeler: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Sort medications to match the order returned by Elasticsearch
        const sortedMedications = slugs
          .map((slug) => medications.find((m) => m.slug === slug))
          .filter(
            (medication): medication is NonNullable<typeof medication> =>
              medication !== undefined,
          );

        return {
          medications: sortedMedications,
          nextCursor: elasticsearchResult.nextCursor,
          hasMore: elasticsearchResult.hasMore,
        };
      }

      // If Elasticsearch returns no results, return empty result
      return {
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      };
    } catch (error) {
      console.log('Elasticsearch filter failed:', error);

      // Return empty result since tags are only stored in Elasticsearch
      return {
        medications: [],
        nextCursor: undefined,
        hasMore: false,
      };
    }
  }

  async getTagsByCategory() {
    const tags = await this.prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        category: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return tags;
  }

  private async searchMedicationsInDatabase(
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
  ): Promise<MedicationsResult> {
    // Decode cursor if provided
    let decodedCursor: string | undefined;
    if (cursor) {
      try {
        decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      } catch (error) {
        console.log(error);
        decodedCursor = undefined;
      }
    }

    // Build search conditions
    const searchConditions: any = {
      AND: [
        {
          OR: [
            // AI fields search
            {
              ai_warnings: {
                contains: query,
                mode: 'insensitive' as const,
              },
            },
            {
              ai_dosing: {
                contains: query,
                mode: 'insensitive' as const,
              },
            },
            {
              ai_use_and_conditions: {
                contains: query,
                mode: 'insensitive' as const,
              },
            },
            {
              ai_contraindications: {
                contains: query,
                mode: 'insensitive' as const,
              },
            },
            {
              ai_description: {
                contains: query,
                mode: 'insensitive' as const,
              },
            },
            // Basic name and title search
            {
              name: {
                contains: query,
                mode: 'insensitive' as const,
              },
            },
            {
              generic_name: {
                contains: query,
                mode: 'insensitive' as const,
              },
            },
            {
              title: {
                contains: query,
                mode: 'insensitive' as const,
              },
            },
          ],
        },
      ],
    };

    // Add tag filters if provided
    if (filters) {
      const tagConditions: any[] = [];

      if (filters.tags_condition && filters.tags_condition.length > 0) {
        tagConditions.push({
          tags: {
            some: {
              tag: {
                name: {
                  in: filters.tags_condition,
                },
                category: 'conditions',
              },
            },
          },
        });
      }

      if (filters.tags_substance && filters.tags_substance.length > 0) {
        tagConditions.push({
          tags: {
            some: {
              tag: {
                name: {
                  in: filters.tags_substance,
                },
                category: 'substances',
              },
            },
          },
        });
      }

      if (filters.tags_indications && filters.tags_indications.length > 0) {
        tagConditions.push({
          tags: {
            some: {
              tag: {
                name: {
                  in: filters.tags_indications,
                },
                category: 'indications',
              },
            },
          },
        });
      }

      if (
        filters.tags_strengths_concentrations &&
        filters.tags_strengths_concentrations.length > 0
      ) {
        tagConditions.push({
          tags: {
            some: {
              tag: {
                name: {
                  in: filters.tags_strengths_concentrations,
                },
                category: 'strengths_concentrations',
              },
            },
          },
        });
      }

      if (filters.tags_population && filters.tags_population.length > 0) {
        tagConditions.push({
          tags: {
            some: {
              tag: {
                name: {
                  in: filters.tags_population,
                },
                category: 'populations',
              },
            },
          },
        });
      }

      if (tagConditions.length > 0) {
        searchConditions.AND.push(...tagConditions);
      }
    }

    // Get medications with simple text search
    const medications = await this.prisma.drug.findMany({
      where: searchConditions,
      take: limit + 1, // Take one extra to check if there are more
      ...(decodedCursor && {
        cursor: {
          id: decodedCursor,
        },
      }),
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        generic_name: true,
        product_type: true,
        effective_time: true,
        title: true,
        slug: true,
        updated_at: true,
        meta_description: true,
        ai_warnings: true,
        ai_dosing: true,
        ai_use_and_conditions: true,
        ai_contraindications: true,
        ai_description: true,
        meta_description_blocks: true,
        vector_similar_ranking: true,
        labeler: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Check if there are more items
    const hasMore = medications.length > limit;
    const itemsToReturn = hasMore ? medications.slice(0, limit) : medications;

    // Get the next cursor
    let nextCursor: string | undefined;
    if (hasMore && itemsToReturn.length > 0) {
      const lastItem = itemsToReturn[itemsToReturn.length - 1];
      nextCursor = Buffer.from(lastItem.id).toString('base64');
    }

    return {
      medications: itemsToReturn,
      nextCursor,
      hasMore,
    };
  }
}
