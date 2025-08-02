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
        blocks_json: true,
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
        description: true,
        generic_name: true,
        product_type: true,
        effective_time: true,
        title: true,
        slug: true,
        updated_at: true,
        blocks_json: true,
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
}
