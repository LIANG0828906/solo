import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index';

const router = Router();

interface Setlist {
  id: string;
  tour_id: string;
  name: string;
  type: string;
  created_at: string;
}

interface Song {
  id: string;
  setlist_id: string;
  title: string;
  artist?: string;
  duration_sec: number;
  order_index: number;
  notes?: string;
}

function success(res: Response, data: any = null, message: string = '操作成功') {
  res.json({ success: true, data, message });
}

function fail(res: Response, message: string = '操作失败', status: number = 400) {
  res.status(status).json({ success: false, data: null, message });
}

router.get('/setlists', (req: Request, res: Response) => {
  try {
    const { tour_id } = req.query;
    let setlists: Setlist[];
    if (tour_id) {
      setlists = db.prepare('SELECT * FROM setlists WHERE tour_id = ? ORDER BY created_at DESC').all(tour_id as string) as Setlist[];
    } else {
      setlists = db.prepare('SELECT * FROM setlists ORDER BY created_at DESC').all() as Setlist[];
    }
    success(res, setlists);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.get('/setlists/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const setlist = db.prepare('SELECT * FROM setlists WHERE id = ?').get(id) as Setlist | undefined;
    if (!setlist) return fail(res, '歌单不存在', 404);
    const songs = db.prepare('SELECT * FROM songs WHERE setlist_id = ? ORDER BY order_index ASC').all(id) as Song[];
    success(res, { ...setlist, songs });
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.post('/setlists', (req: Request, res: Response) => {
  try {
    const { tour_id, name, type } = req.body;
    if (!tour_id || !name) return fail(res, 'tour_id和name为必填项');
    const validTypes = ['main', 'encore', 'soundcheck', 'rehearsal', 'custom'];
    const listType = type || 'main';
    if (!validTypes.includes(listType)) {
      return fail(res, '无效的歌单类型，可选值：main, encore, soundcheck, rehearsal, custom');
    }
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO setlists (id, tour_id, name, type) VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, tour_id, name, listType);
    const setlist = db.prepare('SELECT * FROM setlists WHERE id = ?').get(id);
    success(res, setlist, '歌单创建成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.put('/setlists/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    const existing = db.prepare('SELECT * FROM setlists WHERE id = ?').get(id) as Setlist | undefined;
    if (!existing) return fail(res, '歌单不存在', 404);
    const stmt = db.prepare('UPDATE setlists SET name = ?, type = ? WHERE id = ?');
    stmt.run(name || existing.name, type || existing.type, id);
    const setlist = db.prepare('SELECT * FROM setlists WHERE id = ?').get(id);
    success(res, setlist, '歌单更新成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.delete('/setlists/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM setlists WHERE id = ?').get(id);
    if (!existing) return fail(res, '歌单不存在', 404);
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM songs WHERE setlist_id = ?').run(id);
      db.prepare('UPDATE cities SET main_setlist_id = NULL WHERE main_setlist_id = ?').run(id);
      db.prepare('UPDATE cities SET encore_setlist_id = NULL WHERE encore_setlist_id = ?').run(id);
      db.prepare('DELETE FROM setlists WHERE id = ?').run(id);
    });
    tx();
    success(res, null, '歌单删除成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.get('/setlists/:id/songs', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const setlist = db.prepare('SELECT * FROM setlists WHERE id = ?').get(id);
    if (!setlist) return fail(res, '歌单不存在', 404);
    const songs = db.prepare('SELECT * FROM songs WHERE setlist_id = ? ORDER BY order_index ASC').all(id);
    success(res, songs);
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.post('/setlists/:id/songs', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, artist, duration_sec, order_index, notes } = req.body;
    if (!title) return fail(res, 'title为必填项');
    const setlist = db.prepare('SELECT * FROM setlists WHERE id = ?').get(id);
    if (!setlist) return fail(res, '歌单不存在', 404);
    const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), -1) as max FROM songs WHERE setlist_id = ?').get(id) as { max: number };
    const songId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO songs (id, setlist_id, title, artist, duration_sec, order_index, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      songId, id, title, artist || null,
      duration_sec || 0,
      order_index !== undefined ? order_index : maxOrder.max + 1,
      notes || null
    );
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId);
    success(res, song, '歌曲添加成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.put('/songs/:songId', (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const { title, artist, duration_sec, order_index, notes } = req.body;
    const existing = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId) as Song | undefined;
    if (!existing) return fail(res, '歌曲不存在', 404);
    const stmt = db.prepare(`
      UPDATE songs SET title = ?, artist = ?, duration_sec = ?, order_index = ?, notes = ?
      WHERE id = ?
    `);
    stmt.run(
      title || existing.title,
      artist !== undefined ? artist : existing.artist,
      duration_sec !== undefined ? duration_sec : existing.duration_sec,
      order_index !== undefined ? order_index : existing.order_index,
      notes !== undefined ? notes : existing.notes,
      songId
    );
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId);
    success(res, song, '歌曲更新成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.delete('/songs/:songId', (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const existing = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId);
    if (!existing) return fail(res, '歌曲不存在', 404);
    db.prepare('DELETE FROM songs WHERE id = ?').run(songId);
    success(res, null, '歌曲删除成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.put('/setlists/:id/songs/reorder', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0) {
      return fail(res, 'order必须为非空数组');
    }
    const setlist = db.prepare('SELECT * FROM setlists WHERE id = ?').get(id);
    if (!setlist) return fail(res, '歌单不存在', 404);

    const existingSongs = db.prepare('SELECT id FROM songs WHERE setlist_id = ?').all(id) as { id: string }[];
    const existingIds = new Set(existingSongs.map(s => s.id));
    for (const item of order) {
      if (!item.id || typeof item.order_index !== 'number') {
        return fail(res, '每个元素必须包含id和order_index字段');
      }
      if (!existingIds.has(item.id)) {
        return fail(res, `歌曲${item.id}不属于该歌单`);
      }
    }

    const tx = db.transaction(() => {
      const updateStmt = db.prepare('UPDATE songs SET order_index = ? WHERE id = ?');
      for (const item of order) {
        updateStmt.run(item.order_index, item.id);
      }
    });
    tx();

    const songs = db.prepare('SELECT * FROM songs WHERE setlist_id = ? ORDER BY order_index ASC').all(id);
    success(res, songs, '歌曲排序成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

router.post('/setlists/:id/songs/batch', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { songs } = req.body;
    if (!Array.isArray(songs) || songs.length === 0) {
      return fail(res, 'songs必须为非空数组');
    }
    const setlist = db.prepare('SELECT * FROM setlists WHERE id = ?').get(id);
    if (!setlist) return fail(res, '歌单不存在', 404);

    const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), -1) as max FROM songs WHERE setlist_id = ?').get(id) as { max: number };
    let currentOrder = maxOrder.max + 1;

    const tx = db.transaction(() => {
      const insertStmt = db.prepare(`
        INSERT INTO songs (id, setlist_id, title, artist, duration_sec, order_index, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const song of songs) {
        if (!song.title) continue;
        insertStmt.run(
          uuidv4(), id, song.title, song.artist || null,
          song.duration_sec || 0,
          song.order_index !== undefined ? song.order_index : currentOrder++,
          song.notes || null
        );
      }
    });
    tx();

    const resultSongs = db.prepare('SELECT * FROM songs WHERE setlist_id = ? ORDER BY order_index ASC').all(id);
    success(res, resultSongs, '批量添加歌曲成功');
  } catch (err: any) {
    fail(res, err.message, 500);
  }
});

export default router;
