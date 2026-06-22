import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import type { FavoriteResponse } from '@/types';

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

function setFavoritesCookie(res: NextApiResponse, ids: number[]) {
  res.setHeader(
    'Set-Cookie',
    `${FAVORITES_KEY}=${encodeURIComponent(JSON.stringify(ids))}; Path=/; Max-Age=${60 * 60 * 24 * 365}; HttpOnly; SameSite=Lax`
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FavoriteResponse | { error: string }>
) {
  if (req.method === 'POST') {
    try {
      const { letterId } = req.body;
      if (!letterId) {
        return res.status(400).json({ error: 'letterId is required' });
      }

      const letter = await prisma.letter.findUnique({ where: { id: Number(letterId) } });
      if (!letter) {
        return res.status(404).json({ error: 'Letter not found' });
      }

      const favoritedIds = getFavoritesFromCookie(req);
      const isFavorited = favoritedIds.includes(Number(letterId));

      let newCount = letter.favoritesCount;
      let newFavoritedIds: number[];

      if (isFavorited) {
        newFavoritedIds = favoritedIds.filter((id) => id !== Number(letterId));
        newCount = Math.max(0, letter.favoritesCount - 1);
        await prisma.letter.update({
          where: { id: Number(letterId) },
          data: { favoritesCount: newCount },
        });
      } else {
        newFavoritedIds = [...favoritedIds, Number(letterId)];
        newCount = letter.favoritesCount + 1;
        await prisma.letter.update({
          where: { id: Number(letterId) },
          data: { favoritesCount: newCount },
        });
      }

      setFavoritesCookie(res, newFavoritedIds);

      return res.status(200).json({
        favorited: !isFavorited,
        favoritesCount: newCount,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to toggle favorite' });
    }
  }

  if (req.method === 'GET') {
    const favoritedIds = getFavoritesFromCookie(req);
    return res.status(200).json({ ids: favoritedIds } as any);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
