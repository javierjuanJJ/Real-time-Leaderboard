// backend/prisma/seed.ts
// Database seeding script

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample games
  const games = await Promise.all([
    prisma.game.upsert({
      where: { name: 'Space Invaders' },
      update: {},
      create: {
        name: 'Space Invaders',
        description: 'Classic arcade shooter game'
      }
    }),
    prisma.game.upsert({
      where: { name: 'Snake' },
      update: {},
      create: {
        name: 'Snake',
        description: 'Classic snake game'
      }
    }),
    prisma.game.upsert({
      where: { name: 'Tetris' },
      update: {},
      create: {
        name: 'Tetris',
        description: 'Classic puzzle game'
      }
    }),
    prisma.game.upsert({
      where: { name: 'Pac-Man' },
      update: {},
      create: {
        name: 'Pac-Man',
        description: 'Classic maze chase game'
      }
    })
  ]);

  console.log(`✓ Created ${games.length} games`);

  // Create test user (for development)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true
    }
  });

  console.log(`✓ Created test user: ${testUser.email}`);

  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });