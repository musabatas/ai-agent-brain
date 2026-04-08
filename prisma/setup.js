const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('Setting up database...');

  await prisma.$transaction(
    async (tx) => {
      // Ensure the owner role exists
      const ownerRole = await tx.userRole.upsert({
        where: { slug: 'owner' },
        update: {}, // No updates needed, ensures idempotency
        create: {
          slug: 'owner',
          name: 'Owner',
          description: 'The default system role with full access.',
          isProtected: true,
          isDefault: false, // Optional: set to false if it's not the default role
        },
      });

      // Create the owner user
      const ownerPassword = await bcrypt.hash('123456', 10);
      const demoPassword = await bcrypt.hash('demo123', 10);

      const ownerUser = await tx.user.upsert({
        where: { email: 'owner@example.com' },
        update: {}, // No updates needed, ensures idempotency
        create: {
          email: 'owner@example.com',
          name: 'System Owner',
          password: ownerPassword,
          roleId: ownerRole.id,
          avatar: null, // Optional: Add avatar URL if available
          emailVerifiedAt: new Date(), // Optional: Mark email as verified
          status: 'ACTIVE',
        },
      });

      const demoUser = await tx.user.upsert({
        where: { email: 'demo@kt.com' },
        update: {}, // No updates needed, ensures idempotency
        create: {
          isProtected: true,
          email: 'demo@shoplit.com',
          name: 'Demo',
          password: demoPassword,
          roleId: ownerRole.id,
          avatar: null, // Optional: Add avatar URL if available
          emailVerifiedAt: new Date(), // Optional: Mark email as verified
          status: 'ACTIVE',
        },
      });

      // Seed UserRoles
      const defaultRole = await tx.userRole.create({
        data: {
          slug: 'member',
          name: 'Member',
          description: 'Default member role',
          isDefault: true,
          isProtected: true,
          createdAt: new Date(),
        },
      });

      // Settings
      tx.setting.create({
        data: {
          name: 'AI Dev Brain',
        },
      });

      console.log('Database setup completed!');
    },
    {
      timeout: 120000,
      maxWait: 120000,
    },
  );
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
