import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsIn,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
  Validate,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsCpfConstraint } from '../../../common/validators/cpf.validator';
import { CPF_JUSTIFICATIVAS } from '../../../common/constants/cpf-justificativas';

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

  /**
   * 11 numeric digits. Optional — omit (or send null) when CPF is not available.
   * When omitted, cpfJustificativa is required.
   */
  @IsOptional()
  @ValidateIf((o: CreateForm3Dto) => o.patientCpf != null)
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 dígitos numéricos' })
  @Validate(IsCpfConstraint)
  patientCpf?: string | null;

  /**
   * Required when patientCpf is not provided AND recusouResponder is false.
   * Must be one of the predefined justification options.
   */
  @ValidateIf((o: CreateForm3Dto) => o.patientCpf == null && !o.recusouResponder)
  @IsNotEmpty({ message: 'Justificativa é obrigatória quando o CPF não é informado' })
  @IsIn(CPF_JUSTIFICATIVAS, { message: 'Justificativa inválida' })
  cpfJustificativa?: string | null;

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

  @IsOptional()
  @IsBoolean()
  recusouResponder?: boolean;
}
