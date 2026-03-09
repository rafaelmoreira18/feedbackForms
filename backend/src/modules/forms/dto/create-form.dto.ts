import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsIn,
  IsOptional,
  IsArray,
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

class AnswerItemDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  value: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reasons?: string[];

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateForm3Dto {
  /**
   * Must match a FormTemplateEntity.slug for this tenant.
   * Validated by the service against the DB — not an enum.
   */
  @IsString()
  @IsNotEmpty()
  formType: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];

  @IsOptional()
  @IsString()
  comments?: string;
}
