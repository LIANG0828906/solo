import { Router, Request, Response } from 'express';
import { store } from '../store';
import type { Chapter, Transition, CropRange } from '../../types';

const router = Router();

interface SaveChaptersBody {
  chapters?: Chapter[];
  transitions?: Transition[];
  cropRange?: CropRange;
}

router.get('/:id/chapters', (req: Request, res: Response) => {
  const project = store.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  res.json({
    chapters: project.chapters,
    transitions: project.transitions,
    cropRange: project.cropRange,
  });
});

router.post('/:id/chapters', (req: Request, res: Response) => {
  const project = store.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  const body = req.body as SaveChaptersBody;
  let updated = project;

  if (body.chapters) {
    const result = store.setChapters(req.params.id, body.chapters);
    if (result) updated = result;
  }
  if (body.transitions) {
    const result = store.updateTransitions(req.params.id, body.transitions);
    if (result) updated = result;
  }
  if (body.cropRange) {
    const result = store.updateCropRange(req.params.id, body.cropRange);
    if (result) updated = result;
  }

  res.json({
    success: true,
    project: updated,
  });
});

export default router;
