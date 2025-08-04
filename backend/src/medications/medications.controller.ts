import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { GetMedicationsDto } from './dto/get-medications.dto';
import { SearchMedicationsDto } from './dto/search-medications.dto';
import { CacheInterceptor } from '@nestjs/cache-manager/dist';

export interface MedicationsResponse {
  medications: any[];
  nextCursor?: string;
  hasMore: boolean;
}

@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get()
  async getMedications(
    @Query() query: GetMedicationsDto,
  ): Promise<MedicationsResponse> {
    const result = await this.medicationsService.getMedications(
      query.cursor,
      query.limit,
    );

    return {
      medications: result.medications,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  @Post('search')
  async searchMedications(
    @Body() searchDto: SearchMedicationsDto,
  ): Promise<MedicationsResponse> {
    // Use fuzzy search if requested, otherwise use enhanced regular search
    const result = await this.medicationsService.searchMedications(
      searchDto.query,
      searchDto.cursor,
      searchDto.limit,
    );

    return {
      medications: result.medications,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  // @UseInterceptors(CacheInterceptor)
  @Get(':slug')
  async getMedicationBySlug(@Param('slug') slug: string) {
    const medication = await this.medicationsService.getMedicationBySlug(slug);

    if (!medication) {
      throw new NotFoundException(`Medication with slug '${slug}' not found`);
    }

    return medication;
  }
}
