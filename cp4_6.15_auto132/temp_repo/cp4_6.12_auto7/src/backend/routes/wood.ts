import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { low_stock } = req.query;
    let sql = 'SELECT * FROM wood ORDER BY name ASC';
    let params: any[] = [];

    if (low_stock === 'true') {
      sql = 'SELECT * FROM wood WHERE stock_count < 5 ORDER BY stock_count ASC';
    }

    const woodList = db.prepare(sql).all(...params);
    res.json({ success: true, data: woodList });
  } catch (error) {
    console.error('获取木料库存失败:', error);
    res.status(500).json({ success: false, message: '获取木料库存失败' });
  }
});

router.get('/low-stock', (req: Request, res: Response) => {
  try {
    const woodList = db.prepare(
      'SELECT * FROM wood WHERE stock_count < 5 ORDER BY stock_count ASC'
    ).all();
    res.json({ success: true, data: woodList });
  } catch (error) {
    console.error('获取低库存木料失败:', error);
    res.status(500).json({ success: false, message: '获取低库存木料失败' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const wood = db.prepare('SELECT * FROM wood WHERE id = ?').get(id);

    if (!wood) {
      return res.status(404).json({ success: false, message: '木料不存在' });
    }

    res.json({ success: true, data: wood });
  } catch (error) {
    console.error('获取木料详情失败:', error);
    res.status(500).json({ success: false, message: '获取木料详情失败' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, origin, grade, stock_count, standard_size, unit_price, stock_date } = req.body;

    if (!name || !origin || !grade || !standard_size || unit_price === undefined) {
      return res.status(400).json({ success: false, message: '必填项不能为空' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO wood (id, name, origin, grade, stock_count, standard_size, unit_price, stock_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.prepare(sql).run(
      id,
      name,
      origin,
      grade,
      stock_count || 0,
      standard_size,
      unit_price,
      stock_date || new Date().toISOString().split('T')[0]
    );

    const newWood = db.prepare('SELECT * FROM wood WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: newWood, message: '木料入库成功' });
  } catch (error) {
    console.error('添加入库木料失败:', error);
    res.status(500).json({ success: false, message: '添加入库木料失败' });
  }
});

router.patch('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, origin, grade, stock_count, standard_size, unit_price } = req.body;

    const wood = db.prepare('SELECT * FROM wood WHERE id = ?').get(id) as any;
    if (!wood) {
      return res.status(404).json({ success: false, message: '木料不存在' });
    }

    const sql = `
      UPDATE wood 
      SET name = ?, origin = ?, grade = ?, stock_count = ?, standard_size = ?, unit_price = ?
      WHERE id = ?
    `;

    db.prepare(sql).run(
      name || wood.name,
      origin || wood.origin,
      grade || wood.grade,
      stock_count !== undefined ? stock_count : wood.stock_count,
      standard_size || wood.standard_size,
      unit_price !== undefined ? unit_price : wood.unit_price,
      id
    );

    const updatedWood = db.prepare('SELECT * FROM wood WHERE id = ?').get(id);
    res.json({ success: true, data: updatedWood, message: '木料信息更新成功' });
  } catch (error) {
    console.error('更新木料信息失败:', error);
    res.status(500).json({ success: false, message: '更新木料信息失败' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM wood WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '木料不存在' });
    }

    res.json({ success: true, message: '木料已删除' });
  } catch (error) {
    console.error('删除木料失败:', error);
    res.status(500).json({ success: false, message: '删除木料失败' });
  }
});

export default router;
