import {
  IsArray,
  IsIn,
  IsInt,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class AnxietyAnswerDto {
  /** índice do item: 1..21 (BAI) ou 1..7 (GAD-7) */
  @IsInt()
  @Min(1)
  @Max(21)
  itemId: number;

  /** 0..3 */
  @IsInt()
  @Min(0)
  @Max(3)
  value: number;
}

export class SubmitAnxietyAnswersDto {
  @IsIn(['bai', 'gad7'])
  instrument: 'bai' | 'gad7';

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(21)
  @ValidateNested({ each: true })
  @Type(() => AnxietyAnswerDto)
  answers: AnxietyAnswerDto[];
}
