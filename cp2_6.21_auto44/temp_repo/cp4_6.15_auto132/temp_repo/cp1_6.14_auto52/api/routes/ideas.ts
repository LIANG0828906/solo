import { Router } from 'express';
import { db } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function calculateHotScore(idea: any, commentCount: number) {
  const daysOld = (Date.now() - new Date(idea.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return idea.votes * 2 + idea.likes + commentCount * 2 - daysOld * 3;
}

function countComments(idea: any): number {
  const comments = idea.comments || [];
  let count = comments.length;
  comments.forEach((c: any) => {
    if (c.replies) count += c.replies.length;
  });
  return count;
}

function getCurrentUser() {
  return db.data!.users.find(u => u.id === db.data!.currentUserId) || db.data!.users[0];
}

router.get('/trending', (req, res) => {
  db.read();
  const ideas = [...db.data!.ideas].map(idea => ({
    ...idea,
    hotScore: calculateHotScore(idea, countComments(idea)),
  }));
  ideas.sort((a, b) => b.hotScore - a.hotScore);
  const top10 = ideas.slice(0, 10).map(i => ({
    id: i.id,
    title: i.title,
    hotScore: i.hotScore,
    votes: i.votes,
    authorName: i.authorName,
  }));
  res.json(top10);
});

router.get('/:id', (req, res) => {
  db.read();
  const idea = db.data!.ideas.find(i => i.id === req.params.id);
  if (!idea) {
    return res.status(404).json({ error: '创意不存在' });
  }
  const currentUser = getCurrentUser();
  const ideaWithMe = {
    ...idea,
    likedByMe: false,
    votedByMe: false,
    isAuthor: idea.authorId === currentUser.id,
    isAdmin: currentUser.role === 'admin',
    canConvert: idea.authorId === currentUser.id || currentUser.role === 'admin',
    commentCount: countComments(idea),
  };
  res.json(ideaWithMe);
});

router.get('/', (req, res) => {
  db.read();
  const { sort = 'hot', q = '', limit, offset } = req.query;
  let ideas = [...db.data!.ideas].map(idea => ({
    ...idea,
    commentCount: countComments(idea),
  }));

  if (q) {
    const query = (q as string).toLowerCase();
    ideas = ideas.filter(i =>
      i.title.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query) ||
      i.tags.some((t: any) => t.name.toLowerCase().includes(query))
    );
  }

  ideas.forEach(idea => {
    idea.hotScore = calculateHotScore(idea, idea.commentCount);
  });

  switch (sort) {
    case 'hot':
      ideas.sort((a, b) => b.hotScore - a.hotScore);
      break;
    case 'latest':
      ideas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'random':
      ideas = ideas.sort(() => Math.random() - 0.5);
      break;
  }

  const currentUser = getCurrentUser();
  ideas = ideas.map(i => ({
    ...i,
    likedByMe: false,
    votedByMe: false,
  }));

  if (limit) {
    const start = offset ? parseInt(offset as string) : 0;
    ideas = ideas.slice(start, start + parseInt(limit as string));
  }

  res.json({
    total: db.data!.ideas.length,
    items: ideas,
  });
});

router.post('/:id/vote', (req, res) => {
  db.read();
  const idea = db.data!.ideas.find(i => i.id === req.params.id);
  if (!idea) {
    return res.status(404).json({ error: '创意不存在' });
  }
  idea.votes += 1;
  idea.totalVoters = (idea.totalVoters || 0) + 1;
  idea.hotScore = calculateHotScore(idea, countComments(idea));
  db.write();
  res.json({ votes: idea.votes, totalVoters: idea.totalVoters, votedByMe: true });
});

router.post('/:id/like', (req, res) => {
  db.read();
  const idea = db.data!.ideas.find(i => i.id === req.params.id);
  if (!idea) {
    return res.status(404).json({ error: '创意不存在' });
  }
  idea.likes += 1;
  idea.hotScore = calculateHotScore(idea, countComments(idea));
  db.write();
  res.json({ likes: idea.likes, likedByMe: true });
});

router.post('/:id/comments', (req, res) => {
  db.read();
  const idea = db.data!.ideas.find(i => i.id === req.params.id);
  if (!idea) {
    return res.status(404).json({ error: '创意不存在' });
  }
  const currentUser = getCurrentUser();
  const newComment = {
    id: uuidv4(),
    userId: currentUser.id,
    userName: currentUser.name,
    userAvatar: currentUser.avatar,
    content: req.body.content,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedByMe: false,
    replies: [],
    parentId: null,
  };
  if (!idea.comments) idea.comments = [];
  idea.comments.unshift(newComment);
  idea.hotScore = calculateHotScore(idea, countComments(idea));
  db.write();
  res.json(newComment);
});

router.post('/:id/comments/:commentId/reply', (req, res) => {
  db.read();
  const idea = db.data!.ideas.find(i => i.id === req.params.id);
  if (!idea) {
    return res.status(404).json({ error: '创意不存在' });
  }
  const parentComment = findComment(idea.comments, req.params.commentId);
  if (!parentComment) {
    return res.status(404).json({ error: '评论不存在' });
  }
  const currentUser = getCurrentUser();
  const reply = {
    id: uuidv4(),
    userId: currentUser.id,
    userName: currentUser.name,
    userAvatar: currentUser.avatar,
    content: req.body.content,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedByMe: false,
    replies: [],
    parentId: req.params.commentId,
    replyTo: parentComment.userName,
  };
  if (!parentComment.replies) parentComment.replies = [];
  parentComment.replies.push(reply);
  idea.hotScore = calculateHotScore(idea, countComments(idea));
  db.write();
  res.json(reply);
});

router.post('/:id/comments/:commentId/like', (req, res) => {
  db.read();
  const idea = db.data!.ideas.find(i => i.id === req.params.id);
  if (!idea) {
    return res.status(404).json({ error: '创意不存在' });
  }
  const comment = findComment(idea.comments, req.params.commentId);
  if (!comment) {
    return res.status(404).json({ error: '评论不存在' });
  }
  comment.likes += 1;
  db.write();
  res.json({ likes: comment.likes, likedByMe: true });
});

function findComment(comments: any[], id: string): any | null {
  for (const c of comments) {
    if (c.id === id) return c;
    if (c.replies) {
      const found = findComment(c.replies, id);
      if (found) return found;
    }
  }
  return null;
}

router.post('/', (req, res) => {
  db.read();
  const currentUser = getCurrentUser();
  const newIdea = {
    id: uuidv4(),
    title: req.body.title,
    description: req.body.description,
    content: req.body.content,
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorAvatar: currentUser.avatar,
    tags: req.body.tags || [],
    likes: 0,
    votes: 0,
    totalVoters: 0,
    images: req.body.images || [],
    links: req.body.links || [],
    comments: [],
    commentCount: 0,
    createdAt: new Date().toISOString(),
    status: 'active',
    taskId: null,
    hotScore: 0,
  };
  db.data!.ideas.unshift(newIdea as any);
  db.write();
  res.status(201).json(newIdea);
});

export default router;
