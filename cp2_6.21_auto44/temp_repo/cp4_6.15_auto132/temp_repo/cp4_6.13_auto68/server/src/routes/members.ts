import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index';

const router = Router();

interface Member {
  id: string;
  band_id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: string;
}

interface MemberSchedule {
  id: string;
  member_id: string;
  date: string;
  type: string;
  title: string;
  description?: string;
}

function success(res: Response, data: any = null, message: string = '操作成功') {
  res.json({ success: true, data, message });
}

function fail(res: Response, message: string = '操作失败', status: number = 400) {
  res.status(status).json({ success: false, data: null, message });
}

router.get('/', (_req: Request, res: Response) => {
  try {
    const members = db.prepare('SELECT * FROM members ORDER BY name ASC').all() as Member[];
    success(res, members);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member | undefined;
    if (!member) return fail(res, '成员不存在', 404);
    success(res, member);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { band_id, name, email, role, avatar, status } = req.body;
    if (!band_id || !name || !email || !role) {
      return fail(res, 'band_id, name, email, role为必填项');
    }
    const emailExists = db.prepare('SELECT id FROM members WHERE email = ?').get(email);
    if (emailExists) return fail(res, '该邮箱已被使用');
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO members (id, band_id, name, email, role, avatar, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, band_id, name, email, role, avatar || null, status || 'active');
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);

    const cities = db.prepare('SELECT id FROM cities').all() as { id: string }[];
    const attStmt = db.prepare('INSERT INTO attendance (id, city_id, member_id, status) VALUES (?, ?, ?, ?)');
    cities.forEach(city => {
      const existing = db.prepare('SELECT id FROM attendance WHERE city_id = ? AND member_id = ?').get(city.id, id);
      if (!existing) {
        attStmt.run(uuidv4(), city.id, id, '待定');
      }
    });

    success(res, member, '成员创建成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, avatar, status } = req.body;
    const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member | undefined;
    if (!existing) return fail(res, '成员不存在', 404);
    if (email && email !== existing.email) {
      const emailExists = db.prepare('SELECT id FROM members WHERE email = ? AND id != ?').get(email, id);
      if (emailExists) return fail(res, '该邮箱已被使用');
    }
    const stmt = db.prepare(`
      UPDATE members SET name = ?, email = ?, role = ?, avatar = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(
      name || existing.name,
      email || existing.email,
      role || existing.role,
      avatar !== undefined ? avatar : existing.avatar,
      status || existing.status,
      id
    );
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    success(res, member, '成员更新成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    if (!existing) return fail(res, '成员不存在', 404);
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM attendance WHERE member_id = ?').run(id);
      db.prepare('DELETE FROM member_schedules WHERE member_id = ?').run(id);
      db.prepare('DELETE FROM members WHERE id = ?').run(id);
    });
    tx();
    success(res, null, '成员删除成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.post('/invite', (req: Request, res: Response) => {
  try {
    const { band_id, name, email, role } = req.body;
    if (!band_id || !name || !email || !role) {
      return fail(res, 'band_id, name, email, role为必填项');
    }
    const emailExists = db.prepare('SELECT id FROM members WHERE email = ?').get(email);
    if (emailExists) return fail(res, '该邮箱已被邀请或已加入');
    const id = uuidv4();
    const inviteToken = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO members (id, band_id, name, email, role, avatar, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, band_id, name, email, role, null, 'invited');
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);

    const cities = db.prepare('SELECT id FROM cities').all() as { id: string }[];
    const attStmt = db.prepare('INSERT INTO attendance (id, city_id, member_id, status) VALUES (?, ?, ?, ?)');
    cities.forEach(city => {
      attStmt.run(uuidv4(), city.id, id, '待定');
    });

    success(res, {
      ...(member as object),
      invite_token: inviteToken,
      invite_url: `http://localhost:3001/api/members/accept?token=${inviteToken}&email=${encodeURIComponent(email)}`,
    }, '邀请发送成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.get('/accept', (req: Request, res: Response) => {
  try {
    const { token, email } = req.query;
    if (!token || !email) return fail(res, 'token和email为必填参数');
    const member = db.prepare('SELECT * FROM members WHERE email = ?').get(email as string) as Member | undefined;
    if (!member) return fail(res, '邀请不存在', 404);
    db.prepare("UPDATE members SET status = 'active' WHERE email = ?").run(email as string);
    const updated = db.prepare('SELECT * FROM members WHERE email = ?').get(email as string);
    success(res, updated, '邀请已接受，成员已激活');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.get('/:id/attendance', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    if (!member) return fail(res, '成员不存在', 404);
    const rows = db.prepare(`
      SELECT a.*, c.name as city_name, c.date, c.venue, c.time, t.name as tour_name
      FROM attendance a
      JOIN cities c ON a.city_id = c.id
      JOIN tours t ON c.tour_id = t.id
      WHERE a.member_id = ?
      ORDER BY c.date ASC
    `).all(id);
    success(res, rows);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.get('/:id/schedules', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    if (!member) return fail(res, '成员不存在', 404);

    let query = 'SELECT * FROM member_schedules WHERE member_id = ?';
    const params: any[] = [id];
    if (start_date) {
      query += ' AND date >= ?';
      params.push(start_date as string);
    }
    if (end_date) {
      query += ' AND date <= ?';
      params.push(end_date as string);
    }
    query += ' ORDER BY date ASC';

    const schedules = db.prepare(query).all(...params);
    success(res, schedules);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.post('/:id/schedules', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, type, title, description } = req.body;
    if (!date || !type || !title) {
      return fail(res, 'date, type, title为必填项');
    }
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    if (!member) return fail(res, '成员不存在', 404);
    const validTypes = ['排练', '录音', '演出', '休息', '商务', '其他'];
    if (!validTypes.includes(type)) {
      return fail(res, '无效的排期类型，可选值：排练, 录音, 演出, 休息, 商务, 其他');
    }
    const scheduleId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO member_schedules (id, member_id, date, type, title, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(scheduleId, id, date, type, title, description || null);
    const schedule = db.prepare('SELECT * FROM member_schedules WHERE id = ?').get(scheduleId);
    success(res, schedule, '排期创建成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.put('/schedules/:scheduleId', (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { date, type, title, description } = req.body;
    const existing = db.prepare('SELECT * FROM member_schedules WHERE id = ?').get(scheduleId) as MemberSchedule | undefined;
    if (!existing) return fail(res, '排期不存在', 404);
    const stmt = db.prepare(`
      UPDATE member_schedules SET date = ?, type = ?, title = ?, description = ?
      WHERE id = ?
    `);
    stmt.run(
      date || existing.date,
      type || existing.type,
      title || existing.title,
      description !== undefined ? description : existing.description,
      scheduleId
    );
    const schedule = db.prepare('SELECT * FROM member_schedules WHERE id = ?').get(scheduleId);
    success(res, schedule, '排期更新成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.delete('/schedules/:scheduleId', (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const existing = db.prepare('SELECT * FROM member_schedules WHERE id = ?').get(scheduleId);
    if (!existing) return fail(res, '排期不存在', 404);
    db.prepare('DELETE FROM member_schedules WHERE id = ?').run(scheduleId);
    success(res, null, '排期删除成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.get('/schedules/all', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT ms.*, m.name as member_name, m.role as member_role
      FROM member_schedules ms
      JOIN members m ON ms.member_id = m.id
      ORDER BY ms.date ASC
    `).all();
    success(res, rows);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

export default router;
