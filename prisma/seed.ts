import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed roles first (no dependencies)
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' },
  });

  // Seed users (depends on roles)
  const adminUser = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL! },
    update: {
      firstName: process.env.ADMIN_FIRST_NAME!,
      lastName: process.env.ADMIN_LAST_NAME!,
      password: await argon2.hash(process.env.ADMIN_PASSWORD!, {
        secret: Buffer.from(process.env.ARGON2_SECRET!),
      }),
    },
    create: {
      email: process.env.ADMIN_EMAIL!,
      firstName: process.env.ADMIN_FIRST_NAME!,
      lastName: process.env.ADMIN_LAST_NAME!,
      password: await argon2.hash(process.env.ADMIN_PASSWORD!, {
        secret: Buffer.from(process.env.ARGON2_SECRET!),
      }),
      roleId: adminRole.id,
    },
    omit: {
      password: true,
    },
    include: {
      role: true,
    },
  });

  console.log({ adminRole, userRole, adminUser });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
