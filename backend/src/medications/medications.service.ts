import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MedicationsResult {
  medications: any[];
  nextCursor?: string;
  hasMore: boolean;
}

@Injectable()
export class MedicationsService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Preprocess query for better matching
    const processedQuery = this.preprocessSearchQuery(query);

    // Create comprehensive search conditions with multiple strategies
    const searchConditions = {
      OR: [
        // Exact matches (highest priority)
        {
          name: {
            equals: processedQuery,
            mode: 'insensitive' as const,
          },
        },
        {
          generic_name: {
            equals: processedQuery,
            mode: 'insensitive' as const,
          },
        },
        // Contains matches (medium priority)
        {
          name: {
            contains: processedQuery,
            mode: 'insensitive' as const,
          },
        },
        {
          generic_name: {
            contains: processedQuery,
            mode: 'insensitive' as const,
          },
        },
        {
          title: {
            contains: processedQuery,
            mode: 'insensitive' as const,
          },
        },
        // AI fields search (lower priority but comprehensive)
        {
          ai_warnings: {
            contains: processedQuery,
            mode: 'insensitive' as const,
          },
        },
        {
          ai_dosing: {
            contains: processedQuery,
            mode: 'insensitive' as const,
          },
        },
        {
          ai_use_and_conditions: {
            contains: processedQuery,
            mode: 'insensitive' as const,
          },
        },
        {
          ai_contraindications: {
            contains: processedQuery,
            mode: 'insensitive' as const,
          },
        },
        {
          ai_description: {
            contains: processedQuery,
            mode: 'insensitive' as const,
          },
        },
        // Product type search
        {
          product_type: {
            contains: processedQuery,
            mode: 'insensitive' as const,
          },
        },
        // Labeler name search
        {
          labeler: {
            name: {
              contains: processedQuery,
              mode: 'insensitive' as const,
            },
          },
        },
      ],
    };

    // Get medications with enhanced search
    const medications = await this.prisma.drug.findMany({
      where: searchConditions,
      take: limit + 1, // Take one extra to check if there are more
      ...(decodedCursor && {
        cursor: {
          id: decodedCursor,
        },
      }),
      orderBy: [
        // Order by relevance: exact matches first, then contains matches
        {
          name: 'asc',
        },
        {
          id: 'asc',
        },
      ],
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
        labeler: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Apply fuzzy ranking and filtering
    const rankedMedications = this.rankSearchResults(medications, processedQuery);

    // Check if there are more items
    const hasMore = rankedMedications.length > limit;
    const itemsToReturn = hasMore ? rankedMedications.slice(0, limit) : rankedMedications;

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

  /**
   * Preprocess search query for better matching
   */
  private preprocessSearchQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      // Remove common punctuation that might interfere with search
      .replace(/[^\w\s]/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Rank search results by relevance
   */
  private rankSearchResults(medications: any[], query: string): any[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 0);

    return medications
      .map(medication => {
        let score = 0;
        const nameLower = (medication.name || '').toLowerCase();
        const genericNameLower = (medication.generic_name || '').toLowerCase();
        const titleLower = (medication.title || '').toLowerCase();

        // Exact match scoring (highest priority)
        if (nameLower === queryLower) score += 1000;
        if (genericNameLower === queryLower) score += 900;
        if (titleLower === queryLower) score += 800;

        // Starts with scoring
        if (nameLower.startsWith(queryLower)) score += 500;
        if (genericNameLower.startsWith(queryLower)) score += 450;
        if (titleLower.startsWith(queryLower)) score += 400;

        // Contains scoring
        if (nameLower.includes(queryLower)) score += 300;
        if (genericNameLower.includes(queryLower)) score += 250;
        if (titleLower.includes(queryLower)) score += 200;

        // Word-based scoring (for multi-word queries)
        queryWords.forEach(word => {
          if (nameLower.includes(word)) score += 50;
          if (genericNameLower.includes(word)) score += 45;
          if (titleLower.includes(word)) score += 40;
        });

        // AI fields scoring (lower priority)
        const aiFields = [
          medication.ai_warnings,
          medication.ai_dosing,
          medication.ai_use_and_conditions,
          medication.ai_contraindications,
          medication.ai_description,
        ];

        aiFields.forEach(field => {
          if (field && field.toLowerCase().includes(queryLower)) {
            score += 10;
          }
        });

        // Labeler name scoring
        if (medication.labeler?.name?.toLowerCase().includes(queryLower)) {
          score += 100;
        }

        return { ...medication, _relevanceScore: score };
      })
      .filter(medication => medication._relevanceScore > 0) // Only return relevant results
      .sort((a, b) => b._relevanceScore - a._relevanceScore) // Sort by relevance score
      .map(({ _relevanceScore, ...medication }) => medication); // Remove score from final result
  }

  /**
   * Advanced fuzzy search using PostgreSQL similarity
   * Note: This requires the pg_trgm extension to be enabled in PostgreSQL
   */
  async fuzzySearchMedications(
    query: string,
    cursor?: string,
    limit: number = 20,
    similarityThreshold: number = 0.3,
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

    const processedQuery = this.preprocessSearchQuery(query);

    // Use raw SQL for similarity search
    const medications = await this.prisma.$queryRaw`
      SELECT 
        d.*,
        GREATEST(
          similarity(d.name, ${processedQuery}),
          similarity(COALESCE(d.generic_name, ''), ${processedQuery}),
          similarity(COALESCE(d.title, ''), ${processedQuery})
        ) as similarity_score
      FROM drugs d
      WHERE 
        similarity(d.name, ${processedQuery}) > ${similarityThreshold}
        OR similarity(COALESCE(d.generic_name, ''), ${processedQuery}) > ${similarityThreshold}
        OR similarity(COALESCE(d.title, ''), ${processedQuery}) > ${similarityThreshold}
        OR d.name ILIKE ${`%${processedQuery}%`}
        OR COALESCE(d.generic_name, '') ILIKE ${`%${processedQuery}%`}
        OR COALESCE(d.title, '') ILIKE ${`%${processedQuery}%`}
      ORDER BY similarity_score DESC, d.name ASC
      LIMIT ${limit + 1}
      ${decodedCursor ? `OFFSET (SELECT COUNT(*) FROM drugs WHERE id <= ${decodedCursor})` : ''}
    `;

    // Transform results to match expected format
    const transformedMedications = (medications as any[]).map(med => ({
      id: med.id,
      name: med.name,
      generic_name: med.generic_name,
      product_type: med.product_type,
      effective_time: med.effective_time,
      title: med.title,
      slug: med.slug,
      updated_at: med.updated_at,
      meta_description: med.meta_description,
      ai_warnings: med.ai_warnings,
      ai_dosing: med.ai_dosing,
      ai_use_and_conditions: med.ai_use_and_conditions,
      ai_contraindications: med.ai_contraindications,
      ai_description: med.ai_description,
      vector_similar_ranking: med.vector_similar_ranking,
      labeler: med.labeler_id ? { id: med.labeler_id, name: med.labeler_name } : null,
    }));

    // Check if there are more items
    const hasMore = transformedMedications.length > limit;
    const itemsToReturn = hasMore ? transformedMedications.slice(0, limit) : transformedMedications;

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
