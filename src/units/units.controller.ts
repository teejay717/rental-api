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
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'generated/prisma/enums';

@ApiTags('Units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @ApiOperation({ summary: 'Add a unit to a property' })
  @ApiResponse({ status: 201, description: 'Unit created' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Post('properties/:propertyId/units')
  create(
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateUnitDto,
    @Request() req,
  ) {
    return this.unitsService.create(
      propertyId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Get all units in a property' })
  @ApiResponse({ status: 200, description: 'List of units' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Get('properties/:propertyId/units')
  findAll(@Param('propertyId') propertyId: string, @Request() req) {
    return this.unitsService.findAll(propertyId, req.user.id, req.user.role);
  }

  @ApiOperation({ summary: 'Get a single unit' })
  @ApiResponse({ status: 200, description: 'Unit details' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Get('units/:id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.unitsService.findOne(id, req.user.id, req.user.role);
  }

  @ApiOperation({ summary: 'Update a unit' })
  @ApiResponse({ status: 200, description: 'Unit updated' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch('units/:id')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto, @Request() req) {
    return this.unitsService.update(id, dto, req.user.id, req.user.role);
  }

  @ApiOperation({ summary: 'Delete a unit' })
  @ApiResponse({ status: 200, description: 'Unit deleted' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Delete('units/:id')
  remove(@Param('id') id: string, @Request() req) {
    return this.unitsService.remove(id, req.user.id, req.user.role);
  }
}
