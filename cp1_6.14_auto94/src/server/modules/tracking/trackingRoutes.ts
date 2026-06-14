import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../shared/db.js';
import type { Session, SelfAssessment } from '../../../shared/types/index.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { planId, clientId, date, dayIndex } = req.body as {
      planId: string;
      clientId: string;
      date: string;
      dayIndex: number;
    };

    if (!planId || !clientId || !date || dayIndex === undefined) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }

    const session: Session = {
      id: uuidv4(),
      planId,
      clientId,
      date,
      dayIndex,
      completedExercises: [],
      selfAssessment: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      totalDuration: 0,
    };

    db.data.sessions.push(session);
    await db.write();
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: '记录训练会话失败' });
  }
});

router.post('/self-assessment', async (req, res) => {
  try {
    const db = await getDb();
    const { sessionId, selfAssessment } = req.body as {
      sessionId: string;
      selfAssessment: SelfAssessment;
    };

    if (!sessionId || !selfAssessment) {
      res.status(400).json({ error: '缺少会话ID或自我评估数据' });
      return;
    }

    const session = db.data.sessions.find((s) => s.id === sessionId);
    if (!session) {
      res.status(404).json({ error: '训练会话不存在' });
      return;
    }

    session.selfAssessment = selfAssessment;
    await db.write();

    const plan = db.data.trainingPlans.find((p) => p.id === session.planId);
    let modificationNotes: string[] = [];
    if (plan) {
      const nextDayIndex = session.dayIndex;
      const allExercises = db.data.exercises;
      const day = plan.days.find((d) => d.dayIndex === nextDayIndex);

      if (day) {
        let globalEnergyNoteAdded = false;
        let sleepNoteAdded = false;

        for (const planEx of day.exercises) {
          const exerciseInfo = allExercises.find((e) => e.id === planEx.exerciseId);
          const originalSets = planEx.sets;
          const originalRest = planEx.restSeconds;

          if (exerciseInfo && selfAssessment.soreAreas.includes(exerciseInfo.muscleGroup)) {
            const soreReduction = selfAssessment.soreAreas.length >= 3 ? 0.6 : 0.7;
            planEx.sets = Math.max(1, Math.round(originalSets * soreReduction));
            const reductionPercent = Math.round((1 - soreReduction) * 100);
            modificationNotes.push(
              `因${exerciseInfo.muscleGroup}酸痛，${exerciseInfo.name}组数从${originalSets}减少到${planEx.sets}（减少${reductionPercent}%）`,
            );
          }

          if (selfAssessment.energyLevel < 4) {
            const currentSets = planEx.sets;
            planEx.sets = Math.max(1, Math.round(currentSets * 0.7));
            if (!globalEnergyNoteAdded) {
              modificationNotes.push(`因精力不足（能量值${selfAssessment.energyLevel}），整体训练量减少30%`);
              globalEnergyNoteAdded = true;
            }
          } else if (selfAssessment.energyLevel > 7) {
            const currentSets = planEx.sets;
            const increasePercent = (selfAssessment.energyLevel - 7) * 10;
            const cappedPercent = Math.min(increasePercent, 20);
            planEx.sets = Math.round(currentSets * (1 + cappedPercent / 100));
            if (!globalEnergyNoteAdded) {
              modificationNotes.push(`因精力充沛（能量值${selfAssessment.energyLevel}），训练量增加${cappedPercent}%`);
              globalEnergyNoteAdded = true;
            }
          }

          if (selfAssessment.sleepQuality < 3) {
            planEx.restSeconds = Math.round(originalRest * 1.3);
            if (!sleepNoteAdded) {
              modificationNotes.push(
                `因睡眠质量较差（评分${selfAssessment.sleepQuality}），组间休息时间增加30%，建议降低训练强度`,
              );
              sleepNoteAdded = true;
            }
          }
        }

        await db.write();
      }
    }

    res.json({ session, modificationNotes });
  } catch (err) {
    res.status(500).json({ error: '提交自我评估失败' });
  }
});

router.get('/:sessionId', async (req, res) => {
  try {
    const db = await getDb();
    const session = db.data.sessions.find((s) => s.id === req.params.sessionId);
    if (!session) {
      res.status(404).json({ error: '训练会话不存在' });
      return;
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: '获取训练会话失败' });
  }
});

router.get('/client/:clientId/today', async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];
    const clientId = req.params.clientId;
    const session = db.data.sessions.find(
      (s) => s.clientId === clientId && s.date === today,
    );
    if (!session) {
      res.status(404).json({ error: '今日无训练会话' });
      return;
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: '获取今日训练会话失败' });
  }
});

export default router;
