
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRequirementAdaptationDto {
    @IsString()
    @IsNotEmpty()
    condition: string;

    @IsString()
    @IsNotEmpty()
    adaptedText: string;

    @IsString()
    @IsOptional()
    instructorTip?: string;
}
