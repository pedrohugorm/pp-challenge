import { IsString, IsOptional, IsInt, Min, Max, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchMedicationsDto {
  @IsString()
  query: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  fuzzy?: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  similarityThreshold?: number = 0.3;
}
