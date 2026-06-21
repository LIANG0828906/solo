import { Router } from 'express';
import { store } from '../store/memoryStore.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  const { sort = 'hot', tag } = req.query;
  const poems = store.getPoems({ sort, tag });
  
  res.json(poems.map(p => ({
    id: p.id,
    title: p.title,
    content: p.content,
    authorId: p.authorId,
    authorName: p.authorName,
    tags: p.tags,
    likes: p.likes,
    liked: false,
    comments: p.comments.length,
    createdAt: p.createdAt,
  })));
});

router.get('/:id', (req, res) => {
  const poem = store.getPoemById(req.params.id);
  if (!poem) {
    return res.status(404).json({ error: '作品不存在' });
  }

  res.json({
    id: poem.id,
    title: poem.title,
    content: poem.content,
    authorId: poem.authorId,
    authorName: poem.authorName,
    tags: poem.tags,
    likes: poem.likes,
    comments: poem.comments,
    createdAt: poem.createdAt,
  });
});

router.post('/', authMiddleware, (req, res) => {
  const { title, content, tags } = req.body;

  if (!title || !content || !tags || tags.length === 0) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  if (title.length > 50) {
    return res.status(400).json({ error: '标题不能超过50字' });
  }

  if (content.length > 300) {
    return res.status(400).json({ error: '正文不能超过300字' });
  }

  if (tags.length < 1 || tags.length > 3) {
    return res.status(400).json({ error: '请选择1-3个标签' });
  }

  const poem = store.createPoem({
    title,
    content,
    tags,
    authorId: req.user.id,
    authorName: req.user.nickname,
  });

  res.status(201).json({
    id: poem.id,
    title: poem.title,
    content: poem.content,
    authorId: poem.authorId,
    authorName: poem.authorName,
    tags: poem.tags,
    likes: poem.likes,
    comments: poem.comments,
    createdAt: poem.createdAt,
  });
});

router.post('/:id/like', authMiddleware, (req, res) => {
  const result = store.toggleLike(req.params.id, req.user.id);
  if (!result) {
    return res.status(404).json({ error: '作品不存在' });
  }

  res.json({
    likes: result.poem.likes,
    liked: result.liked,
  });
});

router.post('/:id/comments', authMiddleware, (req, res) => {
  const { content } = req.body;

  if (!content || content.length > 200) {
    return res.status(400).json({ error: '评论内容不能为空且不能超过200字' });
  }

  const comment = store.addComment(req.params.id, {
    userId: req.user.id,
    userName: req.user.nickname,
    content,
  });

  if (!comment) {
    return res.status(404).json({ error: '作品不存在' });
  }

  res.status(201).json(comment);
});

export default router;
