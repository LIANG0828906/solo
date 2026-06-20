import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { formatDistanceToNow } from 'date-fns';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../src/data');

const postsPath = path.resolve(dataDir, 'posts.json');
const membersPath = path.resolve(dataDir, 'members.json');
const progressPath = path.resolve(dataDir, 'progress.json');
const statsPath = path.resolve(dataDir, 'stats.json');

const router = Router();

router.get('/activities/:activityId/posts', async (req: Request, res: Response) => {
  try {
    const posts = JSON.parse(await fs.readFile(postsPath, 'utf-8'));
    let activityPosts = posts.filter((p: any) => p.activityId === req.params.activityId);
    if (req.query.category) {
      activityPosts = activityPosts.filter((p: any) => p.category === req.query.category);
    }
    activityPosts = activityPosts.map((p: any) => ({
      ...p,
      relativeTime: formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })
    }));
    res.json(activityPosts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

router.post('/activities/:activityId/posts', async (req: Request, res: Response) => {
  try {
    const { authorId, category, title, content } = req.body;
    const posts = JSON.parse(await fs.readFile(postsPath, 'utf-8'));
    const newPost = {
      id: uuidv4(),
      activityId: req.params.activityId,
      authorId,
      category,
      title,
      content,
      replies: [],
      createdAt: new Date().toISOString()
    };
    posts.push(newPost);
    await fs.writeFile(postsPath, JSON.stringify(posts, null, 2));
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.get('/posts/:postId', async (req: Request, res: Response) => {
  try {
    const posts = JSON.parse(await fs.readFile(postsPath, 'utf-8'));
    const post = posts.find((p: any) => p.id === req.params.postId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    const result = {
      ...post,
      relativeTime: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
      replies: (post.replies || []).map((r: any) => ({
        ...r,
        relativeTime: formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })
      }))
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get post' });
  }
});

router.post('/posts/:postId/replies', async (req: Request, res: Response) => {
  try {
    const { authorId, content, mentionIds } = req.body;
    const posts = JSON.parse(await fs.readFile(postsPath, 'utf-8'));
    const post = posts.find((p: any) => p.id === req.params.postId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    if (!post.replies) {
      post.replies = [];
    }
    const newReply = {
      id: uuidv4(),
      authorId,
      content,
      mentionIds: mentionIds || [],
      createdAt: new Date().toISOString()
    };
    post.replies.push(newReply);
    await fs.writeFile(postsPath, JSON.stringify(posts, null, 2));
    res.status(201).json(newReply);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

router.get('/activities/:activityId/leaderboard', async (req: Request, res: Response) => {
  try {
    const progress = JSON.parse(await fs.readFile(progressPath, 'utf-8'));
    const posts = JSON.parse(await fs.readFile(postsPath, 'utf-8'));
    const members = JSON.parse(await fs.readFile(membersPath, 'utf-8'));
    const activityProgress = progress.filter((p: any) => p.activityId === req.params.activityId);
    const activityPosts = posts.filter((p: any) => p.activityId === req.params.activityId);
    const memberScores: Record<string, number> = {};
    for (const p of activityProgress) {
      if (!memberScores[p.memberId]) memberScores[p.memberId] = 0;
      memberScores[p.memberId] += (p.completedChapters || 0) * 10;
      memberScores[p.memberId] += (p.notes?.length || 0) * 5;
    }
    for (const p of activityPosts) {
      if (!memberScores[p.authorId]) memberScores[p.authorId] = 0;
      memberScores[p.authorId] += 3;
      const replyCount = (p.replies || []).reduce((acc: number, r: any) => {
        if (!memberScores[r.authorId]) memberScores[r.authorId] = 0;
        return acc;
      }, 0);
      for (const r of p.replies || []) {
        memberScores[r.authorId] += 1;
      }
    }
    const leaderboard = Object.entries(memberScores)
      .map(([memberId, score]) => {
        const member = members.find((m: any) => m.id === memberId);
        return {
          memberId,
          nickname: member?.nickname || 'Unknown',
          avatar: member?.avatar || '',
          score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

router.get('/members', async (_req: Request, res: Response) => {
  try {
    const members = JSON.parse(await fs.readFile(membersPath, 'utf-8'));
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get members' });
  }
});

router.post('/members', async (req: Request, res: Response) => {
  try {
    const { nickname, avatar } = req.body;
    const members = JSON.parse(await fs.readFile(membersPath, 'utf-8'));
    const newMember = {
      id: uuidv4(),
      nickname,
      avatar
    };
    members.push(newMember);
    await fs.writeFile(membersPath, JSON.stringify(members, null, 2));
    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create member' });
  }
});

export default router;
