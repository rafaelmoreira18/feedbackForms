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
  MaxLength,
  MinLength,
  Matches,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsCpfConstraint } from '../../../common/validators/cpf.validator';

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
  @MaxLength(500)
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
  @MaxLength(1000)
  comments?: string;
}
