import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../shared/db.js';
import type { Exercise } from '../../../shared/types/index.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    let exercises = db.data.exercises;
    const { muscleGroup, search } = req.query as { muscleGroup?: string; search?: string };
    if (muscleGroup) {
      exercises = exercises.filter((e) => e.muscleGroup === muscleGroup);
    }
    if (search) {
      const keyword = search.toLowerCase();
      exercises = exercises.filter((e) => e.name.toLowerCase().includes(keyword));
    }
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: '获取动作列表失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { name, muscleGroup, mediaUrl, difficulty, description } = req.body as Omit<Exercise, 'id'>;
    if (!name || !muscleGroup || !difficulty) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }
    const newExercise: Exercise = {
      id: uuidv4(),
      name,
      muscleGroup,
      mediaUrl: mediaUrl || '',
      difficulty,
      description: description || '',
    };
    db.data.exercises.push(newExercise);
    await db.write();
    res.status(201).json(newExercise);
  } catch (err) {
    res.status(500).json({ error: '创建动作失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const exercise = db.data.exercises.find((e) => e.id === req.params.id);
    if (!exercise) {
      res.status(404).json({ error: '动作不存在' });
      return;
    }
    const { name, muscleGroup, mediaUrl, difficulty, description } = req.body;
    if (name !== undefined) exercise.name = name;
    if (muscleGroup !== undefined) exercise.muscleGroup = muscleGroup;
    if (mediaUrl !== undefined) exercise.mediaUrl = mediaUrl;
    if (difficulty !== undefined) exercise.difficulty = difficulty;
    if (description !== undefined) exercise.description = description;
    await db.write();
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: '更新动作失败' });
  }
});

export default router;
