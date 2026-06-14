import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../shared/db.js';
import type { Session, SelfAssessment } from '../../../shared/types/index.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const body = req.body as Partial<Session>;
    const { planId, clientId, date, dayIndex, completedExercises, selfAssessment, startedAt, completedAt, totalDuration } = body;

    if (!clientId || !date) {
      res.status(400).json({ error: '缺少必填字段: clientId, date' });
      return;
    }

    const existingIdx = db.data.sessions.findIndex(
      (s) => s.clientId === clientId && s.date === date.split('T')[0]
    );

    const sessionData: Session = {
      id: existingIdx >= 0 ? db.data.sessions[existingIdx].id : uuidv4(),
      planId: planId || db.data.trainingPlans.find(p => p.clientId === clientId)?.id || '',
      clientId,
      date: date.split('T')[0],
      dayIndex: dayIndex ?? 0,
      completedExercises: completedExercises || [],
      selfAssessment: selfAssessment ?? (existingIdx >= 0 ? db.data.sessions[existingIdx].selfAssessment : null),
      startedAt: startedAt || (existingIdx >= 0 ? db.data.sessions[existingIdx].startedAt : null),
      completedAt: completedAt || null,
      totalDuration: totalDuration ?? (existingIdx >= 0 ? db.data.sessions[existingIdx].totalDuration : 0),
    };

    if (existingIdx >= 0) {
      db.data.sessions[existingIdx] = sessionData;
    } else {
      db.data.sessions.push(sessionData);
    }
    await db.write();
    res.status(201).json(sessionData);
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: '记录训练会话失败' });
  }
});

router.post('/self-assessment', async (req, res) => {
  try {
    const db = await getDb();
    const body = req.body as {
      sessionId?: string;
      clientId?: string;
      date?: string;
      selfAssessment: SelfAssessment;
    };
    const { selfAssessment } = body;

    if (!selfAssessment) {
      res.status(400).json({ error: '缺少自我评估数据' });
      return;
    }

    let targetClientId = body.clientId;
    const targetDate = body.date?.split('T')[0] || new Date().toISOString().split('T')[0];

    if (!targetClientId && body.sessionId) {
      const session = db.data.sessions.find(s => s.id === body.sessionId);
      targetClientId = session?.clientId;
    }

    if (!targetClientId) {
      res.status(400).json({ error: '需要clientId或sessionId' });
      return;
    }

    let session = db.data.sessions.find(
      (s) => s.clientId === targetClientId && s.date === targetDate
    );

    if (!session) {
      session = {
        id: uuidv4(),
        planId: db.data.trainingPlans.find(p => p.clientId === targetClientId)?.id || '',
        clientId: targetClientId,
        date: targetDate,
        dayIndex: ((new Date().getDay() + 6) % 7),
        completedExercises: [],
        selfAssessment,
        startedAt: null,
        completedAt: null,
        totalDuration: 0,
      };
      db.data.sessions.push(session);
    } else {
      session.selfAssessment = selfAssessment;
    }

    const modificationNotes: string[] = [];
    const plan = db.data.trainingPlans.find(
      (p) => p.clientId === targetClientId &&
        (p.id === session!.planId || !session!.planId)
    );

    if (plan) {
      const nextDayIndex = session!.dayIndex;
      const allExercises = db.data.exercises;
      const day = plan.days.find((d) => d.dayIndex === nextDayIndex) || plan.days[0];

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
              modificationNotes.push(`因精力不足（能量值${selfAssessment.energyLevel}/10），整体训练量减少30%`);
              globalEnergyNoteAdded = true;
            }
          } else if (selfAssessment.energyLevel > 7) {
            const currentSets = planEx.sets;
            const increasePercent = (selfAssessment.energyLevel - 7) * 10;
            const cappedPercent = Math.min(increasePercent, 20);
            planEx.sets = Math.round(currentSets * (1 + cappedPercent / 100));
            if (!globalEnergyNoteAdded) {
              modificationNotes.push(`因精力充沛（能量值${selfAssessment.energyLevel}/10），训练量增加${cappedPercent}%`);
              globalEnergyNoteAdded = true;
            }
          }

          if (selfAssessment.sleepQuality < 3) {
            planEx.restSeconds = Math.round(originalRest * 1.3);
            if (!sleepNoteAdded) {
              modificationNotes.push(
                `因睡眠质量较差（${selfAssessment.sleepQuality}/5星），组间休息时间增加30%，建议降低训练强度`,
              );
              sleepNoteAdded = true;
            }
          }
        }

        await db.write();
      }
    }

    res.json({ session, modificationNotes, plan });
  } catch (err) {
    console.error('Self-assessment error:', err);
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

router.get('/client/:clientId/today/assessment', async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];
    const clientId = req.params.clientId;
    const session = db.data.sessions.find(
      (s) => s.clientId === clientId && s.date === today && s.selfAssessment,
    );
    if (!session) {
      res.status(404).json({ error: '今日暂无自评数据' });
      return;
    }
    res.json({
      selfAssessment: session.selfAssessment,
      modificationNotes: [],
      hasAssessment: true,
    });
  } catch (err) {
    res.status(404).json({ error: '今日暂无自评数据' });
  }
});

export default router;
