import {
  IsString,
  IsNumber,
  IsIn,
  IsBoolean,
  IsOptional,
  ValidateNested,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class SatisfactionDto {
  @IsNumber() @Min(1) @Max(5) overallCare: number;
  @IsNumber() @Min(1) @Max(5) nursingCare: number;
  @IsNumber() @Min(1) @Max(5) medicalCare: number;
  @IsNumber() @Min(1) @Max(5) welcoming: number;
  @IsNumber() @Min(1) @Max(5) cleanliness: number;
  @IsNumber() @Min(1) @Max(5) comfort: number;
  @IsNumber() @Min(1) @Max(5) responseTime: number;
  @IsNumber() @Min(1) @Max(5) wouldRecommend: number;
  @IsNumber() @Min(1) @Max(5) overallSatisfaction: number;
}

class ExperienceDto {
  @IsBoolean() professionalsIdentified: boolean;
  @IsBoolean() nameVerified: boolean;
  @IsBoolean() treatmentExplained: boolean;
  @IsBoolean() participatedInDecisions: boolean;
  @IsBoolean() medicationInstructionsClear: boolean;
  @IsBoolean() dischargeOrientationComplete: boolean;
  @IsBoolean() knewWhoToAsk: boolean;
  @IsBoolean() privacyRespected: boolean;
}

export class CreateFormDto {
  @IsString()
  @MinLength(2)
  patientName: string;

  @IsNumber()
  @Min(0)
  @Max(150)
  patientAge: number;

  @IsIn(['Masculino', 'Feminino', 'Outro'])
  patientGender: 'Masculino' | 'Feminino' | 'Outro';

  @IsString()
  admissionDate: string;

  @IsString()
  dischargeDate: string;

  @IsString()
  department: string;

  @ValidateNested()
  @Type(() => SatisfactionDto)
  satisfaction: SatisfactionDto;

  @ValidateNested()
  @Type(() => ExperienceDto)
  experience: ExperienceDto;

  @IsOptional()
  @IsString()
  comments?: string;
}
