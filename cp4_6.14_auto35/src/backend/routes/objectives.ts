import { Router, Request, Response } from 'express';
import {
  getAllObjectives,
  getObjectiveById,
  createObjective,
  updateObjective,
  deleteObjective,
  addCheckIn
} from '../data';
import type { CreateObjectiveRequest, UpdateObjectiveRequest, CheckInRequest, ApiResponse, Objective } from '../../types';

const router = Router();

router.get('/', (req: Request, res: Response<ApiResponse<Objective[]>>) => {
  try {
    const objectives = getAllObjectives();
    res.json({ success: true, data: objectives });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取目标列表失败' });
  }
});

router.get('/:id', (req: Request<{ id: string }>, res: Response<ApiResponse<Objective>>) => {
  try {
    const { id } = req.params;
    const objective = getObjectiveById(id);
    if (!objective) {
      return res.status(404).json({ success: false, error: '目标不存在' });
    }
    res.json({ success: true, data: objective });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取目标详情失败' });
  }
});

router.post('/', (req: Request<unknown, unknown, CreateObjectiveRequest>, res: Response<ApiResponse<Objective>>) => {
  try {
    const { title, description, owner, quarter, year, keyResults } = req.body;
    
    if (!title || !description || !owner || !quarter || !year || !keyResults) {
      return res.status(400).json({ success: false, error: '缺少必填字段' });
    }
    
    if (keyResults.length < 2 || keyResults.length > 5) {
      return res.status(400).json({ success: false, error: '关键结果数量必须在2-5个之间' });
    }
    
    for (const kr of keyResults) {
      if (!kr.title || kr.targetValue === undefined || kr.targetValue <= 0) {
        return res.status(400).json({ success: false, error: '关键结果信息不完整' });
      }
      if (kr.confidence < 1 || kr.confidence > 5) {
        return res.status(400).json({ success: false, error: '置信度必须在1-5之间' });
      }
    }
    
    const newObjective = createObjective(req.body);
    res.status(201).json({ success: true, data: newObjective });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建目标失败' });
  }
});

router.put('/:id', (req: Request<{ id: string }, unknown, UpdateObjectiveRequest>, res: Response<ApiResponse<Objective>>) => {
  try {
    const { id } = req.params;
    const updated = updateObjective(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: '目标不存在' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新目标失败' });
  }
});

router.delete('/:id', (req: Request<{ id: string }>, res: Response<ApiResponse<void>>) => {
  try {
    const { id } = req.params;
    const deleted = deleteObjective(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: '目标不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除目标失败' });
  }
});

router.patch('/:id/checkin', (req: Request<{ id: string }, unknown, CheckInRequest>, res: Response<ApiResponse<Objective>>) => {
  try {
    const { id } = req.params;
    const { keyResultId, percentComplete, note, updatedBy } = req.body;
    
    if (!keyResultId || percentComplete === undefined || !updatedBy) {
      return res.status(400).json({ success: false, error: '缺少必填字段' });
    }
    
    if (percentComplete < 0 || percentComplete > 100) {
      return res.status(400).json({ success: false, error: '完成百分比必须在0-100之间' });
    }
    
    const updated = addCheckIn(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: '目标或关键结果不存在' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新进度失败' });
  }
});

export default router;
