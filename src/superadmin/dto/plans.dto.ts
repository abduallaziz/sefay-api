import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PlanFeatureDto {
  @IsString()
  feature_key!: string;

  @IsBoolean()
  is_included!: boolean;

  @IsOptional()
  @IsNumber()
  limit_value?: number | null;
}

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsString()
  name_ar!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  description_ar?: string;

  @IsNumber()
  price_monthly!: number;

  @IsNumber()
  price_yearly!: number;

  @IsNumber()
  max_branches!: number;

  @IsNumber()
  extra_branch_price!: number;

  @IsNumber()
  max_users_per_branch!: number;

  @IsOptional()
  @IsBoolean()
  is_popular?: boolean;

  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureDto)
  features?: PlanFeatureDto[];
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  name_ar?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  description_ar?: string;

  @IsOptional()
  @IsNumber()
  price_monthly?: number;

  @IsOptional()
  @IsNumber()
  price_yearly?: number;

  @IsOptional()
  @IsNumber()
  max_branches?: number;

  @IsOptional()
  @IsNumber()
  extra_branch_price?: number;

  @IsOptional()
  @IsNumber()
  max_users_per_branch?: number;

  @IsOptional()
  @IsBoolean()
  is_popular?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureDto)
  features?: PlanFeatureDto[];
}