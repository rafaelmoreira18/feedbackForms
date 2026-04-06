import { IsString, IsNotEmpty, Matches, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers and hyphens only',
  })
  slug: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  hasFeedbackForms?: boolean;
}
