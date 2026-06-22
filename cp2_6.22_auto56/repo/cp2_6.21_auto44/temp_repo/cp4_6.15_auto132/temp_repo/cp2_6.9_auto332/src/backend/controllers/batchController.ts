import { Router, Request, Response } from 'express';
import { BatchService } from '../services/batchService.js';
import { ProductionBatch, ApiResponse, FlourType, QualityGrade } from '../types/index.js';

const router = Router();

let batchService: BatchService;

export const setBatchService = (service: BatchService) => {
  batchService = service;
};

router.get('/batches', async (req: Request, res: Response<ApiResponse<ProductionBatch[]>>) => {
  try {
    const batches = await batchService.getAllBatches();
    res.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取批次列表失败',
    });
  }
});

router.get('/batches/:id', async (req: Request<{ id: string }>, res: Response<ApiResponse<ProductionBatch | null>>) => {
  try {
    const batch = await batchService.getBatchById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: '批次不存在',
      });
    }
    res.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取批次详情失败',
    });
  }
});

router.post('/batches', async (req: Request<{}, {}, Omit<ProductionBatch, 'id' | 'timestamp'>>, res: Response<ApiResponse<ProductionBatch>>) => {
  try {
    const batch = await batchService.createBatch(req.body);
    res.status(201).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建批次失败',
    });
  }
});

router.put('/batches/:id', async (req: Request<{ id: string }, {}, Partial<ProductionBatch>>, res: Response<ApiResponse<ProductionBatch | null>>) => {
  try {
    const batch = await batchService.updateBatch(req.params.id, req.body);
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: '批次不存在',
      });
    }
    res.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新批次失败',
    });
  }
});

router.delete('/batches/:id', async (req: Request<{ id: string }>, res: Response<ApiResponse<boolean>>) => {
  try {
    const deleted = await batchService.deleteBatch(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: '批次不存在',
      });
    }
    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除批次失败',
    });
  }
});

router.get('/statistics', async (req: Request, res: Response<ApiResponse<{
  totalWeight: number;
  countByType: Record<FlourType, number>;
  countByGrade: Record<QualityGrade, number>;
}>>) => {
  try {
    const statistics = await batchService.getStatistics();
    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取统计数据失败',
    });
  }
});

export { router };
