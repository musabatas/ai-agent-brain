/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Setting up database...\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aidevbrain.com';
  const adminPassword =
    process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('base64url');
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.$transaction(
    async (tx) => {
      // ── Owner role ──
      const ownerRole = await tx.userRole.upsert({
        where: { slug: 'owner' },
        update: {},
        create: {
          slug: 'owner',
          name: 'Owner',
          description: 'System owner with full access.',
          isProtected: true,
          isDefault: false,
        },
      });

      // ── Member role ──
      await tx.userRole.upsert({
        where: { slug: 'member' },
        update: {},
        create: {
          slug: 'member',
          name: 'Member',
          description: 'Default member role with standard access.',
          isDefault: true,
          isProtected: true,
        },
      });

      // ── Admin user ──
      await tx.user.upsert({
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

      // ── System settings ──
      const settingsCount = await tx.systemSetting.count();
      if (settingsCount === 0) {
        await tx.systemSetting.create({
          data: { name: 'AI Dev Brain' },
        });
      }

      console.log('  Database setup completed!');
    },
    { timeout: 120000, maxWait: 120000 },
  );

  console.log('\n========================================');
  console.log('  ADMIN CREDENTIALS');
  console.log('========================================');
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Setup error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
