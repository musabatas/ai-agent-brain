/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// ── Roles ──
const ROLES = [
  {
    slug: 'owner',
    name: 'Owner',
    description: 'System owner with full access.',
    isProtected: true,
    isDefault: false,
  },
  {
    slug: 'admin',
    name: 'Administrator',
    description: 'Administrator with full access to manage the system.',
    isProtected: true,
    isDefault: false,
  },
  {
    slug: 'member',
    name: 'Member',
    description: 'Default member role with standard access.',
    isProtected: true,
    isDefault: true,
  },
];

// ── Permissions ──
const PERMISSIONS = [
  {
    slug: 'dashboard.view',
    name: 'View Dashboard',
    description: 'Access and view the dashboard.',
  },
  {
    slug: 'user.view',
    name: 'View Users',
    description: 'View the list of users.',
  },
  {
    slug: 'user.add',
    name: 'Add User',
    description: 'Add new users.',
  },
  {
    slug: 'user.edit',
    name: 'Edit User',
    description: 'Edit user details.',
  },
  {
    slug: 'user.delete',
    name: 'Delete User',
    description: 'Delete users from the system.',
  },
  {
    slug: 'role.view',
    name: 'View Roles',
    description: 'View roles in the system.',
  },
  {
    slug: 'role.add',
    name: 'Add Role',
    description: 'Create new roles.',
  },
  {
    slug: 'role.edit',
    name: 'Edit Role',
    description: 'Edit existing roles.',
  },
  {
    slug: 'role.delete',
    name: 'Delete Role',
    description: 'Remove roles from the system.',
  },
  {
    slug: 'permission.view',
    name: 'View Permissions',
    description: 'View all available permissions.',
  },
  {
    slug: 'permission.edit',
    name: 'Edit Permissions',
    description: 'Edit existing permissions.',
  },
  {
    slug: 'settings.manage',
    name: 'Manage Settings',
    description: 'View and edit system settings.',
  },
  {
    slug: 'org.manage',
    name: 'Manage Organization',
    description: 'Manage organization settings, members, and API keys.',
  },
  {
    slug: 'project.manage',
    name: 'Manage Projects',
    description: 'Create, edit, and delete projects and their entities.',
  },
];

async function main() {
  console.log('Running database seed...\n');

  // ── Admin credentials ──
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aidevbrain.com';
  const adminPassword =
    process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('base64url');
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.$transaction(
    async (tx) => {
      // ── Roles ──
      let ownerRole;
      for (const role of ROLES) {
        const upserted = await tx.userRole.upsert({
          where: { slug: role.slug },
          update: {},
          create: {
            slug: role.slug,
            name: role.name,
            description: role.description,
            isProtected: role.isProtected,
            isDefault: role.isDefault,
          },
        });
        if (role.slug === 'owner') ownerRole = upserted;
      }
      console.log('  Roles seeded.');

      // ── Admin user ──
      const adminUser = await tx.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
          email: adminEmail,
          name: 'Admin',
          password: hashedPassword,
          roleId: ownerRole.id,
          emailVerifiedAt: new Date(),
          status: 'ACTIVE',
          isProtected: true,
        },
      });
      console.log('  Admin user seeded.');

      // ── Permissions ──
      for (const perm of PERMISSIONS) {
        await tx.userPermission.upsert({
          where: { slug: perm.slug },
          update: {},
          create: {
            slug: perm.slug,
            name: perm.name,
            description: perm.description,
            createdByUserId: adminUser.id,
          },
        });
      }
      console.log('  Permissions seeded.');

      // ── Assign all permissions to owner & admin roles ──
      const allPermissions = await tx.userPermission.findMany();
      const privilegedRoles = await tx.userRole.findMany({
        where: { slug: { in: ['owner', 'admin'] } },
      });

      for (const role of privilegedRoles) {
        for (const perm of allPermissions) {
          await tx.userRolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: perm.id,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: perm.id,
            },
          });
        }
      }
      console.log('  Role permissions assigned.');

      // ── System settings ──
      const settingsCount = await tx.systemSetting.count();
      if (settingsCount === 0) {
        await tx.systemSetting.create({
          data: { name: 'AI Dev Brain' },
        });
      }
      console.log('  System settings seeded.');
    },
    { timeout: 120000, maxWait: 120000 },
  );

  // ── Print credentials ──
  console.log('\n========================================');
  console.log('  ADMIN CREDENTIALS');
  console.log('========================================');
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log('========================================');
  console.log('  Save these credentials securely.');
  console.log('  Set ADMIN_EMAIL and ADMIN_PASSWORD env');
  console.log('  vars to use custom values.\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
