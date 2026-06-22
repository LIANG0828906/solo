import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import nodemailer from 'nodemailer';

const router = Router();

const statusLabels: Record<string, string> = {
  pending_quote: '待报价',
  confirmed: '已确认',
  preparing: '备料中',
  in_progress: '制作中',
  quality_check: '待质检',
  completed: '已完成待取'
};

const sendStatusEmail = async (to: string, projectName: string, status: string) => {
  const statusText = statusLabels[status] || status;
  console.log(`发送邮件至 ${to}：项目状态已更新为 ${statusText}`);
};

router.get('/', (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM projects ORDER BY created_at DESC';
    let params: any[] = [];

    if (status) {
      sql = 'SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC';
      params.push(status);
    }

    const projects = db.prepare(sql).all(...params);
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    res.status(500).json({ success: false, message: '获取项目列表失败' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('获取项目详情失败:', error);
    res.status(500).json({ success: false, message: '获取项目详情失败' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const {
      project_type,
      customer_name,
      customer_email,
      customer_phone,
      design_images,
      wood_type,
      surface_finish,
      expected_date,
      description
    } = req.body;

    if (!project_type || !customer_name || !customer_email || !wood_type || !surface_finish || !expected_date) {
      return res.status(400).json({ success: false, message: '必填项不能为空' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO projects (
        id, project_type, customer_name, customer_email, customer_phone,
        design_images, wood_type, surface_finish, expected_date, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_quote')
    `;

    db.prepare(sql).run(
      id,
      project_type,
      customer_name,
      customer_email,
      customer_phone || null,
      design_images || null,
      wood_type,
      surface_finish,
      expected_date,
      description || null
    );

    const newProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: newProject, message: '项目提交成功，我们会尽快与您联系' });
  } catch (error) {
    console.error('创建项目失败:', error);
    res.status(500).json({ success: false, message: '创建项目失败' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending_quote', 'confirmed', 'preparing', 'in_progress', 'quality_check', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '无效的状态值' });
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const sql = 'UPDATE projects SET status = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?';
    db.prepare(sql).run(status, id);

    const updatedProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    try {
      await sendStatusEmail(project.customer_email, `${project.project_type}-${project.customer_name}`, status);
    } catch (emailError) {
      console.error('发送邮件失败:', emailError);
    }

    res.json({ success: true, data: updatedProject, message: `项目状态已更新为「${statusLabels[status]}」` });
  } catch (error) {
    console.error('更新项目状态失败:', error);
    res.status(500).json({ success: false, message: '更新项目状态失败' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    res.json({ success: true, message: '项目已删除' });
  } catch (error) {
    console.error('删除项目失败:', error);
    res.status(500).json({ success: false, message: '删除项目失败' });
  }
});

export default router;
