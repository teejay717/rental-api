import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'generated/prisma/enums';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(
    propertyId: string,
    dto: CreateUnitDto,
    userId: string,
    userRole: Role,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (userRole !== Role.ADMIN && property.ownerId !== userId) {
      throw new ForbiddenException('Access Denied');
    }

    return this.prisma.unit.create({
      data: {
        ...dto,
        propertyId: propertyId,
      },
      include: {
        property: true,
      },
    });
  }

  async findAll(propertyId: string, userId: string, userRole: Role) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (userRole !== Role.ADMIN && property.ownerId !== userId) {
      throw new ForbiddenException('Access Denied');
    }

    return this.prisma.unit.findMany({
      where: { propertyId },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (userRole !== Role.ADMIN && unit.property.ownerId !== userId) {
      throw new ForbiddenException('Access Denied');
    }

    return unit;
  }

  async update(id: string, dto: UpdateUnitDto, userId: string, userRole: Role) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (userRole !== Role.ADMIN && unit.property.ownerId !== userId) {
      throw new ForbiddenException('Access Denied');
    }

    return this.prisma.unit.update({
      where: { id },
      data: dto,
      include: {
        property: true,
      },
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (userRole !== Role.ADMIN && unit.property.ownerId !== userId) {
      throw new ForbiddenException('Access Denied');
    }

    return this.prisma.unit.delete({
      where: { id },
    });
  }
}
