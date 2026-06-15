import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = Router();

const calculateNextMaintenance = (lastDate: string, cycleMonths: number): string => {
  const date = new Date(lastDate);
  date.setMonth(date.getMonth() + cycleMonths);
  return date.toISOString().split('T')[0];
};

const calculateDaysUntilMaintenance = (nextDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(nextDate);
  next.setHours(0, 0, 0, 0);
  const diffTime = next.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

router.get('/', (req: Request, res: Response) => {
  try {
    const tools = db.prepare('SELECT * FROM tools ORDER BY name ASC').all() as any[];

    const toolsWithInfo = tools.map(tool => {
      const nextMaintenance = calculateNextMaintenance(tool.last_maintenance_date, tool.maintenance_cycle_months);
      const daysUntil = calculateDaysUntilMaintenance(nextMaintenance);
      return {
        ...tool,
        next_maintenance_date: nextMaintenance,
        days_until_maintenance: daysUntil,
        is_overdue: daysUntil < 0
      };
    });

    res.json({ success: true, data: toolsWithInfo });
  } catch (error) {
    console.error('获取工具列表失败:', error);
    res.status(500).json({ success: false, message: '获取工具列表失败' });
  }
});

router.get('/overdue', (req: Request, res: Response) => {
  try {
    const tools = db.prepare('SELECT * FROM tools ORDER BY name ASC').all() as any[];

    const overdueTools = tools
      .map(tool => {
        const nextMaintenance = calculateNextMaintenance(tool.last_maintenance_date, tool.maintenance_cycle_months);
        const daysUntil = calculateDaysUntilMaintenance(nextMaintenance);
        return {
          ...tool,
          next_maintenance_date: nextMaintenance,
          days_until_maintenance: daysUntil,
          is_overdue: daysUntil < 0,
          overdue_days: daysUntil < 0 ? Math.abs(daysUntil) : 0
        };
      })
      .filter(tool => tool.is_overdue)
      .sort((a, b) => b.overdue_days - a.overdue_days);

    res.json({ success: true, data: overdueTools });
  } catch (error) {
    console.error('获取超期工具失败:', error);
    res.status(500).json({ success: false, message: '获取超期工具失败' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(id) as any;

    if (!tool) {
      return res.status(404).json({ success: false, message: '工具不存在' });
    }

    const nextMaintenance = calculateNextMaintenance(tool.last_maintenance_date, tool.maintenance_cycle_months);
    const daysUntil = calculateDaysUntilMaintenance(nextMaintenance);

    const maintenanceRecords = db.prepare(
      'SELECT * FROM maintenance_records WHERE tool_id = ? ORDER BY maintenance_date DESC'
    ).all(id);

    res.json({
      success: true,
      data: {
        ...tool,
        next_maintenance_date: nextMaintenance,
        days_until_maintenance: daysUntil,
        is_overdue: daysUntil < 0,
        maintenance_records: maintenanceRecords
      }
    });
  } catch (error) {
    console.error('获取工具详情失败:', error);
    res.status(500).json({ success: false, message: '获取工具详情失败' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, model, purchase_date, last_maintenance_date, maintenance_cycle_months } = req.body;

    if (!name || !model || !purchase_date || !last_maintenance_date || !maintenance_cycle_months) {
      return res.status(400).json({ success: false, message: '必填项不能为空' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO tools (id, name, model, purchase_date, last_maintenance_date, maintenance_cycle_months)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.prepare(sql).run(
      id,
      name,
      model,
      purchase_date,
      last_maintenance_date,
      maintenance_cycle_months
    );

    const newTool = db.prepare('SELECT * FROM tools WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: newTool, message: '工具添加成功' });
  } catch (error) {
    console.error('添加工具失败:', error);
    res.status(500).json({ success: false, message: '添加工具失败' });
  }
});

router.post('/:id/maintenance', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { maintenance_date, description, cost } = req.body;

    const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(id);
    if (!tool) {
      return res.status(404).json({ success: false, message: '工具不存在' });
    }

    const recordId = uuidv4();
    const recordSql = `
      INSERT INTO maintenance_records (id, tool_id, maintenance_date, description, cost)
      VALUES (?, ?, ?, ?, ?)
    `;

    const actualDate = maintenance_date || new Date().toISOString().split('T')[0];

    db.prepare(recordSql).run(
      recordId,
      id,
      actualDate,
      description || null,
      cost || null
    );

    db.prepare(
      'UPDATE tools SET last_maintenance_date = ? WHERE id = ?'
    ).run(actualDate, id);

    const updatedTool = db.prepare('SELECT * FROM tools WHERE id = ?').get(id) as any;
    const nextMaintenance = calculateNextMaintenance(updatedTool.last_maintenance_date, updatedTool.maintenance_cycle_months);
    const daysUntil = calculateDaysUntilMaintenance(nextMaintenance);

    const newRecord = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(recordId);

    res.json({
      success: true,
      data: {
        tool: {
          ...updatedTool,
          next_maintenance_date: nextMaintenance,
          days_until_maintenance: daysUntil,
          is_overdue: daysUntil < 0
        },
        record: newRecord
      },
      message: '维护记录已保存'
    });
  } catch (error) {
    console.error('记录维护失败:', error);
    res.status(500).json({ success: false, message: '记录维护失败' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM tools WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '工具不存在' });
    }

    res.json({ success: true, message: '工具已删除' });
  } catch (error) {
    console.error('删除工具失败:', error);
    res.status(500).json({ success: false, message: '删除工具失败' });
  }
});

export default router;
