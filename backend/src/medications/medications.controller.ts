import { Controller, Get, Query } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { GetMedicationsDto } from './dto/get-medications.dto';

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
}
