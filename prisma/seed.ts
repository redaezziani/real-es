import { PrismaClient, HttpMethod } from '@prisma/client';
import { baseRoles, basePermissions, rolePermissions } from './seed/roles';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Seed roles
  console.log('📝 Seeding roles...');
  for (const roleData of baseRoles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`✅ Role ${roleData.name} created/updated`);
  }

  // Seed permissions
  console.log('🔑 Seeding permissions...');
  for (const permissionData of basePermissions) {
    await prisma.permission.upsert({
      where: {
        resource_method_path: {
          resource: permissionData.resource,
          method: permissionData.method,
          path: permissionData.path,
        },
      },
      update: {},
      create: permissionData,
    });
    console.log(
      `✅ Permission ${permissionData.resource}.${permissionData.method} created/updated`,
    );
  }

  // Seed role-permission relationships
  console.log('🔗 Seeding role-permission relationships...');
  for (const [roleName, permissions] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      console.log(`❌ Role ${roleName} not found`);
      continue;
    }

    // Clear existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    if (permissions.includes('*')) {
      // Grant all permissions for SUPER_ADMIN
      const allPermissions = await prisma.permission.findMany();
      for (const permission of allPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
      console.log(`✅ All permissions granted to ${roleName}`);
    } else {
      // Grant specific permissions
      for (const permissionKey of permissions) {
        const [resource, method] = permissionKey.split('.');
        const permission = await prisma.permission.findFirst({
          where: {
            resource,
            method: method as HttpMethod,
          },
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }
      console.log(`✅ Permissions granted to ${roleName}`);
    }
  }

  // Seed users
  console.log('👤 Seeding users...');

  // Hash passwords
  const saltRounds = 10;
  const hashedAdminPassword = await bcrypt.hash('admin123', saltRounds);
  const hashedUserPassword = await bcrypt.hash('user123', saltRounds);

  // Get roles
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });
  const userRole = await prisma.role.findUnique({
    where: { name: 'USER' },
  });

  if (!adminRole || !userRole) {
    throw new Error('Required roles not found');
  }

  // Create admin user
  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@manga-desire.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@manga-desire.com',
      password: hashedAdminPassword,
      emailVerified: true,
    },
  });

  // Create admin profile
  await prisma.profiles.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
      bio: 'System administrator with full access to manage the manga platform.',
      badge: 'VERIFIED',
    },
  });

  console.log('✅ Admin user created: admin@manga-desire.com / admin123');

  // Create regular user
  const regularUser = await prisma.users.upsert({
    where: { email: 'user@manga-desire.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'user@manga-desire.com',
      password: hashedUserPassword,
      emailVerified: true,
    },
  });

  // Create user profile
  await prisma.profiles.upsert({
    where: { userId: regularUser.id },
    update: {},
    create: {
      userId: regularUser.id,
      roleId: userRole.id,
      bio: 'A regular user who loves reading manga.',
      badge: 'VERIFIED',
    },
  });

  console.log('✅ Regular user created: user@manga-desire.com / user123');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
