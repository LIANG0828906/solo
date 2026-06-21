import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  EvaluationTask,
  EvaluationCycle,
  EvaluationDimension,
  EvaluationIndicator,
  Employee,
  EvaluationResult,
  HistoryRecord,
  ScoreSubmission,
} from '../shared/types';
import { calculate } from './scoreCalculator';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const employees: Employee[] = [
  { id: 'emp-1', name: '张三', email: 'zhangsan@company.com' },
  { id: 'emp-2', name: '李四', email: 'lisi@company.com' },
  { id: 'emp-3', name: '王五', email: 'wangwu@company.com' },
  { id: 'emp-4', name: '赵六', email: 'zhaoliu@company.com' },
];

const cycles: EvaluationCycle[] = [];
const tasks: EvaluationTask[] = [];
const results: EvaluationResult[] = [];

function createIndicators(
  dimensionId: string,
  names: string[],
  weights: number[],
  descriptions: string[]
): EvaluationIndicator[] {
  return names.map((name, idx) => ({
    id: uuidv4(),
    name,
    weight: weights[idx],
    description: descriptions[idx],
    dimensionId,
  }));
}

function createCycle(
  name: string,
  startDate: string,
  endDate: string,
  deadline: string
): EvaluationCycle {
  const dim1Id = uuidv4();
  const dim2Id = uuidv4();
  const dim3Id = uuidv4();

  const dimensions: EvaluationDimension[] = [
    {
      id: dim1Id,
      name: '工作成果',
      indicators: createIndicators(
        dim1Id,
        ['目标完成率', '工作质量', '工作效率'],
        [40, 35, 25],
        [
          '评估既定工作目标的完成情况，是否按时按质达成',
          '评估工作产出的质量水平，是否符合标准和要求',
          '评估工作的执行效率，是否合理利用时间和资源',
        ]
      ),
    },
    {
      id: dim2Id,
      name: '团队协作',
      indicators: createIndicators(
        dim2Id,
        ['沟通配合', '团队贡献', '知识分享'],
        [40, 35, 25],
        [
          '评估与同事之间的沟通协作是否顺畅有效',
          '评估对团队目标和项目的贡献程度',
          '评估是否主动分享经验和知识，帮助他人成长',
        ]
      ),
    },
    {
      id: dim3Id,
      name: '创新能力',
      indicators: createIndicators(
        dim3Id,
        ['问题解决', '改进建议', '学习能力'],
        [40, 30, 30],
        [
          '评估面对复杂问题时的分析和解决能力',
          '评估提出流程优化或创新方案的情况',
          '评估学习新知识、新技能的速度和应用效果',
        ]
      ),
    },
  ];

  return {
    id: uuidv4(),
    name,
    startDate,
    endDate,
    deadline,
    dimensions,
  };
}

function seedData() {
  const cycle1 = createCycle(
    '2024年上半年',
    '2024-01-01',
    '2024-06-30',
    '2024-07-15'
  );
  const cycle2 = createCycle(
    '2024年下半年',
    '2024-07-01',
    '2024-12-31',
    '2025-01-15'
  );
  cycles.push(cycle1, cycle2);

  employees.forEach((evaluator) => {
    employees
      .filter((e) => e.id !== evaluator.id)
      .forEach((evaluatee, idx) => {
        const cycle = idx % 2 === 0 ? cycle1 : cycle2;
        const isCompleted = idx % 3 === 0;
        const task: EvaluationTask = {
          id: uuidv4(),
          cycleId: cycle.id,
          cycleName: cycle.name,
          evaluatorId: evaluator.id,
          evaluatorName: evaluator.name,
          evaluateeId: evaluatee.id,
          evaluateeName: evaluatee.name,
          evaluateeEmail: evaluatee.email,
          deadline: cycle.deadline,
          dimensions: cycle.dimensions,
          status: isCompleted ? 'completed' : 'pending',
        };
        tasks.push(task);

        if (isCompleted) {
          const scores: Record<string, number> = {};
          cycle.dimensions.forEach((dim) => {
            dim.indicators.forEach((ind) => {
              scores[ind.id] = Math.floor(Math.random() * 3) + 3;
            });
          });
          const result = calculate({
            taskId: task.id,
            cycleId: cycle.id,
            cycleName: cycle.name,
            evaluateeId: evaluatee.id,
            evaluateeName: evaluatee.name,
            dimensions: cycle.dimensions,
            scores,
          });
          results.push(result);
        }
      });
  });
}

seedData();

app.get('/api/evaluations', (req, res) => {
  const employeeId = (req.query.employeeId as string) || 'emp-1';
  const status = req.query.status as string;

  let filteredTasks = tasks.filter((t) => t.evaluatorId === employeeId);

  if (status === 'pending') {
    filteredTasks = filteredTasks.filter((t) => t.status === 'pending');
  } else if (status === 'completed') {
    filteredTasks = filteredTasks.filter((t) => t.status === 'completed');
  }

  res.json(filteredTasks);
});

app.get('/api/evaluations/:id', (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: '评估任务不存在' });
  }
  res.json(task);
});

app.post('/api/evaluations/:id/score', (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: '评估任务不存在' });
  }

  const body = req.body as ScoreSubmission;
  const allIndicatorIds = task.dimensions.flatMap((d) =>
    d.indicators.map((i) => i.id)
  );

  const missingIds = allIndicatorIds.filter((id) => !body.scores[id]);
  if (missingIds.length > 0) {
    return res.status(400).json({
      error: '存在未评分的指标',
      missingIndicatorIds: missingIds,
    });
  }

  const invalidScores = Object.values(body.scores).filter(
    (s) => s < 1 || s > 5
  );
  if (invalidScores.length > 0) {
    return res
      .status(400)
      .json({ error: '分数必须在 1-5 分之间' });
  }

  const result = calculate({
    taskId: task.id,
    cycleId: task.cycleId,
    cycleName: task.cycleName,
    evaluateeId: task.evaluateeId,
    evaluateeName: task.evaluateeName,
    dimensions: task.dimensions,
    scores: body.scores,
  });

  const existingIdx = results.findIndex((r) => r.taskId === task.id);
  if (existingIdx >= 0) {
    results[existingIdx] = result;
  } else {
    results.push(result);
  }

  task.status = 'completed';
  task.submittedAt = result.submittedAt;

  res.json(result);
});

app.get('/api/history/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;
  const employeeResults = results.filter((r) => r.evaluateeId === employeeId);

  const history: HistoryRecord[] = employeeResults
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )
    .map((r) => ({
      id: r.taskId,
      cycleName: r.cycleName,
      submittedAt: r.submittedAt,
      totalScore: r.totalScore,
      dimensions: r.dimensions,
    }));

  res.json(history);
});

app.get('/api/employees', (_req, res) => {
  res.json(employees);
});

app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
  console.log(`当前员工: emp-1 (张三)`);
});
