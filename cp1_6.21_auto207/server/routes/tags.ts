import { Router, Request, Response } from 'express';
import { snippets } from './snippets';

const router = Router();

export let tags: string[] = [];

const capitalizeFirst = (s: string): string => {
  const trimmed = s.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const collectAllTags = (): string[] => {
  const set = new Set<string>(tags);
  snippets.forEach((s) => s.tags.forEach((t) => set.add(t)));
  return Array.from(set)
    .map(capitalizeFirst)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
};

router.get('/', (_req: Request, res: Response) => {
  try {
    const result = collectAllTags();
    res.json(result);
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req: Request<{}, {}, { name: string }>, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: '标签名称不能为空' });
      return;
    }

    const formatted = capitalizeFirst(name);
    if (!formatted) {
      res.status(400).json({ error: '标签名称无效' });
      return;
    }

    const allTags = collectAllTags();
    if (!allTags.includes(formatted)) {
      tags.push(formatted);
    }

    res.status(201).json({ name: formatted });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

export default router;
