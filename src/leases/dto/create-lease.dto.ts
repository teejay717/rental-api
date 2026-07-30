import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateLeaseDto {
  @ApiProperty({
    example: 'cms5xsky90001y0u22tcpdec1',
    description: 'ID of the unit being leased',
  })
  @IsString()
  unitId!: string;

  @ApiProperty({
    example: 'cms4tlg9r0001lsu2xyz12345',
    description: 'ID of the tenant (user with TENANT role)',
  })
  @IsString()
  tenantId!: string;

  @ApiProperty({
    example: '2025-02-01T00:00:00.000Z',
    description: 'Lease start date',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2026-02-01T00:00:00.000Z',
    description: 'Lease end date',
  })
  @IsDateString()
  endDate!: string;

  @ApiProperty({
    example: 15000,
    description: 'Monthly rent amount (copied from unit, can be negotiated)',
  })
  @IsNumber()
  @Min(0)
  monthlyRent!: number;

  @ApiProperty({
    example: 30000,
    description: 'Security deposit (typically 1-2 months rent)',
  })
  @IsNumber()
  @Min(0)
  deposit!: number;
}
