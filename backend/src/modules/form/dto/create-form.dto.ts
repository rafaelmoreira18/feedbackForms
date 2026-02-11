import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsIn,
  IsBoolean,
  IsOptional,
  ValidateNested,
  Min,
  Max,
  MinLength,
  Matches,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'isCpf', async: false })
class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(cpf: string) {
    if (!/^\d{11}$/.test(cpf)) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    if (parseInt(cpf[9]) !== check) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    if (parseInt(cpf[10]) !== check) return false;

    return true;
  }

  defaultMessage() {
    return 'CPF inválido';
  }
}

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

  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 dígitos numéricos' })
  @Validate(IsCpfConstraint)
  patientCpf: string;

  @IsNumber()
  @Min(0)
  @Max(150)
  patientAge: number;

  @IsIn(['Masculino', 'Feminino', 'Outro'])
  patientGender: 'Masculino' | 'Feminino' | 'Outro';

  @IsString()
  @IsNotEmpty()
  admissionDate: string;

  @IsString()
  @IsNotEmpty()
  dischargeDate: string;

  @IsString()
  @IsNotEmpty()
  evaluatedDepartment: string;

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
