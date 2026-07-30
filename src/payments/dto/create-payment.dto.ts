import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    example: 'cms7d8fsx00006cu2s234dx5i',
    description: 'Lease ID',
  })
  @IsString()
  leaseId!: string;

  @ApiProperty({
    example: 15000,
    description: 'Amount paid',
  })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({
    example: '2025-02-01T00:00:00.000Z',
    description: 'Month this payment covers',
  })
  @IsDateString()
  coveringMonth!: string;

  @ApiProperty({
    example: 'Paid via GCash',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
