import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../src/data');

const activitiesPath = path.resolve(dataDir, 'activities.json');
const progressPath = path.resolve(dataDir, 'progress.json');
const membersPath = path.resolve(dataDir, 'members.json');

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, author, coverUrl, totalChapters, startDate, endDate, readingPlan, discussionRules, creatorId } = req.body;
    const activities = JSON.parse(await fs.readFile(activitiesPath, 'utf-8'));
    const newActivity = {
      id: uuidv4(),
      title,
      author,
      coverUrl,
      totalChapters,
      startDate,
      endDate,
      readingPlan,
      discussionRules,
      creatorId,
      members: [creatorId],
      createdAt: new Date().toISOString()
    };
    activities.push(newActivity);
    await fs.writeFile(activitiesPath, JSON.stringify(activities, null, 2));
    res.status(201).json(newActivity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const activities = JSON.parse(await fs.readFile(activitiesPath, 'utf-8'));
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const activities = JSON.parse(await fs.readFile(activitiesPath, 'utf-8'));
    const activity = activities.find((a: any) => a.id === req.params.id);
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

router.post('/:id/join', async (req: Request, res: Response) => {
  try {
    const { memberId } = req.body;
    const activities = JSON.parse(await fs.readFile(activitiesPath, 'utf-8'));
    const activity = activities.find((a: any) => a.id === req.params.id);
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    if (!activity.members.includes(memberId)) {
      activity.members.push(memberId);
      await fs.writeFile(activitiesPath, JSON.stringify(activities, null, 2));
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join activity' });
  }
});

router.get('/:id/progress/:memberId', async (req: Request, res: Response) => {
  try {
    const progress = JSON.parse(await fs.readFile(progressPath, 'utf-8'));
    const memberProgress = progress.find(
      (p: any) => p.activityId === req.params.id && p.memberId === req.params.memberId
    );
    if (!memberProgress) {
      res.status(404).json({ error: 'Progress not found' });
      return;
    }
    res.json(memberProgress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

router.put('/:id/progress/:memberId', async (req: Request, res: Response) => {
  try {
    const { completedChapters, readingCalendar, note } = req.body;
    const progress = JSON.parse(await fs.readFile(progressPath, 'utf-8'));
    let memberProgress = progress.find(
      (p: any) => p.activityId === req.params.id && p.memberId === req.params.memberId
    );
    if (!memberProgress) {
      memberProgress = {
        activityId: req.params.id,
        memberId: req.params.memberId,
        completedChapters: 0,
        readingCalendar: [],
        notes: []
      };
      progress.push(memberProgress);
    }
    if (completedChapters !== undefined) {
      memberProgress.completedChapters = completedChapters;
    }
    if (readingCalendar !== undefined) {
      memberProgress.readingCalendar = readingCalendar;
    }
    if (note) {
      memberProgress.notes = memberProgress.notes || [];
      memberProgress.notes.push({
        chapter: note.chapter,
        content: note.content,
        createdAt: new Date().toISOString()
      });
    }
    await fs.writeFile(progressPath, JSON.stringify(progress, null, 2));
    res.json(memberProgress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const progress = JSON.parse(await fs.readFile(progressPath, 'utf-8'));
    const activityProgress = progress.filter((p: any) => p.activityId === req.params.id);
    res.json(activityProgress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
