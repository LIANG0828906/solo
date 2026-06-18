import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import type { Letter } from '@/types';

const FAVORITES_KEY = 'shijian_favorites';

function getFavoritesFromCookie(req: NextApiRequest): number[] {
  const cookie = req.cookies[FAVORITES_KEY];
  if (!cookie) return [];
  try {
    return JSON.parse(decodeURIComponent(cookie));
  } catch {
    return [];
  }
}

function getTagFrequency(tagStr: string): Record<string, number> {
  const freq: Record<string, number> = {};
  tagStr.split(',').filter(Boolean).forEach((tag) => {
    freq[tag.trim()] = (freq[tag.trim()] || 0) + 1;
  });
  return freq;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ letters: Letter[] } | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const favoritedIds = getFavoritesFromCookie(req);

    if (favoritedIds.length === 0) {
      const hotLetters = await prisma.letter.findMany({
        where: { isPublic: true },
        take: 5,
        orderBy: [{ favoritesCount: 'desc' }, { createdAt: 'desc' }],
      });
      return res.status(200).json({
        letters: hotLetters.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        })),
      });
    }

    const favoritedLetters = await prisma.letter.findMany({
      where: { id: { in: favoritedIds } },
    });

    const tagFreq: Record<string, number> = {};
    favoritedLetters.forEach((letter) => {
      const freq = getTagFrequency(letter.tags);
      Object.entries(freq).forEach(([tag, count]) => {
        tagFreq[tag] = (tagFreq[tag] || 0) + count;
      });
    });

    const sortedTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    const allLetters = await prisma.letter.findMany({
      where: {
        isPublic: true,
        id: { notIn: favoritedIds },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const scored = allLetters.map((letter) => {
      const letterTags = letter.tags.split(',').filter(Boolean).map((t) => t.trim());
      let score = 0;
      letterTags.forEach((tag) => {
        const rank = sortedTags.indexOf(tag);
        if (rank !== -1) {
          score += sortedTags.length - rank;
        }
      });
      return { letter, score };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.letter.favoritesCount - a.letter.favoritesCount;
    });

    const recommended = scored.slice(0, 5).map((s) => s.letter);

    if (recommended.length < 5) {
      const existingIds = recommended.map((l) => l.id);
      const extra = await prisma.letter.findMany({
        where: {
          isPublic: true,
          id: { notIn: [...favoritedIds, ...existingIds] },
        },
        take: 5 - recommended.length,
        orderBy: [{ favoritesCount: 'desc' }, { createdAt: 'desc' }],
      });
      recommended.push(...extra);
    }

    return res.status(200).json({
      letters: recommended.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}
