import type { PortfolioItem, BlogPost, Message, AppStats } from '@/types';

function computeMonthlyPosts(posts: BlogPost[]): { month: string; count: number }[] {
  const map: Record<string, number> = {};
  posts.forEach((p) => {
    const m = p.publishedAt.slice(0, 7);
    map[m] = (map[m] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

function computeMonthlyMessages(msgs: Message[]): { month: string; count: number }[] {
  const map: Record<string, number> = {};
  msgs.forEach((m) => {
    const mo = m.createdAt.slice(0, 7);
    map[mo] = (map[mo] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

function computeTechStackFreq(items: PortfolioItem[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  items.forEach((item) => {
    item.techStack.forEach((t) => {
      map[t] = (map[t] || 0) + 1;
    });
  });
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));
}

export function computeStats(
  posts: BlogPost[],
  msgs: Message[],
  items: PortfolioItem[]
): AppStats {
  return {
    monthlyPosts: computeMonthlyPosts(posts),
    monthlyMessages: computeMonthlyMessages(msgs),
    techStackFreq: computeTechStackFreq(items),
  };
}
