import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Cool Apartments' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '123 Roxas, Davao City' })
  @IsString()
  address!: string;

  @ApiProperty({ example: 'A modern apartment complex', required: false })
  @IsOptional()
  description?: string;
}
