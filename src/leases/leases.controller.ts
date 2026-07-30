import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'generated/prisma/enums';
import { LeasesService } from './leases.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';

@ApiTags('Leases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leases')
export class LeasesController {
  constructor(private leasesService: LeasesService) {}

  @ApiOperation({ summary: 'Create a lease' })
  @ApiResponse({
    status: 201,
    description: 'Lease created, unit marked OCCUPIED',
  })
  @ApiResponse({ status: 404, description: 'Unit or tenant not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 409, description: 'Unit already has an active lease' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Post()
  create(@Body() dto: CreateLeaseDto, @Request() req) {
    return this.leasesService.create(dto, req.user.id, req.user.role);
  }

  @ApiOperation({ summary: 'Get all leases (scoped by role)' })
  @ApiResponse({ status: 200, description: 'List of leases' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN, Role.TENANT)
  @Get()
  findAll(@Request() req) {
    return this.leasesService.findAll(req.user.id, req.user.role);
  }

  @ApiOperation({ summary: 'Get a single lease' })
  @ApiResponse({ status: 200, description: 'Lease details' })
  @ApiResponse({ status: 404, description: 'Lease not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN, Role.TENANT)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.leasesService.findOne(id, req.user.id, req.user.role);
  }

  @ApiOperation({ summary: 'Update a lease' })
  @ApiResponse({ status: 200, description: 'Lease updated' })
  @ApiResponse({ status: 404, description: 'Lease not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeaseDto, @Request() req) {
    return this.leasesService.update(id, dto, req.user.id, req.user.role);
  }

  @ApiOperation({ summary: 'Delete a lease' })
  @ApiResponse({ status: 200, description: 'Lease deleted' })
  @ApiResponse({ status: 404, description: 'Lease not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.leasesService.remove(id, req.user.id, req.user.role);
  }
}
