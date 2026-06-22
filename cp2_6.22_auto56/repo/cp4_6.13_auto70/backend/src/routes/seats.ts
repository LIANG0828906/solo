import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authenticateToken, AuthRequest } from './auth';

const router = Router();

const updateReservationStatuses = () => {
  const now = new Date().toISOString();

  const pendingReservations = db
    .prepare('SELECT * FROM reservations WHERE status = ?')
    .all('pending') as any[];

  for (const reservation of pendingReservations) {
    const startTime = new Date(reservation.start_time);
    const endTime = new Date(reservation.end_time);
    const fifteenMinutesAfterStart = new Date(startTime.getTime() + 15 * 60 * 1000);
    const nowDate = new Date(now);

    if (nowDate >= startTime && nowDate < fifteenMinutesAfterStart) {
      db.prepare('UPDATE seats SET status = ? WHERE id = ?').run('occupied', reservation.seat_id);
      db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run('active', reservation.id);
    }

    if (nowDate >= fifteenMinutesAfterStart) {
      db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run('cancelled', reservation.id);
      const seat = db.prepare('SELECT status FROM seats WHERE id = ?').get(reservation.seat_id) as any;
      if (seat && seat.status === 'reserved') {
        db.prepare('UPDATE seats SET status = ?, current_user_id = NULL, occupied_at = NULL WHERE id = ?').run('available', reservation.seat_id);
      }
    }
  }

  const activeReservations = db
    .prepare('SELECT * FROM reservations WHERE status = ?')
    .all('active') as any[];

  for (const reservation of activeReservations) {
    const endTime = new Date(reservation.end_time);
    if (new Date(now) >= endTime) {
      db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run('completed', reservation.id);
      db.prepare(
        'UPDATE seats SET status = ?, current_user_id = NULL, occupied_at = NULL WHERE id = ?'
      ).run('available', reservation.seat_id);
    }
  }
};

router.get('/', authenticateToken, (req: AuthRequest, res: any) => {
  updateReservationStatuses();

  const { floor } = req.query;
  let query = 'SELECT * FROM seats';
  const params: any[] = [];

  if (floor) {
    query += ' WHERE floor = ?';
    params.push(Number(floor));
  }

  query += ' ORDER BY floor, seat_number';
  const seats = db.prepare(query).all(...params);

  const reservations = db
    .prepare('SELECT * FROM reservations WHERE user_id = ? AND status IN (?, ?)')
    .all(req.user!.id, 'pending', 'active') as any[];

  res.json({ seats, userReservations: reservations });
});

router.get('/all', authenticateToken, (req: AuthRequest, res: any) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }

  updateReservationStatuses();
  const seats = db.prepare('SELECT * FROM seats ORDER BY floor, seat_number').all();
  res.json({ seats });
});

router.post('/occupy', authenticateToken, (req: AuthRequest, res: any) => {
  const { seatId } = req.body;

  const seat = db.prepare('SELECT * FROM seats WHERE id = ?').get(seatId) as any;
  if (!seat) {
    return res.status(404).json({ error: '座位不存在' });
  }

  if (seat.status === 'occupied') {
    return res.status(400).json({ error: '座位已被占用' });
  }

  const now = new Date().toISOString();
  db.prepare(
    'UPDATE seats SET status = ?, current_user_id = ?, occupied_at = ? WHERE id = ?'
  ).run('occupied', req.user!.id, now, seatId);

  const updatedSeat = db.prepare('SELECT * FROM seats WHERE id = ?').get(seatId);
  res.json({ seat: updatedSeat });
});

router.post('/release', authenticateToken, (req: AuthRequest, res: any) => {
  const { seatId } = req.body;

  const seat = db.prepare('SELECT * FROM seats WHERE id = ?').get(seatId) as any;
  if (!seat) {
    return res.status(404).json({ error: '座位不存在' });
  }

  db.prepare(
    'UPDATE seats SET status = ?, current_user_id = NULL, occupied_at = NULL WHERE id = ?'
  ).run('available', seatId);

  const updatedSeat = db.prepare('SELECT * FROM seats WHERE id = ?').get(seatId);
  res.json({ seat: updatedSeat });
});

router.post('/reserve', authenticateToken, (req: AuthRequest, res: any) => {
  const { seatId, startTime, duration } = req.body;

  if (!seatId || !startTime || !duration) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const seat = db.prepare('SELECT * FROM seats WHERE id = ?').get(seatId) as any;
  if (!seat) {
    return res.status(404).json({ error: '座位不存在' });
  }

  const start = new Date(startTime);
  const now = new Date();
  const maxFuture = new Date();
  maxFuture.setDate(maxFuture.getDate() + 3);

  if (start < now) {
    return res.status(400).json({ error: '预约时间不能早于当前时间' });
  }

  if (start > maxFuture) {
    return res.status(400).json({ error: '最多只能提前3天预约' });
  }

  if (duration < 1 || duration > 4) {
    return res.status(400).json({ error: '预约时长必须在1-4小时之间' });
  }

  updateReservationStatuses();

  const currentReservations = db
    .prepare(
      "SELECT * FROM reservations WHERE seat_id = ? AND status IN ('pending', 'active')"
    )
    .all(seatId) as any[];

  const endTime = new Date(start.getTime() + duration * 60 * 60 * 1000);

  for (const reservation of currentReservations) {
    const resStart = new Date(reservation.start_time);
    const resEnd = new Date(reservation.end_time);
    if (start < resEnd && endTime > resStart) {
      return res.status(400).json({ error: '该时段已被预约' });
    }
  }

  const reservationId = uuidv4();
  db.prepare(
    'INSERT INTO reservations (id, user_id, seat_id, seat_number, floor, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    reservationId,
    req.user!.id,
    seatId,
    seat.seat_number,
    seat.floor,
    start.toISOString(),
    endTime.toISOString(),
    'pending'
  );

  db.prepare('UPDATE seats SET status = ? WHERE id = ?').run('reserved', seatId);

  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId);
  res.json({ reservation });
});

router.get('/reservations', authenticateToken, (req: AuthRequest, res: any) => {
  updateReservationStatuses();

  const reservations = db
    .prepare('SELECT * FROM reservations WHERE user_id = ? ORDER BY start_time DESC')
    .all(req.user!.id);

  res.json({ reservations });
});

router.get('/admin/users', authenticateToken, (req: AuthRequest, res: any) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }

  const users = db
    .prepare(`
      SELECT 
        u.id,
        u.username,
        u.nickname,
        u.role,
        COALESCE(SUM(s.duration), 0) as total_duration
      FROM users u
      LEFT JOIN sessions s ON u.id = s.user_id
      GROUP BY u.id
      ORDER BY total_duration DESC
    `)
    .all();

  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const usersWithWeekly = users.map((user: any) => {
    const weekly = db
      .prepare(
        'SELECT COALESCE(SUM(duration), 0) as weekly_duration FROM sessions WHERE user_id = ? AND start_time >= ?'
      )
      .get(user.id, startOfWeek.toISOString()) as any;
    return {
      ...user,
      weekly_duration: weekly.weekly_duration || 0
    };
  });

  res.json({ users: usersWithWeekly });
});

export { router as seatsRouter, updateReservationStatuses };
