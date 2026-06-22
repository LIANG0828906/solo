import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index';

const router = Router();

interface Tour {
  id: string;
  band_id: string;
  name: string;
  route_color: string;
  description?: string;
  created_at: string;
}

interface City {
  id: string;
  tour_id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  lat?: number;
  lng?: number;
  order_index: number;
  main_setlist_id?: string;
  encore_setlist_id?: string;
}

interface Attendance {
  id: string;
  city_id: string;
  member_id: string;
  status: string;
  note?: string;
  updated_at: string;
}

function success(res: Response, data: any = null, message: string = '操作成功') {
  res.json({ success: true, data, message });
}

function fail(res: Response, message: string = '操作失败', status: number = 400) {
  res.status(status).json({ success: false, data: null, message });
}

router.get('/', (_req: Request, res: Response) => {
  try {
    const tours = db.prepare('SELECT * FROM tours ORDER BY created_at DESC').all() as Tour[];
    success(res, tours);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(id) as Tour | undefined;
    if (!tour) return fail(res, '巡演不存在', 404);
    success(res, tour);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { band_id, name, route_color, description } = req.body;
    if (!band_id || !name) return fail(res, 'band_id和name为必填项');
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO tours (id, band_id, name, route_color, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, band_id, name, route_color || '#3498db', description || null);
    const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(id);
    success(res, tour, '巡演创建成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, route_color, description } = req.body;
    const existing = db.prepare('SELECT * FROM tours WHERE id = ?').get(id);
    if (!existing) return fail(res, '巡演不存在', 404);
    const stmt = db.prepare(`
      UPDATE tours SET name = ?, route_color = ?, description = ? WHERE id = ?
    `);
    stmt.run(
      name || (existing as Tour).name,
      route_color || (existing as Tour).route_color,
      description !== undefined ? description : (existing as Tour).description,
      id
    );
    const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(id);
    success(res, tour, '巡演更新成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM tours WHERE id = ?').get(id);
    if (!existing) return fail(res, '巡演不存在', 404);
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM attendance WHERE city_id IN (SELECT id FROM cities WHERE tour_id = ?)').run(id);
      db.prepare('DELETE FROM songs WHERE setlist_id IN (SELECT id FROM setlists WHERE tour_id = ?)').run(id);
      db.prepare('DELETE FROM setlists WHERE tour_id = ?').run(id);
      db.prepare('DELETE FROM cities WHERE tour_id = ?').run(id);
      db.prepare('DELETE FROM tours WHERE id = ?').run(id);
    });
    tx();
    success(res, null, '巡演删除成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.get('/:id/cities', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cities = db.prepare(`
      SELECT * FROM cities WHERE tour_id = ? ORDER BY order_index ASC, date ASC
    `).all(id) as City[];
    success(res, cities);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.post('/:id/cities', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, venue, date, time, lat, lng, order_index, main_setlist_id, encore_setlist_id } = req.body;
    if (!name || !venue || !date) return fail(res, 'name, venue, date为必填项');
    const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(id);
    if (!tour) return fail(res, '巡演不存在', 404);

    const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), -1) as max FROM cities WHERE tour_id = ?').get(id) as { max: number };
    const cityId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO cities (id, tour_id, name, venue, date, time, lat, lng, order_index, main_setlist_id, encore_setlist_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      cityId, id, name, venue, date, time || '20:00',
      lat || null, lng || null,
      order_index !== undefined ? order_index : maxOrder.max + 1,
      main_setlist_id || null, encore_setlist_id || null
    );

    const members = db.prepare('SELECT id FROM members').all() as { id: string }[];
    const attStmt = db.prepare('INSERT INTO attendance (id, city_id, member_id, status) VALUES (?, ?, ?, ?)');
    members.forEach(member => {
      attStmt.run(uuidv4(), cityId, member.id, '待定');
    });

    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId);
    success(res, city, '城市添加成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.put('/cities/:cityId', (req: Request, res: Response) => {
  try {
    const { cityId } = req.params;
    const { name, venue, date, time, lat, lng, order_index, main_setlist_id, encore_setlist_id } = req.body;
    const existing = db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId) as City | undefined;
    if (!existing) return fail(res, '城市不存在', 404);
    const stmt = db.prepare(`
      UPDATE cities SET
        name = ?, venue = ?, date = ?, time = ?, lat = ?, lng = ?,
        order_index = ?, main_setlist_id = ?, encore_setlist_id = ?
      WHERE id = ?
    `);
    stmt.run(
      name || existing.name,
      venue || existing.venue,
      date || existing.date,
      time || existing.time,
      lat !== undefined ? lat : existing.lat,
      lng !== undefined ? lng : existing.lng,
      order_index !== undefined ? order_index : existing.order_index,
      main_setlist_id !== undefined ? main_setlist_id : existing.main_setlist_id,
      encore_setlist_id !== undefined ? encore_setlist_id : existing.encore_setlist_id,
      cityId
    );
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId);
    success(res, city, '城市更新成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.delete('/cities/:cityId', (req: Request, res: Response) => {
  try {
    const { cityId } = req.params;
    const existing = db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId);
    if (!existing) return fail(res, '城市不存在', 404);
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM attendance WHERE city_id = ?').run(cityId);
      db.prepare('DELETE FROM cities WHERE id = ?').run(cityId);
    });
    tx();
    success(res, null, '城市删除成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.get('/cities/:cityId/attendance', (req: Request, res: Response) => {
  try {
    const { cityId } = req.params;
    const rows = db.prepare(`
      SELECT a.*, m.name as member_name, m.role as member_role, m.email as member_email
      FROM attendance a
      JOIN members m ON a.member_id = m.id
      WHERE a.city_id = ?
      ORDER BY m.name ASC
    `).all(cityId);
    success(res, rows);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.put('/cities/:cityId/attendance/:memberId', (req: Request, res: Response) => {
  try {
    const { cityId, memberId } = req.params;
    const { status, note } = req.body;
    const validStatus = ['确认出席', '可能缺席', '确认缺席', '待定'];
    if (status && !validStatus.includes(status)) {
      return fail(res, '无效的出席状态，可选值：确认出席、可能缺席、确认缺席、待定');
    }
    const existing = db.prepare('SELECT * FROM attendance WHERE city_id = ? AND member_id = ?').get(cityId, memberId) as Attendance | undefined;
    if (!existing) return fail(res, '出席记录不存在', 404);
    const stmt = db.prepare(`
      UPDATE attendance SET status = ?, note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE city_id = ? AND member_id = ?
    `);
    stmt.run(
      status || existing.status,
      note !== undefined ? note : existing.note,
      cityId, memberId
    );
    const row = db.prepare(`
      SELECT a.*, m.name as member_name, m.role as member_role
      FROM attendance a
      JOIN members m ON a.member_id = m.id
      WHERE a.city_id = ? AND a.member_id = ?
    `).get(cityId, memberId);
    success(res, row, '出席状态更新成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.get('/:id/attendance/summary', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = db.prepare(`
      SELECT
        c.id as city_id,
        c.name as city_name,
        c.date,
        c.venue,
        COUNT(DISTINCT a.member_id) as total_members,
        SUM(CASE WHEN a.status = '确认出席' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN a.status = '可能缺席' THEN 1 ELSE 0 END) as maybe,
        SUM(CASE WHEN a.status = '确认缺席' THEN 1 ELSE 0 END) as declined,
        SUM(CASE WHEN a.status = '待定' THEN 1 ELSE 0 END) as pending
      FROM cities c
      LEFT JOIN attendance a ON c.id = a.city_id
      WHERE c.tour_id = ?
      GROUP BY c.id
      ORDER BY c.order_index ASC
    `).all(id);
    success(res, rows);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

export default router;
