import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dtos/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSubscriptionDto) {
    return this.prisma.emailSubscription.create({
      data: {
        email: createDto.email,
        topics: createDto.topics || [],
      },
    });
  }

  async findAll(active?: boolean) {
    return this.prisma.emailSubscription.findMany({
      where: active !== undefined ? { isActive: active } : undefined,
    });
  }

  async findOne(id: string) {
    const subscription = await this.prisma.emailSubscription.findUnique({
      where: { id },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return subscription;
  }

  async findByEmail(email: string) {
    return this.prisma.emailSubscription.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: Partial<CreateSubscriptionDto>) {
    const subscription = await this.findOne(id);
    return this.prisma.emailSubscription.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateLastSentAt(id: string) {
    return this.prisma.emailSubscription.update({
      where: { id },
      data: { lastSentAt: new Date() },
    });
  }

  async toggleActive(id: string) {
    const subscription = await this.findOne(id);
    return this.prisma.emailSubscription.update({
      where: { id },
      data: { isActive: !subscription.isActive },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.emailSubscription.delete({
      where: { id },
    });
  }
}
