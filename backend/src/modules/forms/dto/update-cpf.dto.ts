import { IsString, Matches, Validate } from 'class-validator';
import { IsCpfConstraint } from '../../../common/validators/cpf.validator';

/**
 * Payload for a holding_admin to retroactively add a CPF
 * to a response that was submitted without one.
 */
export class UpdateCpfDto {
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 dígitos numéricos' })
  @Validate(IsCpfConstraint)
  patientCpf: string;
}
