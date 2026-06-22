import { Router, Request, Response } from 'express';
import {
  createCapsule,
  getCapsule,
  getAllCapsules,
  updateCapsuleStatus,
  getOpenedUnreadCapsules,
} from '../data/capsuleData.js';
import { CreateCapsuleInput, EmotionType } from '../../shared/types.js';

const router = Router();

const validEmotions: EmotionType[] = ['joy', 'sadness', 'nostalgia', 'anticipation', 'calm'];

router.get('/capsules', (_req: Request, res: Response) => {
  try {
    const capsules = getAllCapsules();
    res.json({ success: true, data: capsules });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get capsules' });
  }
});

router.get('/capsules/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const capsule = getCapsule(id);
    if (!capsule) {
      res.status(404).json({ success: false, error: 'Capsule not found' });
      return;
    }
    res.json({ success: true, data: capsule });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get capsule' });
  }
});

router.post('/capsules', (req: Request, res: Response) => {
  try {
    const { text, imageBase64, emotion, openAt } = req.body as CreateCapsuleInput;

    if (!text || text.length > 500) {
      res.status(400).json({ success: false, error: 'Text must be between 1 and 500 characters' });
      return;
    }

    if (!validEmotions.includes(emotion)) {
      res.status(400).json({ success: false, error: 'Invalid emotion type' });
      return;
    }

    const openTime = typeof openAt === 'number' ? openAt : parseInt(openAt as string);
    if (isNaN(openTime) || openTime <= Date.now()) {
      res.status(400).json({ success: false, error: 'Open time must be in the future' });
      return;
    }

    const capsule = createCapsule({
      text,
      imageBase64: imageBase64 || null,
      emotion,
      openAt: openTime,
    });

    res.status(201).json({ success: true, data: capsule });
  } catch (error) {
    console.error('Create capsule error:', error);
    res.status(500).json({ success: false, error: 'Failed to create capsule' });
  }
});

router.patch('/capsules/:id/read', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const capsule = getCapsule(id);
    if (!capsule) {
      res.status(404).json({ success: false, error: 'Capsule not found' });
      return;
    }
    if (capsule.status === 'pending') {
      res.status(400).json({ success: false, error: 'Cannot mark pending capsule as read' });
      return;
    }
    const updated = updateCapsuleStatus(id, 'read');
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to mark capsule as read' });
  }
});

router.get('/poll/updates', (_req: Request, res: Response) => {
  try {
    const openedUnread = getOpenedUnreadCapsules();
    res.json({ success: true, data: openedUnread });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get updates' });
  }
});

export default router;
