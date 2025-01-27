import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dtos/role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role already exists');
    }

    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        permissions: {
          create:
            createRoleDto.permissions?.map((permissionId) => ({
              permissionId,
            })) || [],
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    if (updateRoleDto.permissions) {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
        permissions: updateRoleDto.permissions
          ? {
              create: updateRoleDto.permissions.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.prisma.role.delete({
      where: { id },
      include: {
        permissions: true,
      },
    });
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException(`Permission ${permissionId} not found`);
    }

    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
      include: {
        role: true,
        permission: true,
      },
    });
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    const rolePermission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId,
        permissionId,
      },
    });

    if (!rolePermission) {
      throw new NotFoundException('Permission not assigned to this role');
    }

    return this.prisma.rolePermission.delete({
      where: {
        id: rolePermission.id,
      },
    });
  }

  async assignRoleToUser(roleId: string, userId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return this.prisma.profiles.update({
      where: { userId },
      data: { roleId },
      include: {
        role: true,
      },
    });
  }

  async removeRoleFromUser(userId: string) {
    const defaultRole = await this.prisma.role.findFirst({
      where: { name: 'USER' },
    });

    if (!defaultRole) {
      throw new NotFoundException('Default role not found');
    }

    return this.prisma.profiles.update({
      where: { userId },
      data: { roleId: defaultRole.id },
      include: {
        role: true,
      },
    });
  }
}
