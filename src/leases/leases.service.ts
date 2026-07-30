import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, LeaseStatus, UnitStatus } from 'generated/prisma/enums';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';

@Injectable()
export class LeasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLeaseDto, userId: string, userRole: Role) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
      include: { property: true },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (userRole !== Role.ADMIN && unit.property.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const tenant = await this.prisma.user.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.role !== Role.TENANT) {
      throw new BadRequestException('User is not a tenant');
    }

    const existingLease = await this.prisma.lease.findFirst({
      where: {
        unitId: dto.unitId,
        status: LeaseStatus.ACTIVE,
      },
    });

    if (existingLease) {
      throw new ConflictException('Unit already has an active lease');
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    const lease = await this.prisma.$transaction(async (tx) => {
      const newLease = await tx.lease.create({
        data: {
          unitId: dto.unitId,
          tenantId: dto.tenantId,
          startDate: start,
          endDate: end,
          monthlyRent: dto.monthlyRent,
          deposit: dto.deposit,
          status: LeaseStatus.ACTIVE,
        },
        include: {
          unit: true,
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      await tx.unit.update({
        where: { id: dto.unitId },
        data: { status: UnitStatus.OCCUPIED },
      });

      return newLease;
    });
    return lease;
  }

  async findAll(userId: string, userRole: Role) {
    if (userRole === Role.ADMIN) {
      return this.prisma.lease.findMany({
        include: {
          unit: { include: { property: true } },
          tenant: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
    }

    if (userRole === Role.OWNER) {
      return this.prisma.lease.findMany({
        where: {
          unit: {
            property: {
              ownerId: userId,
            },
          },
        },
        include: {
          unit: { include: { property: true } },
          tenant: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
    }

    if (userRole === Role.TENANT) {
      return this.prisma.lease.findMany({
        where: {
          tenantId: userId,
        },
        include: {
          unit: { include: { property: true } },
          tenant: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
    }
    return [];
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        unit: { include: { property: true } },
        tenant: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!lease) {
      throw new NotFoundException('Lease not found');
    }

    if (userRole === Role.ADMIN) {
      return lease;
    }

    if (userRole === Role.OWNER && lease.unit.property.ownerId === userId) {
      return lease;
    }

    if (userRole === Role.TENANT && lease.tenantId === userId) {
      return lease;
    }

    throw new ForbiddenException('Access denied');
  }

  async update(
    id: string,
    dto: UpdateLeaseDto,
    userId: string,
    userRole: Role,
  ) {
    if (userRole === Role.TENANT) {
      throw new ForbiddenException('Tenants cannot update leases');
    }

    const lease = await this.findOne(id, userId, userRole);

    return this.prisma.lease.update({
      where: { id },
      data: dto,
      include: {
        unit: { include: { property: true } },
        tenant: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    if (userRole === Role.TENANT) {
      throw new ForbiddenException('Tenants cannot delete leases');
    }

    const lease = await this.findOne(id, userId, userRole);

    return this.prisma.lease.delete({
      where: { id },
    });
  }
}
