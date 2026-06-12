import { Request, Response, NextFunction } from 'express';

export const validateCreateCard = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { content, author, authorColor, teamName } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: '内容不能为空' });
  }

  if (content.length > 200) {
    return res.status(400).json({ error: '内容不能超过200字' });
  }

  if (!author || typeof author !== 'string') {
    return res.status(400).json({ error: '作者不能为空' });
  }

  if (!authorColor || typeof authorColor !== 'string') {
    return res.status(400).json({ error: '作者颜色不能为空' });
  }

  if (!teamName || typeof teamName !== 'string') {
    return res.status(400).json({ error: '团队名称不能为空' });
  }

  next();
};

export const validateUpdatePosition = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { x, y } = req.body;

  if (typeof x !== 'number' || typeof y !== 'number') {
    return res.status(400).json({ error: '位置坐标无效' });
  }

  next();
};

export const validateVote = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { cardId, userId, teamName } = req.body;

  if (!cardId || typeof cardId !== 'string') {
    return res.status(400).json({ error: '卡片ID无效' });
  }

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: '用户ID无效' });
  }

  if (!teamName || typeof teamName !== 'string') {
    return res.status(400).json({ error: '团队名称不能为空' });
  }

  next();
};

export const validateTeamName = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const teamName = req.params.teamName || req.body.teamName;

  if (!teamName || typeof teamName !== 'string') {
    return res.status(400).json({ error: '团队名称不能为空' });
  }

  next();
};
