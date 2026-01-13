import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateRegionalEventDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsString()
    @IsOptional()
    region?: string;

    @IsString()
    @IsOptional()
    district?: string;

    // No clubId here, as these are managed by hierarchy, not clubs
}
