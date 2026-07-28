import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({
    example: '101',
    description: 'Unit identifier within the property',
  })
  @IsString()
  unitNumber!: string;

  @ApiProperty({ example: 15000, description: 'Monthly rent amount in PHP' })
  @IsNumber()
  @Min(0)
  monthlyRent!: number;

  @ApiProperty({
    example: 3,
    description: 'Floor number where the unit is located',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  floor?: number;
}
