import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AttendanceRecordDto {
    @IsString()
    userId: string;

    @IsNumber()
    points: number;

    @IsArray()
    @IsString({ each: true })
    requirements: string[];
}

export class AttendanceDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttendanceRecordDto)
    records: AttendanceRecordDto[];
}
