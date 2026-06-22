import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import type { Letter, LettersResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LettersResponse | Letter | { error: string }>
) {
  if (req.method === 'GET') {
    const cursor = req.query.cursor ? parseInt(req.query.cursor as string, 10) : undefined;
    const tag = req.query.tag as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    try {
      const where = tag
        ? {
            isPublic: true,
            tags: { contains: tag },
          }
        : { isPublic: true };

      const take = limit + 1;
      const letters = await prisma.letter.findMany({
        where,
        take,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
      });

      const hasMore = letters.length > limit;
      const resultLetters = hasMore ? letters.slice(0, -1) : letters;
      const nextCursor = hasMore ? resultLetters[resultLetters.length - 1].id : null;

      return res.status(200).json({
        letters: resultLetters.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        })),
        nextCursor,
        hasMore,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch letters' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, content, font = '楷体', isPublic = true, tags = '' } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: '标题和内容不能为空' });
      }
      if (title.length > 30) {
        return res.status(400).json({ error: '标题不能超过30字' });
      }
      if (content.length > 500) {
        return res.status(400).json({ error: '内容不能超过500字' });
      }

      const letter = await prisma.letter.create({
        data: {
          title,
          content,
          font,
          isPublic: Boolean(isPublic),
          tags,
        },
      });

      return res.status(201).json({
        ...letter,
        createdAt: letter.createdAt.toISOString(),
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create letter' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
