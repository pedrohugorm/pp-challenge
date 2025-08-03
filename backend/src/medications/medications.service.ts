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

    // Create search conditions for ai_ fields
    const searchConditions = {
      OR: [
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
      ],
    };

    // Get medications with full-text search on ai_ fields
    const medications = await this.prisma.drug.findMany({
      where: searchConditions,
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
