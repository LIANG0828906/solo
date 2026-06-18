import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { CreateRecordModal } from '@/components/CreateRecordModal';
import { prisma, DEFAULT_USER_ID } from '@/lib/prisma';
import { getDefaultUser } from '@/lib/prisma';

export const metadata: Metadata = {
  title: '咖啡味觉档案馆 | Coffee Taste Archive',
  description: '记录你的每一次咖啡品尝体验，生成专属风味雷达图，发现更多合你口味的咖啡',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#1A1A2E',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">☕</text></svg>',
  },
};

export const revalidate = 60;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getDefaultUser();
  const records = await prisma.record.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: { flavorTags: true },
    orderBy: { createdAt: 'desc' },
  });

  const serializedRecords = records.map((r) => ({
    rating: r.rating,
    flavorTags: r.flavorTags,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-coffee-bg text-coffee-text antialiased selection:bg-yellow-400/30 selection:text-white">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, #FFD700 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, #FF6347 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[450px] h-[450px] rounded-full opacity-10 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, #7E57C2 0%, transparent 70%)',
            }}
          />
        </div>

        <Navbar />
        <Sidebar user={user} records={serializedRecords} />

        <main className="relative pt-16 md:pl-[300px] pb-24 md:pb-10 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
            <div className="page-transition">{children}</div>
          </div>
        </main>

        <CreateRecordModal />
      </body>
    </html>
  );
}
