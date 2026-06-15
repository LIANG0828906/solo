import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthRequest, authMiddleware } from './auth.js';
import { Invitation, Work, User } from '../../types.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    await db.read();
    const invitations = db.data!.invitations.filter(
      (inv: Invitation) => inv.inviteeId === userId && inv.status === 'pending'
    );

    res.json(invitations);
  } catch (error) {
    console.error('获取邀请列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/accept', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    await db.read();
    const invitationIndex = db.data!.invitations.findIndex(
      (inv: Invitation) => inv.id === id
    );

    if (invitationIndex === -1) {
      return res.status(404).json({ error: '邀请不存在' });
    }

    const invitation = db.data!.invitations[invitationIndex];

    if (invitation.inviteeId !== userId) {
      return res.status(403).json({ error: '无权处理此邀请' });
    }

    invitation.status = 'accepted';

    const workIndex = db.data!.works.findIndex((w: Work) => w.id === invitation.workId);
    if (workIndex !== -1) {
      db.data!.works[workIndex].collaborators.push({
        userId: userId,
        role: invitation.role,
      });
    }

    await db.write();
    res.json({ message: '已接受邀请', invitation });
  } catch (error) {
    console.error('接受邀请错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    await db.read();
    const invitationIndex = db.data!.invitations.findIndex(
      (inv: Invitation) => inv.id === id
    );

    if (invitationIndex === -1) {
      return res.status(404).json({ error: '邀请不存在' });
    }

    const invitation = db.data!.invitations[invitationIndex];

    if (invitation.inviteeId !== userId) {
      return res.status(403).json({ error: '无权处理此邀请' });
    }

    invitation.status = 'rejected';
    await db.write();

    res.json({ message: '已拒绝邀请', invitation });
  } catch (error) {
    console.error('拒绝邀请错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
