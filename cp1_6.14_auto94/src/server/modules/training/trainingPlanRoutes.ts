import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../shared/db.js';
import type {
  TrainingPlan,
  PlanDay,
  PlanExercise,
  AdjustRequest,
} from '../../../shared/types/index.js';

const router = Router();

const GYM_ONLY_KEYWORDS = ['杠铃', '龙门架', '高位下拉', '腿举', '腿弯举', '战绳', '双杠', '悬垂', '坐姿划船', '绳索', '面拉', '窄距卧推', '臀推'];

function isGymOnly(exerciseName: string): boolean {
  return GYM_ONLY_KEYWORDS.some((kw) => exerciseName.includes(kw));
}

function determineDifficulty(squat: number, pushup: number, plank: number, flexibility: number, endurance: number): number {
  const normSquat = Math.min(squat / 5, 10);
  const normPushup = Math.min(pushup / 5, 10);
  const normPlank = Math.min(plank / 12, 10);
  const avg = (normSquat + normPushup + normPlank + flexibility + endurance) / 5;
  if (avg < 3) return 1;
  if (avg < 5) return 2;
  if (avg < 7) return 3;
  if (avg < 9) return 4;
  return 5;
}

router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { clientId, days, duration, focusAreas } = req.body as {
      clientId: string;
      days: number[];
      duration: number;
      focusAreas: string[];
    };

    if (!clientId || !days || !Array.isArray(days) || days.length === 0) {
      res.status(400).json({ error: '缺少必填字段：clientId 和 days' });
      return;
    }

    const client = db.data.clients.find((c) => c.id === clientId);
    if (!client) {
      res.status(404).json({ error: '客户不存在' });
      return;
    }

    const targetDiff = determineDifficulty(
      client.baselineScores.squat,
      client.baselineScores.pushup,
      client.baselineScores.plank,
      client.baselineScores.flexibility,
      client.baselineScores.endurance,
    );

    let available = db.data.exercises.filter((e) => e.difficulty <= targetDiff + 1);
    if (client.location === 'home') {
      available = available.filter((e) => !isGymOnly(e.name));
    }

    const goalSets = client.goal === 'muscle' ? 4 : 3;
    const goalReps = client.goal === 'muscle' ? '8-10' : client.goal === 'fat-loss' ? '12-15' : '10-12';
    const goalRest = client.goal === 'muscle' ? 90 : client.goal === 'fat-loss' ? 45 : 60;

    const planDays: PlanDay[] = days.map((dayIndex, i) => {
      const primaryFocus = focusAreas.length > 0 ? focusAreas[i % focusAreas.length] : '';
      const secondaryFocus = focusAreas.length > 1 ? focusAreas[(i + 1) % focusAreas.length] : '';

      let primary: typeof available = [];
      let secondary: typeof available = [];

      if (primaryFocus) {
        primary = available.filter((e) => e.muscleGroup === primaryFocus);
      }
      if (secondaryFocus && secondaryFocus !== primaryFocus) {
        secondary = available.filter((e) => e.muscleGroup === secondaryFocus);
      }

      const selectedIds = new Set<string>();
      const dayExercises: PlanExercise[] = [];
      let order = 1;

      for (const ex of primary.slice(0, 3)) {
        if (!selectedIds.has(ex.id)) {
          selectedIds.add(ex.id);
          dayExercises.push({ exerciseId: ex.id, sets: goalSets, reps: goalReps, restSeconds: goalRest, order: order++ });
        }
      }

      for (const ex of secondary.slice(0, 2)) {
        if (!selectedIds.has(ex.id)) {
          selectedIds.add(ex.id);
          dayExercises.push({ exerciseId: ex.id, sets: goalSets, reps: goalReps, restSeconds: goalRest, order: order++ });
        }
      }

      if (dayExercises.length < 4) {
        const fallback = available.filter((e) => !selectedIds.has(e.id));
        for (const ex of fallback) {
          if (dayExercises.length >= 5) break;
          selectedIds.add(ex.id);
          dayExercises.push({ exerciseId: ex.id, sets: goalSets, reps: goalReps, restSeconds: goalRest, order: order++ });
        }
      }

      const dayFocusAreas: string[] = [];
      if (primaryFocus) dayFocusAreas.push(primaryFocus);
      if (secondaryFocus && secondaryFocus !== primaryFocus) dayFocusAreas.push(secondaryFocus);

      return {
        dayIndex,
        duration: duration || 45,
        focusAreas: dayFocusAreas,
        exercises: dayExercises,
      };
    });

    const plan: TrainingPlan = {
      id: uuidv4(),
      clientId,
      weekStart: new Date().toISOString().split('T')[0],
      days: planDays,
      createdAt: new Date().toISOString(),
    };

    db.data.trainingPlans.push(plan);
    await db.write();
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: '创建训练计划失败' });
  }
});

router.get('/:clientId', async (req, res) => {
  try {
    const db = await getDb();
    const clientId = req.params.clientId;
    const clientPlans = db.data.trainingPlans.filter((p) => p.clientId === clientId);
    if (clientPlans.length === 0) {
      res.status(404).json({ error: '未找到该客户的训练计划' });
      return;
    }
    const latest = clientPlans.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: '获取训练计划失败' });
  }
});

router.put('/:planId', async (req, res) => {
  try {
    const db = await getDb();
    const plan = db.data.trainingPlans.find((p) => p.id === req.params.planId);
    if (!plan) {
      res.status(404).json({ error: '训练计划不存在' });
      return;
    }
    const { days } = req.body as { days?: PlanDay[] };
    if (days) {
      plan.days = days;
    }
    await db.write();
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: '更新训练计划失败' });
  }
});

router.put('/:planId/adjust', async (req, res) => {
  try {
    const db = await getDb();
    const plan = db.data.trainingPlans.find((p) => p.id === req.params.planId);
    if (!plan) {
      res.status(404).json({ error: '训练计划不存在' });
      return;
    }

    const { selfAssessment, dayIndex } = req.body as AdjustRequest;
    if (!selfAssessment || dayIndex === undefined) {
      res.status(400).json({ error: '缺少自我评估数据或训练日索引' });
      return;
    }

    const day = plan.days.find((d) => d.dayIndex === dayIndex);
    if (!day) {
      res.status(404).json({ error: '未找到指定训练日' });
      return;
    }

    const allExercises = db.data.exercises;
    const modificationNotes: string[] = [];
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
    res.json({ plan, modificationNotes });
  } catch (err) {
    res.status(500).json({ error: '调整训练计划失败' });
  }
});

export default router;
