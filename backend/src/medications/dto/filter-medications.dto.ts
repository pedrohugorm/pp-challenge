import { IsOptional, IsArray, IsString, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FilterMedicationsDto {
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;
} 