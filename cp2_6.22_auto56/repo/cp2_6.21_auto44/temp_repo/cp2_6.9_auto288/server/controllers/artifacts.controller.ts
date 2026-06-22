import type { Request, Response } from 'express';
import { artifactsService } from '../services/artifacts.service';

export const artifactsController = {
  create: (req: Request, res: Response): void => {
    try {
      const artifact = artifactsService.create(req.body);
      res.json({ artifact });
    } catch (error) {
      res.status(500).json({ error: '创建器物失败' });
    }
  },
  
  getById: (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const artifact = artifactsService.getById(id);
      
      if (!artifact) {
        res.status(404).json({ error: '器物不存在' });
        return;
      }
      
      res.json({ artifact });
    } catch (error) {
      res.status(500).json({ error: '获取器物失败' });
    }
  },
  
  getByUserId: (req: Request, res: Response): void => {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        res.status(400).json({ error: '缺少用户ID' });
        return;
      }
      
      const artifacts = artifactsService.getByUserId(userId);
      res.json({ artifacts });
    } catch (error) {
      res.status(500).json({ error: '获取器物列表失败' });
    }
  },
  
  update: (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const artifact = artifactsService.update(id, req.body);
      
      if (!artifact) {
        res.status(404).json({ error: '器物不存在' });
        return;
      }
      
      res.json({ artifact });
    } catch (error) {
      res.status(500).json({ error: '更新器物失败' });
    }
  },
  
  delete: (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const success = artifactsService.delete(id);
      
      if (!success) {
        res.status(404).json({ error: '器物不存在' });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: '删除器物失败' });
    }
  },
};
