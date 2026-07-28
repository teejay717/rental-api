import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'generated/prisma/enums';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePropertyDto, ownerId: string) {
    return this.prisma.property.create({
      data: {
        ...dto,
        ownerId: ownerId,
      },
      include: {
        units: true,
      },
    });
  }

  async findAll(userId: string, userRole: Role) {
    const where = userRole === Role.ADMIN ? {} : { ownerId: userId };
    return this.prisma.property.findMany({
      where: where,
      include: { units: true },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { units: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (userRole !== Role.ADMIN && property.ownerId !== userId) {
      throw new ForbiddenException('Access Denied');
    }
    return property;
  }

  async update(
    id: string,
    dto: UpdatePropertyDto,
    userId: string,
    userRole: Role,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (userRole !== Role.ADMIN && property.ownerId !== userId) {
      throw new ForbiddenException('Access Denied');
    }

    return this.prisma.property.update({
      where: { id },
      data: dto,
      include: { units: true },
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (userRole !== Role.ADMIN && property.ownerId !== userId) {
      throw new ForbiddenException('Access Denied');
    }
    return this.prisma.property.delete({
      where: { id },
    });
  }
}
