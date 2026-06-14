import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { AuthRequest, authMiddleware } from './auth.js';
import { Work, OutlineNode, Version, CollaboratorRole, User } from '../../types.js';

const router = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, type } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: '请填写作品标题和类型' });
    }

    const newWork: Work = {
      id: uuidv4(),
      title,
      type,
      content: '',
      outline: [],
      authorId: req.userId!,
      collaborators: [],
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.read();
    db.data!.works.push(newWork);
    await db.write();

    res.status(201).json(newWork);
  } catch (error) {
    console.error('创建作品错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await db.read();
    const userId = req.userId!;

    const myWorks = db.data!.works.filter(
      (w: Work) => w.authorId === userId
    );

    const collaboratedWorks = db.data!.works.filter(
      (w: Work) => w.collaborators.some((c) => c.userId === userId)
    );

    res.json({
      myWorks,
      collaboratedWorks,
    });
  } catch (error) {
    console.error('获取作品列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    await db.read();
    const work = db.data!.works.find((w: Work) => w.id === id);

    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }

    if (work.authorId !== userId && !work.collaborators.some((c) => c.userId === userId)) {
      return res.status(403).json({ error: '无权访问此作品' });
    }

    const collaboratorsWithInfo = work.collaborators.map((c) => {
      const user = db.data!.users.find((u: User) => u.id === c.userId);
      return {
        ...c,
        email: user?.email,
        name: user?.name,
      };
    });

    res.json({
      ...work,
      collaborators: collaboratorsWithInfo,
    });
  } catch (error) {
    console.error('获取作品详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { title, content, outline } = req.body;

    await db.read();
    const workIndex = db.data!.works.findIndex((w: Work) => w.id === id);

    if (workIndex === -1) {
      return res.status(404).json({ error: '作品不存在' });
    }

    const work = db.data!.works[workIndex];

    if (work.authorId !== userId && !work.collaborators.some((c) => c.userId === userId && c.role === 'editor')) {
      return res.status(403).json({ error: '无权修改此作品' });
    }

    if (title !== undefined) work.title = title;
    if (content !== undefined) work.content = content;
    if (outline !== undefined) work.outline = outline;
    work.updatedAt = new Date().toISOString();

    const newVersion: Version = {
      id: uuidv4(),
      version: work.versions.length + 1,
      content: work.content,
      outline: work.outline,
      createdAt: new Date().toISOString(),
    };
    work.versions.push(newVersion);

    await db.write();
    res.json(work);
  } catch (error) {
    console.error('更新作品错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    await db.read();
    const workIndex = db.data!.works.findIndex((w: Work) => w.id === id);

    if (workIndex === -1) {
      return res.status(404).json({ error: '作品不存在' });
    }

    if (db.data!.works[workIndex].authorId !== userId) {
      return res.status(403).json({ error: '无权删除此作品' });
    }

    db.data!.works.splice(workIndex, 1);
    await db.write();

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除作品错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/collaborators', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: '请提供邮箱和角色' });
    }

    if (role !== 'editor' && role !== 'commenter') {
      return res.status(400).json({ error: '角色无效' });
    }

    await db.read();
    const work = db.data!.works.find((w: Work) => w.id === id);

    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }

    if (work.authorId !== userId) {
      return res.status(403).json({ error: '只有作者可以邀请协作者' });
    }

    const invitee = db.data!.users.find((u: User) => u.email === email);
    if (!invitee) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (invitee.id === userId) {
      return res.status(400).json({ error: '不能邀请自己' });
    }

    if (work.collaborators.some((c) => c.userId === invitee.id)) {
      return res.status(400).json({ error: '该用户已是协作者' });
    }

    const inviter = db.data!.users.find((u: User) => u.id === userId);

    const invitation = {
      id: uuidv4(),
      workId: id,
      workTitle: work.title,
      inviterId: userId,
      inviterName: inviter?.name || '',
      inviteeId: invitee.id,
      role: role as CollaboratorRole,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    db.data!.invitations.push(invitation);
    await db.write();

    res.status(201).json(invitation);
  } catch (error) {
    console.error('邀请协作者错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id/versions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    await db.read();
    const work = db.data!.works.find((w: Work) => w.id === id);

    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }

    if (work.authorId !== userId && !work.collaborators.some((c) => c.userId === userId)) {
      return res.status(403).json({ error: '无权访问此作品' });
    }

    const versions = work.versions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((v) => ({
        id: v.id,
        version: v.version,
        createdAt: v.createdAt,
      }));

    res.json(versions);
  } catch (error) {
    console.error('获取版本列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id/versions/:versionId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.userId!;

    await db.read();
    const work = db.data!.works.find((w: Work) => w.id === id);

    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }

    if (work.authorId !== userId && !work.collaborators.some((c) => c.userId === userId)) {
      return res.status(403).json({ error: '无权访问此作品' });
    }

    const version = work.versions.find((v: Version) => v.id === versionId);
    if (!version) {
      return res.status(404).json({ error: '版本不存在' });
    }

    res.json(version);
  } catch (error) {
    console.error('获取版本详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
