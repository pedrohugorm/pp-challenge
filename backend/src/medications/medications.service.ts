import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Drug } from '@prisma/client';

export interface MedicationsResult {
  medications: Partial<Drug>[];
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

    // Simple text search on ai_ fields and other relevant fields
    const searchConditions = {
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
    };

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
