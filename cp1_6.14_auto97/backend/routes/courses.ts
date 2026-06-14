import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    res.status(200).json(db.data.courses);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get courses' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Course name is required' });
      return;
    }
    const db = await getDb();
    const newCourse = {
      id: uuidv4(),
      name,
      chapters: [],
      createdAt: new Date().toISOString(),
    };
    db.data.courses.push(newCourse);
    await db.write();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create course' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const db = await getDb();
    const course = db.data.courses.find((c) => c.id === id);
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }
    if (name !== undefined) course.name = name;
    await db.write();
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update course' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const index = db.data.courses.findIndex((c) => c.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }
    const deletedChapters = db.data.courses[index].chapters.map((ch) => ch.id);
    db.data.courses.splice(index, 1);
    db.data.questions = db.data.questions.filter((q) => !deletedChapters.includes(q.chapterId));
    db.data.papers = db.data.papers.filter((p) => !deletedChapters.includes(p.chapterId));
    await db.write();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete course' });
  }
});

router.post('/:courseId/chapters', async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { name, knowledgePoints = [] } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Chapter name is required' });
      return;
    }
    const db = await getDb();
    const course = db.data.courses.find((c) => c.id === courseId);
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }
    const newChapter = {
      id: uuidv4(),
      name,
      knowledgePoints,
    };
    course.chapters.push(newChapter);
    await db.write();
    res.status(201).json(newChapter);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create chapter' });
  }
});

router.put('/chapters/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, knowledgePoints } = req.body;
    const db = await getDb();
    let chapter = null;
    for (const course of db.data.courses) {
      chapter = course.chapters.find((ch) => ch.id === id);
      if (chapter) break;
    }
    if (!chapter) {
      res.status(404).json({ success: false, error: 'Chapter not found' });
      return;
    }
    if (name !== undefined) chapter.name = name;
    if (knowledgePoints !== undefined) chapter.knowledgePoints = knowledgePoints;
    await db.write();
    res.status(200).json(chapter);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update chapter' });
  }
});

router.delete('/chapters/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    let found = false;
    for (const course of db.data.courses) {
      const index = course.chapters.findIndex((ch) => ch.id === id);
      if (index !== -1) {
        course.chapters.splice(index, 1);
        found = true;
        break;
      }
    }
    if (!found) {
      res.status(404).json({ success: false, error: 'Chapter not found' });
      return;
    }
    db.data.questions = db.data.questions.filter((q) => q.chapterId !== id);
    db.data.papers = db.data.papers.filter((p) => p.chapterId !== id);
    await db.write();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete chapter' });
  }
});

export default router;
