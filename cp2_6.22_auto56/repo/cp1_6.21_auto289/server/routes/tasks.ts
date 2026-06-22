import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../db.js';
import type { Task, TimerState, SummaryResponse, TaskSummary, TaskGroup } from '../../shared/types.js';

const router = Router();

function mapRowToTask(row: any[]): Task {
  return {
    id: row[0] as string,
    name: row[1] as string,
    clientId: row[2] as string | null,
    clientName: row[6] as string | undefined,
    startTime: row[3] as string,
    endTime: row[4] as string | null,
    duration: row[5] as number,
    createdAt: row[7] as string,
  };
}

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { clientId, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT t.*, c.name as client_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
    `;
    const params: any[] = [];

    if (clientId) {
      query += ' WHERE t.client_id = ?';
      params.push(clientId);
    }

    query += ' ORDER BY t.start_time DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const result = db.exec(query, params);
    const tasks = result[0]?.values.map(mapRowToTask) || [];

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({ success: false, error: '获取任务列表失败' });
  }
});

router.get('/summary', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { startDate, endDate, clientId } = req.query;

    let query = `
      SELECT t.*, c.name as client_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.end_time IS NOT NULL
    `;
    const params: any[] = [];

    if (startDate) {
      query += ' AND t.start_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.start_time <= ?';
      params.push(endDate);
    }
    if (clientId) {
      query += ' AND t.client_id = ?';
      params.push(clientId);
    }

    query += ' ORDER BY t.start_time ASC';

    const result = db.exec(query, params);
    const tasks: Task[] = result[0]?.values.map(mapRowToTask) || [];

    const dailyMap = new Map<string, number>();
    const taskGroupMap = new Map<string, TaskGroup>();
    let totalSeconds = 0;

    for (const task of tasks) {
      const date = task.startTime.split('T')[0];
      const duration = task.duration;
      totalSeconds += duration;

      dailyMap.set(date, (dailyMap.get(date) || 0) + duration);

      const key = `${task.name}-${task.clientId || 'no-client'}`;
      const existing = taskGroupMap.get(key);
      if (existing) {
        existing.totalDuration += duration;
        existing.count += 1;
      } else {
        taskGroupMap.set(key, {
          taskName: task.name,
          clientName: task.clientName || null,
          clientId: task.clientId,
          totalDuration: duration,
          count: 1,
        });
      }
    }

    const dailySummary: TaskSummary[] = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, seconds]) => ({
        date,
        totalHours: Math.round((seconds / 3600) * 100) / 100,
      }));

    const taskGroups: TaskGroup[] = Array.from(taskGroupMap.values())
      .sort((a, b) => b.totalDuration - a.totalDuration);

    const response: SummaryResponse = {
      dailySummary,
      taskGroups,
      totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
    };

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('获取汇总数据失败:', error);
    res.status(500).json({ success: false, error: '获取汇总数据失败' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, clientId, startTime, endTime } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({ success: false, error: '缺少必填字段' });
    }

    const id = uuidv4();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const duration = Math.floor((end - start) / 1000);

    if (duration <= 0) {
      return res.status(400).json({ success: false, error: '结束时间必须晚于开始时间' });
    }

    db.run(
      'INSERT INTO tasks (id, name, client_id, start_time, end_time, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, clientId || null, startTime, endTime, duration]
    );
    saveDatabase();

    const result = db.exec(
      `SELECT t.*, c.name as client_name
       FROM tasks t
       LEFT JOIN clients c ON t.client_id = c.id
       WHERE t.id = ?`,
      [id]
    );
    const task = mapRowToTask(result[0].values[0]);

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ success: false, error: '创建任务失败' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, clientId, startTime, endTime } = req.body;

    const existing = db.exec('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing[0]?.values.length) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    let duration = existing[0].values[0][5] as number;
    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      duration = Math.floor((end - start) / 1000);
    }

    db.run(
      `UPDATE tasks SET 
        name = COALESCE(?, name),
        client_id = COALESCE(?, client_id),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        duration = ?
       WHERE id = ?`,
      [name || null, clientId !== undefined ? clientId : null, startTime || null, endTime || null, duration, id]
    );
    saveDatabase();

    const result = db.exec(
      `SELECT t.*, c.name as client_name
       FROM tasks t
       LEFT JOIN clients c ON t.client_id = c.id
       WHERE t.id = ?`,
      [id]
    );
    const task = mapRowToTask(result[0].values[0]);

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({ success: false, error: '更新任务失败' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.exec('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing[0]?.values.length) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    db.run('DELETE FROM tasks WHERE id = ?', [id]);
    saveDatabase();

    res.json({ success: true });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ success: false, error: '删除任务失败' });
  }
});

router.get('/timer-state', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = db.exec('SELECT * FROM timer_state WHERE id = 1');

    if (!result[0]?.values.length) {
      return res.status(404).json({ success: false, error: '计时器状态不存在' });
    }

    const row = result[0].values[0];
    const state: TimerState = {
      isRunning: row[1] === 1,
      currentTask: row[2] || '',
      clientId: row[3] || null,
      startTime: row[4] || null,
      accumulatedTime: row[5] || 0,
    };

    res.json({ success: true, data: state });
  } catch (error) {
    console.error('获取计时器状态失败:', error);
    res.status(500).json({ success: false, error: '获取计时器状态失败' });
  }
});

router.post('/start', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { taskName, clientId } = req.body;

    if (!taskName) {
      return res.status(400).json({ success: false, error: '任务名称不能为空' });
    }

    const startTime = new Date().toISOString();

    db.run(
      `UPDATE timer_state 
       SET is_running = 1, current_task = ?, client_id = ?, start_time = ?, accumulated_time = 0
       WHERE id = 1`,
      [taskName, clientId || null, startTime]
    );
    saveDatabase();

    const state: TimerState = {
      isRunning: true,
      currentTask: taskName,
      clientId: clientId || null,
      startTime,
      accumulatedTime: 0,
    };

    res.json({ success: true, data: state });
  } catch (error) {
    console.error('启动计时器失败:', error);
    res.status(500).json({ success: false, error: '启动计时器失败' });
  }
});

router.post('/stop', (req: Request, res: Response) => {
  try {
    const db = getDb();

    const stateResult = db.exec('SELECT * FROM timer_state WHERE id = 1');
    if (!stateResult[0]?.values.length) {
      return res.status(404).json({ success: false, error: '计时器状态不存在' });
    }

    const stateRow = stateResult[0].values[0];
    const isRunning = stateRow[1] === 1;
    const currentTask = stateRow[2] || '';
    const clientId = stateRow[3] || null;
    const startTime = stateRow[4];

    if (!isRunning || !startTime) {
      return res.status(400).json({ success: false, error: '计时器未在运行' });
    }

    const endTime = new Date().toISOString();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const duration = Math.floor((end - start) / 1000);

    if (duration < 1) {
      db.run(
        `UPDATE timer_state SET is_running = 0, current_task = '', client_id = NULL, start_time = NULL, accumulated_time = 0 WHERE id = 1`
      );
      saveDatabase();
      return res.json({ success: true, data: null });
    }

    const taskId = uuidv4();
    db.run(
      'INSERT INTO tasks (id, name, client_id, start_time, end_time, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [taskId, currentTask, clientId, startTime, endTime, duration]
    );

    db.run(
      `UPDATE timer_state SET is_running = 0, current_task = '', client_id = NULL, start_time = NULL, accumulated_time = 0 WHERE id = 1`
    );
    saveDatabase();

    const taskResult = db.exec(
      `SELECT t.*, c.name as client_name
       FROM tasks t
       LEFT JOIN clients c ON t.client_id = c.id
       WHERE t.id = ?`,
      [taskId]
    );
    const task = mapRowToTask(taskResult[0].values[0]);

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('停止计时器失败:', error);
    res.status(500).json({ success: false, error: '停止计时器失败' });
  }
});

export default router;
