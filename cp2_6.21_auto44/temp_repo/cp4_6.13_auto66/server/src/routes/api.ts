import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, ensureTodayChallenge } from '../db/index.js';
import { authMiddleware, generateToken } from '../middleware/auth.js';
import type { RecipeStep } from '../types/index.js';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: '用户名、邮箱和密码不能为空' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: '密码长度至少为6位' });
      return;
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      res.status(400).json({ error: '用户名或邮箱已存在' });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, email, password, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, username, email, hashedPassword, now);

    const token = generateToken({ userId: id, username });
    res.status(201).json({
      message: '注册成功',
      token,
      user: { id, username, email }
    });
  } catch (error) {
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = generateToken({ userId: user.id, username: user.username });
    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

router.get('/recipes', (req: Request, res: Response) => {
  try {
    const { bean, grind, method } = req.query;

    let query = `
      SELECT id, user_id as userId, username, name, bean_type as beanType,
             grind_level as grindLevel, water_temp as waterTemp,
             pour_method as pourMethod, image, average_rating as averageRating,
             vote_count as voteCount, created_at as createdAt
      FROM recipes WHERE 1=1
    `;
    const params: any[] = [];

    if (bean) {
      query += ' AND bean_type LIKE ?';
      params.push(`%${bean}%`);
    }
    if (grind) {
      query += ' AND grind_level LIKE ?';
      params.push(`%${grind}%`);
    }
    if (method) {
      query += ' AND pour_method LIKE ?';
      params.push(`%${method}%`);
    }

    query += ' ORDER BY created_at DESC';

    const recipes = db.prepare(query).all(...params);
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: '获取配方列表失败' });
  }
});

