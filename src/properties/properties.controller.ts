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
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator'; // decorator
import { Role } from 'generated/prisma/enums'; // enum

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

  @ApiOperation({ summary: 'Create a property' })
  @ApiResponse({ status: 201, description: 'Property Created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Post()
  create(@Body() dto: CreatePropertyDto, @Request() req) {
    return this.propertiesService.create(dto, req.user.id);
  }

  @ApiOperation({ summary: 'Get all properties' })
  @ApiResponse({ status: 200, description: 'List of properties' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Get()
  findAll(@Request() req) {
    return this.propertiesService.findAll(req.user.id, req.user.role);
  }

  @ApiOperation({ summary: 'Get one property' })
  @ApiResponse({ status: 200, description: 'Property details' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.propertiesService.findOne(id, req.user.id, req.user.role);
  }

  @ApiOperation({ summary: 'Update property' })
  @ApiResponse({ status: 200, description: 'Property updated' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @Request() req,
  ) {
    return this.propertiesService.update(id, dto, req.user.id, req.user.role);
  }

  @ApiOperation({ summary: 'Delete property' })
  @ApiResponse({ status: 200, description: 'Property deleted' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.propertiesService.remove(id, req.user.id, req.user.role);
  }
}
