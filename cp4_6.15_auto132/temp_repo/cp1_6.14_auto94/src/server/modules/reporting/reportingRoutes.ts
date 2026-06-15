import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'jspdf';
import { getDb } from '../../shared/db.js';
import type {
  WeeklyReport,
  ProgressCurve,
  AssessmentTrend,
  BaselineScores,
} from '../../../shared/types/index.js';

const router = Router();

function getWeekDates(weekKey: string): { start: Date; end: Date } {
  const start = new Date(weekKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function computeCompletionRate(sessions: { completedAt: string | null }[], plannedDays: number): number {
  if (plannedDays === 0) return 0;
  const completed = sessions.filter((s) => s.completedAt !== null).length;
  return Math.round((completed / plannedDays) * 100);
}

function computeAvgDuration(sessions: { totalDuration: number; completedAt: string | null }[]): number {
  const completed = sessions.filter((s) => s.completedAt !== null);
  if (completed.length === 0) return 0;
  const total = completed.reduce((sum, s) => sum + s.totalDuration, 0);
  return Math.round(total / completed.length);
}

function computeTotalCalories(
  sessions: { completedExercises: { exerciseId: string; completedSets: number }[]; completedAt: string | null }[],
  exercises: { id: string; difficulty: number }[],
): number {
  let total = 0;
  for (const session of sessions) {
    if (!session.completedAt) continue;
    for (const ce of session.completedExercises) {
      const ex = exercises.find((e) => e.id === ce.exerciseId);
      if (ex) {
        total += ce.completedSets * ex.difficulty * 5;
      }
    }
  }
  return total;
}

function buildProgressCurves(
  sessions: { date: string; completedExercises: { exerciseId: string; completedReps: number[]; completedSets: number }[]; completedAt: string | null }[],
  exercises: { id: string; name: string }[],
): ProgressCurve[] {
  const exerciseMap = new Map<string, { day: string; value: number }[]>();
  for (const session of sessions) {
    if (!session.completedAt) continue;
    for (const ce of session.completedExercises) {
      const ex = exercises.find((e) => e.id === ce.exerciseId);
      if (!ex) continue;
      const totalReps = ce.completedReps.reduce((s, r) => s + r, 0);
      if (!exerciseMap.has(ex.id)) {
        exerciseMap.set(ex.id, []);
      }
      exerciseMap.get(ex.id)!.push({ day: session.date, value: totalReps });
    }
  }
  const curves: ProgressCurve[] = [];
  for (const [id, data] of exerciseMap) {
    const ex = exercises.find((e) => e.id === id);
    curves.push({ exerciseName: ex?.name || id, data });
  }
  return curves;
}

function buildAssessmentTrend(
  sessions: { date: string; selfAssessment: { sleepQuality: number; energyLevel: number; soreAreas: string[] } | null; completedAt: string | null }[],
): AssessmentTrend[] {
  return sessions
    .filter((s) => s.completedAt && s.selfAssessment)
    .map((s) => ({
      date: s.date,
      sleepQuality: s.selfAssessment!.sleepQuality,
      energyLevel: s.selfAssessment!.energyLevel,
      soreCount: s.selfAssessment!.soreAreas.length,
    }));
}

function generateSuggestions(
  completionRate: number,
  avgDuration: number,
  assessmentTrend: AssessmentTrend[],
  currentBaseline: BaselineScores,
  previousBaseline: BaselineScores | null,
): string[] {
  const suggestions: string[] = [];

  if (completionRate < 50) {
    suggestions.push('本周完成率较低，建议适当减少训练天数或降低单次训练量，以保持训练持续性');
  } else if (completionRate < 70) {
    suggestions.push('训练完成率尚可，但仍有提升空间，建议调整训练时间安排，确保每周至少完成80%的训练计划');
  } else {
    suggestions.push('本周训练完成率良好，继续保持！');
  }

  if (avgDuration > 0 && avgDuration < 20) {
    suggestions.push('平均训练时长较短，建议适当增加训练量或延长组间休息，确保训练效果');
  }

  if (assessmentTrend.length >= 2) {
    const recent = assessmentTrend.slice(-2);
    if (recent[1].energyLevel < recent[0].energyLevel) {
      suggestions.push('近期精力水平呈下降趋势，建议增加休息日或减少训练强度');
    }
    if (recent[1].soreCount > recent[0].soreCount) {
      suggestions.push('酸痛区域增加，注意训练后的拉伸和恢复，避免过度训练');
    }
    const avgSleep = assessmentTrend.reduce((s, a) => s + a.sleepQuality, 0) / assessmentTrend.length;
    if (avgSleep < 4) {
      suggestions.push('本周平均睡眠质量较差，建议调整训练时间，避免晚间高强度训练影响睡眠');
    }
  }

  if (previousBaseline) {
    const improvements: string[] = [];
    const regressions: string[] = [];
    const keys = Object.keys(currentBaseline) as (keyof BaselineScores)[];
    for (const key of keys) {
      const diff = currentBaseline[key] - previousBaseline[key];
      if (diff > 0) improvements.push(key);
      if (diff < 0) regressions.push(key);
    }
    if (improvements.length > 0) {
      suggestions.push(`与上周相比，${improvements.join('、')}方面有所提升，继续保持当前训练节奏`);
    }
    if (regressions.length > 0) {
      suggestions.push(`${regressions.join('、')}方面出现退步，建议增加相关肌群的辅助训练`);
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('训练状态良好，保持当前计划即可');
  }

  return suggestions;
}

router.get('/:clientId/:week', async (req, res) => {
  try {
    const db = await getDb();
    const { clientId, week } = req.params;
    const { start, end } = getWeekDates(week);

    const client = db.data.clients.find((c) => c.id === clientId);
    if (!client) {
      res.status(404).json({ error: '客户不存在' });
      return;
    }

    const weekSessions = db.data.sessions.filter((s) => {
      const d = new Date(s.date);
      return s.clientId === clientId && d >= start && d <= end;
    });

    const plan = db.data.trainingPlans.find((p) => p.clientId === clientId);
    const plannedDays = plan ? plan.days.length : 0;

    const existingReport = db.data.weeklyReports.find(
      (r) => r.clientId === clientId && r.weekKey === week,
    );
    const previousBaseline: BaselineScores | null = existingReport
      ? existingReport.currentAssessment
      : null;

    const completionRate = computeCompletionRate(weekSessions, plannedDays);
    const avgDuration = computeAvgDuration(weekSessions);
    const totalCalories = computeTotalCalories(weekSessions, db.data.exercises);
    const progressCurves = buildProgressCurves(weekSessions, db.data.exercises);
    const assessmentTrend = buildAssessmentTrend(weekSessions);
    const suggestions = generateSuggestions(
      completionRate,
      avgDuration,
      assessmentTrend,
      client.baselineScores,
      previousBaseline,
    );

    const report: WeeklyReport = {
      id: existingReport?.id || uuidv4(),
      clientId,
      weekKey: week,
      completionRate,
      avgDuration,
      totalCalories,
      progressCurves,
      assessmentTrend,
      currentAssessment: client.baselineScores,
      previousAssessment: previousBaseline || { squat: 0, pushup: 0, plank: 0, flexibility: 0, endurance: 0 },
      suggestions,
      generatedAt: new Date().toISOString(),
    };

    const idx = db.data.weeklyReports.findIndex(
      (r) => r.clientId === clientId && r.weekKey === week,
    );
    if (idx >= 0) {
      db.data.weeklyReports[idx] = report;
    } else {
      db.data.weeklyReports.push(report);
    }
    await db.write();

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: '生成周报失败' });
  }
});

router.get('/:clientId/:week/export', async (req, res) => {
  try {
    const db = await getDb();
    const { clientId, week } = req.params;

    const report = db.data.weeklyReports.find(
      (r) => r.clientId === clientId && r.weekKey === week,
    );
    if (!report) {
      res.status(404).json({ error: '周报不存在，请先生成周报' });
      return;
    }

    const client = db.data.clients.find((c) => c.id === clientId);

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Weekly Training Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Client: ${client?.name || clientId}`, 20, 35);
    doc.text(`Week: ${week}`, 20, 45);
    doc.text(`Completion Rate: ${report.completionRate}%`, 20, 60);
    doc.text(`Avg Duration: ${report.avgDuration} min`, 20, 70);
    doc.text(`Total Calories: ${report.totalCalories} kcal`, 20, 80);

    let y = 100;
    doc.setFontSize(14);
    doc.text('Baseline Scores', 20, y);
    y += 10;
    doc.setFontSize(11);
    const baselineKeys = ['squat', 'pushup', 'plank', 'flexibility', 'endurance'] as const;
    for (const key of baselineKeys) {
      const curr = report.currentAssessment[key];
      const prev = report.previousAssessment[key];
      const diff = curr - prev;
      const diffStr = diff > 0 ? `(+${diff})` : diff < 0 ? `(${diff})` : '(0)';
      doc.text(`  ${key}: ${curr} vs prev ${prev} ${diffStr}`, 20, y);
      y += 8;
    }

    y += 5;
    doc.setFontSize(14);
    doc.text('Suggestions', 20, y);
    y += 10;
    doc.setFontSize(11);
    for (const s of report.suggestions) {
      const lines = doc.splitTextToSize(s, 170);
      for (const line of lines) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 7;
      }
      y += 3;
    }

    if (report.assessmentTrend.length > 0) {
      y += 5;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.text('Assessment Trend', 20, y);
      y += 10;
      doc.setFontSize(11);
      for (const t of report.assessmentTrend) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(
          `  ${t.date}: Sleep=${t.sleepQuality} Energy=${t.energyLevel} SoreAreas=${t.soreCount}`,
          20,
          y,
        );
        y += 8;
      }
    }

    if (report.progressCurves.length > 0) {
      y += 5;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.text('Progress Curves', 20, y);
      y += 10;
      doc.setFontSize(11);
      for (const curve of report.progressCurves) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`  ${curve.exerciseName}:`, 20, y);
        y += 7;
        for (const d of curve.data) {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`    ${d.day}: ${d.value} reps`, 25, y);
          y += 6;
        }
      }
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${clientId}-${week}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: '导出PDF失败' });
  }
});

export default router;
