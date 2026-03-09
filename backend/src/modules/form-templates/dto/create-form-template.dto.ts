import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsIn,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionKey: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsIn(['rating4', 'nps'])
  scale: 'rating4' | 'nps';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subReasons?: [string, string, string];
}

class CreateBlockDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

export class CreateFormTemplateDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase, letters, numbers and hyphens',
  })
  slug: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateBlockDto)
  blocks: CreateBlockDto[];
}
