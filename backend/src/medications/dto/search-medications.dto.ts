import { IsString, IsOptional, IsInt, Min, Max, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

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

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim());
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  tags_condition?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim());
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  tags_substance?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim());
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  tags_indications?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim());
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  tags_strengths_concentrations?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim());
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  tags_population?: string[];
}
