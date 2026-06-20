import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authenticateToken, AuthRequest } from './auth';

const router = Router();

router.post('/start', authenticateToken, (req: AuthRequest, res: any) => {
  const { seatId } = req.body;

  const existingSession = db
    .prepare('SELECT * FROM active_sessions WHERE user_id = ?')
    .get(req.user!.id);

  if (existingSession) {
    return res.status(400).json({ error: '您已有进行中的学习会话' });
  }

  const sessionId = uuidv4();
  const startTime = new Date().toISOString();

  db.prepare(
    'INSERT INTO sessions (id, user_id, seat_id, start_time) VALUES (?, ?, ?, ?)'
  ).run(sessionId, req.user!.id, seatId || null, startTime);

  db.prepare(
    'INSERT INTO active_sessions (user_id, session_id, seat_id, start_time) VALUES (?, ?, ?, ?)'
  ).run(req.user!.id, sessionId, seatId || null, startTime);

  res.json({
    session: {
      id: sessionId,
      startTime,
      seatId: seatId || null
    }
  });
});

router.post('/stop', authenticateToken, (req: AuthRequest, res: any) => {
  const activeSession = db
    .prepare('SELECT * FROM active_sessions WHERE user_id = ?')
    .get(req.user!.id) as any;

  if (!activeSession) {
    return res.status(400).json({ error: '没有进行中的学习会话' });
  }

  const endTime = new Date();
  const startTime = new Date(activeSession.start_time);
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

  db.prepare(
    'UPDATE sessions SET end_time = ?, duration = ? WHERE id = ?'
  ).run(endTime.toISOString(), duration, activeSession.session_id);

  db.prepare('DELETE FROM active_sessions WHERE user_id = ?').run(req.user!.id);

  const session = db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(activeSession.session_id);

  const totalDuration = db
    .prepare('SELECT COALESCE(SUM(duration), 0) as total FROM sessions WHERE user_id = ?')
    .get(req.user!.id) as any;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const nextDate = new Date(checkDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const daySession = db
      .prepare(
        'SELECT id FROM sessions WHERE user_id = ? AND start_time >= ? AND start_time < ? AND duration > 0'
      )
      .get(req.user!.id, checkDate.toISOString(), nextDate.toISOString());

    if (daySession) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const quotes = [
    '坚持就是胜利，你做得很棒！',
    '知识是最好的投资，继续加油！',
    '每一分钟的努力都在塑造更好的你！',
    '学习永无止境，今天的你又进步了！',
    '书山有路勤为径，学海无涯苦作舟。',
    '今天的汗水是明天的收获！',
    '保持专注，你就是最棒的！'
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  res.json({
    session,
    stats: {
      totalDuration: totalDuration.total,
      streak,
      quote: randomQuote
    }
  });
});

router.get('/active', authenticateToken, (req: AuthRequest, res: any) => {
  const activeSession = db
    .prepare('SELECT * FROM active_sessions WHERE user_id = ?')
    .get(req.user!.id);

  if (activeSession) {
    res.json({ active: true, session: activeSession });
  } else {
    res.json({ active: false, session: null });
  }
});

router.get('/stats', authenticateToken, (req: AuthRequest, res: any) => {
  const { period } = req.query;

  const totalDuration = db
    .prepare('SELECT COALESCE(SUM(duration), 0) as total FROM sessions WHERE user_id = ?')
    .get(req.user!.id) as any;

  const sessions = db
    .prepare(
      'SELECT * FROM sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT 100'
    )
    .all(req.user!.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySession = db
    .prepare(
      'SELECT COALESCE(SUM(duration), 0) as today FROM sessions WHERE user_id = ? AND start_time >= ?'
    )
    .get(req.user!.id, today.toISOString()) as any;

  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  const weeklyData = [];
  for (let i = 0; i < 7; i++) {
    const weekDay = new Date(startOfWeek);
    weekDay.setDate(weekDay.getDate() + i);
    const nextDay = new Date(weekDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayTotal = db
      .prepare(
        'SELECT COALESCE(SUM(duration), 0) as duration FROM sessions WHERE user_id = ? AND start_time >= ? AND start_time < ?'
      )
      .get(req.user!.id, weekDay.toISOString(), nextDay.toISOString()) as any;

    const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    weeklyData.push({
      day: dayNames[i],
      date: weekDay.toISOString().split('T')[0],
      duration: dayTotal.duration || 0
    });
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const nextDate = new Date(checkDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const daySession = db
      .prepare(
        'SELECT id FROM sessions WHERE user_id = ? AND start_time >= ? AND start_time < ? AND duration > 0'
      )
      .get(req.user!.id, checkDate.toISOString(), nextDate.toISOString());

    if (daySession) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const recentSessions = db
    .prepare(
      'SELECT * FROM sessions WHERE user_id = ? AND duration IS NOT NULL ORDER BY start_time DESC LIMIT 5'
    )
    .all(req.user!.id);

  const monthlyData = [];
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    const dayDate = new Date(today.getFullYear(), today.getMonth(), i);
    const nextDay = new Date(dayDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayTotal = db
      .prepare(
        'SELECT COALESCE(SUM(duration), 0) as duration FROM sessions WHERE user_id = ? AND start_time >= ? AND start_time < ?'
      )
      .get(req.user!.id, dayDate.toISOString(), nextDay.toISOString()) as any;

    monthlyData.push({
      date: dayDate.toISOString().split('T')[0],
      day: i,
      duration: dayTotal.duration || 0
    });
  }

  res.json({
    totalDuration: totalDuration.total || 0,
    todayDuration: todaySession.today || 0,
    streak,
    weeklyData,
    monthlyData,
    recentSessions,
    sessions
  });
});

export { router as sessionsRouter };
