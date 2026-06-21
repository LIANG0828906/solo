import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../db.js';
import type { Client } from '../../shared/types.js';

const router = Router();

function mapRowToClient(row: any[]): Client {
  return {
    id: row[0] as string,
    name: row[1] as string,
    email: row[2] as string,
    address: row[3] as string,
    createdAt: row[4] as string,
  };
}

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = db.exec('SELECT * FROM clients ORDER BY created_at DESC');
    const clients = result[0]?.values.map(mapRowToClient) || [];
    res.json({ success: true, data: clients });
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.status(500).json({ success: false, error: '获取客户列表失败' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const result = db.exec('SELECT * FROM clients WHERE id = ?', [id]);

    if (!result[0]?.values.length) {
      return res.status(404).json({ success: false, error: '客户不存在' });
    }

    const client = mapRowToClient(result[0].values[0]);
    res.json({ success: true, data: client });
  } catch (error) {
    console.error('获取客户详情失败:', error);
    res.status(500).json({ success: false, error: '获取客户详情失败' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, email, address } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: '客户名称不能为空' });
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    db.run(
      'INSERT INTO clients (id, name, email, address, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, email || '', address || '', createdAt]
    );
    saveDatabase();

    const client: Client = {
      id,
      name,
      email: email || '',
      address: address || '',
      createdAt,
    };

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('创建客户失败:', error);
    res.status(500).json({ success: false, error: '创建客户失败' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, email, address } = req.body;

    const existing = db.exec('SELECT * FROM clients WHERE id = ?', [id]);
    if (!existing[0]?.values.length) {
      return res.status(404).json({ success: false, error: '客户不存在' });
    }

    db.run(
      `UPDATE clients SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        address = COALESCE(?, address)
       WHERE id = ?`,
      [name || null, email !== undefined ? email : null, address !== undefined ? address : null, id]
    );
    saveDatabase();

    const result = db.exec('SELECT * FROM clients WHERE id = ?', [id]);
    const client = mapRowToClient(result[0].values[0]);

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('更新客户失败:', error);
    res.status(500).json({ success: false, error: '更新客户失败' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.exec('SELECT * FROM clients WHERE id = ?', [id]);
    if (!existing[0]?.values.length) {
      return res.status(404).json({ success: false, error: '客户不存在' });
    }

    db.run('DELETE FROM clients WHERE id = ?', [id]);
    saveDatabase();

    res.json({ success: true });
  } catch (error) {
    console.error('删除客户失败:', error);
    res.status(500).json({ success: false, error: '删除客户失败' });
  }
});

export default router;
