
import { IsString, IsNotEmpty, IsEnum, IsOptional, ValidateNested, IsArray, IsInt, IsDateString } from 'class-validator';
import { DBVClass, RequirementType } from '@prisma/client';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';
import { CreateRequirementAdaptationDto } from './create-requirement-adaptation.dto';

export class CreateRequirementDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    dbvClass?: DBVClass;

    @IsString()
    @IsOptional()
    specialtyId?: string;

    @IsString()
    @IsOptional()
    title?: string;

    @IsInt()
    @IsOptional()
    points?: number;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsString()
    @IsOptional()
    area?: string;

    @IsString()
    @IsOptional()
    clubId?: string;

    @IsString()
    @IsOptional()
    region?: string;

    @IsString()
    @IsOptional()
    district?: string;

    @IsString()
    @IsOptional()
    regionalEventId?: string;

    @IsEnum(RequirementType)
    @IsOptional()
    type?: RequirementType;

    @IsOptional()
    @IsEnum(['DISCOVERY', 'EXECUTION', 'LEADERSHIP'])
    methodology?: 'DISCOVERY' | 'EXECUTION' | 'LEADERSHIP';

    @IsOptional()
    @IsEnum(['JUNIOR', 'TEEN', 'SENIOR'])
    ageGroup?: 'JUNIOR' | 'TEEN' | 'SENIOR';

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions?: CreateQuestionDto[];

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateRequirementAdaptationDto)
    adaptations?: CreateRequirementAdaptationDto[];
}
