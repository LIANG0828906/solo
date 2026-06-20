import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const DEFAULT_USER_ID = 'default-user';

export async function getDefaultUser() {
  const user = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });
  if (user) return user;
  return prisma.user.create({
    data: {
      id: DEFAULT_USER_ID,
      name: '咖啡品鉴师',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coffee',
    },
  });
}