router.get('/recipes/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recipe: any = db.prepare(`
      SELECT id, user_id as userId, username, name, bean_type as beanType,
             grind_level as grindLevel, water_temp as waterTemp,
             pour_method as pourMethod, steps, image, average_rating as averageRating,
             vote_count as voteCount, created_at as createdAt
      FROM recipes WHERE id = ?
    `).get(id);

    if (!recipe) {
      res.status(404).json({ error: '配方不存在' });
      return;
    }

    let steps: RecipeStep[] = [];
    try {
      steps = JSON.parse(recipe.steps);
    } catch (e) {
      steps = [];
    }

    const comments = db.prepare(`
      SELECT id, recipe_id as recipeId, user_id as userId, username,
             content, created_at as createdAt
      FROM comments WHERE recipe_id = ? ORDER BY created_at DESC
    `).all(id);

    const voteHistory = db.prepare(`
      SELECT id, recipe_id as recipeId, user_id as userId, username,
             rating, comment, created_at as createdAt
      FROM votes WHERE recipe_id = ? ORDER BY created_at DESC
    `).all(id);

    res.json({
      ...recipe,
      steps,
      comments,
      voteHistory
    });
  } catch (error) {
    res.status(500).json({ error: '获取配方详情失败' });
  }
});

router.post('/recipes', authMiddleware, (req: Request, res: Response) => {
  try {
    const { name, beanType, grindLevel, waterTemp, pourMethod, steps, image } = req.body;
    const user = req.user!;

    if (!name || !beanType || !grindLevel || !waterTemp || !pourMethod || !steps) {
      res.status(400).json({ error: '请填写所有必填字段' });
      return;
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      res.status(400).json({ error: '冲煮步骤不能为空' });
      return;
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const stepsJson = JSON.stringify(steps);

    db.prepare(`
      INSERT INTO recipes (id, user_id, username, name, bean_type, grind_level,
                          water_temp, pour_method, steps, image, average_rating, vote_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
    `).run(id, user.userId, user.username, name, beanType, grindLevel,
           waterTemp, pourMethod, stepsJson, image || '', now);

    const recipe = db.prepare(`
      SELECT id, user_id as userId, username, name, bean_type as beanType,
             grind_level as grindLevel, water_temp as waterTemp,
             pour_method as pourMethod, steps, image, average_rating as averageRating,
             vote_count as voteCount, created_at as createdAt
      FROM recipes WHERE id = ?
    `).get(id);

    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: '创建配方失败' });
  }
});

router.post('/recipes/:id/vote', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = req.user!;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: '评分必须在1-5之间' });
      return;
    }

    const recipe: any = db.prepare('SELECT id FROM recipes WHERE id = ?').get(id);
    if (!recipe) {
      res.status(404).json({ error: '配方不存在' });
      return;
    }

    const existingVote: any = db.prepare(
      'SELECT id FROM votes WHERE recipe_id = ? AND user_id = ?'
    ).get(id, user.userId);

    const now = new Date().toISOString();

    if (existingVote) {
      db.prepare(`
        UPDATE votes SET rating = ?, comment = ?, created_at = ?
        WHERE id = ?
      `).run(rating, comment || '', now, existingVote.id);
    } else {
      const voteId = uuidv4();
      db.prepare(`
        INSERT INTO votes (id, recipe_id, user_id, username, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(voteId, id, user.userId, user.username, rating, comment || '', now);
    }

    const stats: any = db.prepare(`
      SELECT AVG(rating) as avgRating, COUNT(*) as voteCount
      FROM votes WHERE recipe_id = ?
    `).get(id);

    db.prepare(`
      UPDATE recipes SET average_rating = ?, vote_count = ? WHERE id = ?
    `).run(stats.avgRating || 0, stats.voteCount || 0, id);

    if (comment) {
      const commentId = uuidv4();
      db.prepare(`
        INSERT INTO comments (id, recipe_id, user_id, username, content, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(commentId, id, user.userId, user.username, comment, now);
    }

    const updatedRecipe = db.prepare(`
      SELECT id, user_id as userId, username, name, bean_type as beanType,
             grind_level as grindLevel, water_temp as waterTemp,
             pour_method as pourMethod, steps, image, average_rating as averageRating,
             vote_count as voteCount, created_at as createdAt
      FROM recipes WHERE id = ?
    `).get(id);

    res.json({
      message: '评分成功',
      recipe: updatedRecipe
    });
  } catch (error) {
    res.status(500).json({ error: '评分失败' });
  }
});

router.get('/challenges/current', (req: Request, res: Response) => {
  try {
    const challenge = ensureTodayChallenge();

    const submissions = db.prepare(`
      SELECT cs.id, cs.challenge_id as challengeId, cs.user_id as userId,
             cs.username, cs.recipe_id as recipeId, cs.total_rating as totalRating,
             cs.submitted_at as submittedAt,
             r.name as recipeName, r.image as recipeImage
      FROM challenge_submissions cs
      LEFT JOIN recipes r ON cs.recipe_id = r.id
      WHERE cs.challenge_id = ?
      ORDER BY cs.total_rating DESC, cs.submitted_at ASC
    `).all(challenge.id);

    res.json({
      id: challenge.id,
      date: challenge.date,
      beanType: challenge.bean_type,
      tool: challenge.tool,
      description: challenge.description,
      submissions
    });
  } catch (error) {
    res.status(500).json({ error: '获取挑战信息失败' });
  }
});

router.post('/challenges/current/submit', authMiddleware, (req: Request, res: Response) => {
  try {
    const { recipeId } = req.body;
    const user = req.user!;

    if (!recipeId) {
      res.status(400).json({ error: '请提供配方ID' });
      return;
    }

    const challenge = ensureTodayChallenge();

    const recipe: any = db.prepare(`
      SELECT id, user_id, bean_type, pour_method, average_rating
      FROM recipes WHERE id = ?
    `).get(recipeId);

    if (!recipe) {
      res.status(404).json({ error: '配方不存在' });
      return;
    }

    if (recipe.user_id !== user.userId) {
      res.status(403).json({ error: '只能提交自己的配方' });
      return;
    }

    if (recipe.bean_type !== challenge.bean_type || recipe.pour_method !== challenge.tool) {
      res.status(400).json({
        error: `配方不符合挑战要求，需要使用 ${challenge.tool} 冲煮 ${challenge.bean_type} 咖啡豆`
      });
      return;
    }

    const existingSubmission = db.prepare(
      'SELECT id FROM challenge_submissions WHERE challenge_id = ? AND user_id = ?'
    ).get(challenge.id, user.userId);

    const now = new Date().toISOString();
    const totalRating = recipe.average_rating || 0;

    if (existingSubmission) {
      db.prepare(`
        UPDATE challenge_submissions
        SET recipe_id = ?, total_rating = ?, submitted_at = ?
        WHERE id = ?
      `).run(recipeId, totalRating, now, existingSubmission.id);
    } else {
      const submissionId = uuidv4();
      db.prepare(`
        INSERT INTO challenge_submissions (id, challenge_id, user_id, username,
                                          recipe_id, total_rating, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(submissionId, challenge.id, user.userId, user.username,
             recipeId, totalRating, now);
    }

    const submissions = db.prepare(`
      SELECT cs.id, cs.challenge_id as challengeId, cs.user_id as userId,
             cs.username, cs.recipe_id as recipeId, cs.total_rating as totalRating,
             cs.submitted_at as submittedAt,
             r.name as recipeName, r.image as recipeImage
      FROM challenge_submissions cs
      LEFT JOIN recipes r ON cs.recipe_id = r.id
      WHERE cs.challenge_id = ?
      ORDER BY cs.total_rating DESC, cs.submitted_at ASC
    `).all(challenge.id);

    res.json({
      message: '提交成功',
      challenge: {
        id: challenge.id,
        date: challenge.date,
        beanType: challenge.bean_type,
        tool: challenge.tool,
        description: challenge.description,
        submissions
      }
    });
  } catch (error) {
    res.status(500).json({ error: '提交挑战失败' });
  }
});

router.get('/user/profile', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const userData: any = db.prepare(
      'SELECT id, username, email, created_at as createdAt FROM users WHERE id = ?'
    ).get(user.userId);

    if (!userData) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const recipeStats: any = db.prepare(`
      SELECT COUNT(*) as recipeCount,
             COALESCE(SUM(average_rating * vote_count), 0) as totalRatingSum,
             COALESCE(SUM(vote_count), 0) as totalVotes
      FROM recipes WHERE user_id = ?
    `).get(user.userId);

    const totalRating = recipeStats.totalRatingSum;
    const averageRating = recipeStats.totalVotes > 0
      ? totalRating / recipeStats.totalVotes
      : 0;

    const challengeHistory = db.prepare(`
      SELECT cs.id, cs.challenge_id as challengeId, cs.user_id as userId,
             cs.username, cs.recipe_id as recipeId, cs.total_rating as totalRating,
             cs.submitted_at as submittedAt,
             c.date as challengeDate, c.bean_type as beanType, c.tool as tool,
             r.name as recipeName, r.image as recipeImage
      FROM challenge_submissions cs
      LEFT JOIN challenges c ON cs.challenge_id = c.id
      LEFT JOIN recipes r ON cs.recipe_id = r.id
      WHERE cs.user_id = ?
      ORDER BY cs.submitted_at DESC
    `).all(user.userId);

    res.json({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      createdAt: userData.createdAt,
      recipeCount: recipeStats.recipeCount,
      totalRating: Math.round(totalRating * 100) / 100,
      averageRating: Math.round(averageRating * 100) / 100,
      challengeHistory
    });
  } catch (error) {
    res.status(500).json({ error: '获取用户资料失败' });
  }
});

export default router;
