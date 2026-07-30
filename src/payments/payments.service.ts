import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prismaService: PrismaService) {}

  private async getLeaseAndCheckAccess(
    leaseId: string,
    userId: string,
    userRole: Role,
  ) {
    const lease = await this.prismaService.lease.findUnique({
      where: { id: leaseId },
      include: {
        unit: { include: { property: true } },
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

    throw new ForbiddenException('Access Denied');
  }

  async create(dto: CreatePaymentDto, userId: string, userRole: Role) {
    await this.getLeaseAndCheckAccess(dto.leaseId, userId, userRole);

    return this.prismaService.payment.create({
      data: {
        leaseId: dto.leaseId,
        amount: dto.amount,
        coveringMonth: new Date(dto.coveringMonth),
        notes: dto.notes,
      },
      include: {
        lease: true,
      },
    });
  }

  async findAll(userId: string, userRole: Role) {
    if (userRole === Role.ADMIN) {
      return this.prismaService.payment.findMany({
        include: { lease: true },
      });
    }

    if (userRole === Role.OWNER) {
      return this.prismaService.payment.findMany({
        where: {
          lease: {
            unit: {
              property: {
                ownerId: userId,
              },
            },
          },
        },
        include: {
          lease: true,
        },
      });
    }

    if (userRole === Role.TENANT) {
      return this.prismaService.payment.findMany({
        where: {
          lease: {
            tenantId: userId,
          },
        },
        include: {
          lease: true,
        },
      });
    }
    return [];
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const payment = await this.prismaService.payment.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (userRole === Role.ADMIN) {
      return payment;
    }

    if (
      userRole === Role.OWNER &&
      payment.lease.unit.property.ownerId === userId
    ) {
      return payment;
    }

    if (userRole === Role.TENANT && payment.lease.tenantId === userId) {
      return payment;
    }

    throw new ForbiddenException('Access Denied');
  }

  async update(
    id: string,
    dto: UpdatePaymentDto,
    userId: string,
    userRole: Role,
  ) {
    if (userRole === Role.TENANT) {
      throw new ForbiddenException('Tenants cannot update payments');
    }

    await this.findOne(id, userId, userRole);

    return this.prismaService.payment.update({
      where: { id },
      data: dto,
      include: {
        lease: true,
      },
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    if (userRole === Role.TENANT) {
      throw new ForbiddenException('Tenants cannot delete payments');
    }

    await this.findOne(id, userId, userRole);

    return this.prismaService.payment.delete({
      where: { id },
    });
  }
}
