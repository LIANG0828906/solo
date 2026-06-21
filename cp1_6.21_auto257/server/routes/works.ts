import { Router } from 'express';
import { store, calculateMaterialCost } from '../store/memoryStore';
import type { ApiResponse, Work } from '../types';

const worksRouter = Router();

worksRouter.get('/', (_req, res) => {
  try {
    const keyword = _req.query.keyword as string | undefined;
    const works = store.list(keyword);
    const response: ApiResponse<Work[]> = {
      code: 0,
      data: works.map((w) => ({
        ...w,
        materials: w.materials,
        images: w.images,
      })),
    };
    res.json(response);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    res.status(500).json({ code: 500, data: null, message });
  }
});

worksRouter.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const work = store.get(id);
    if (!work) {
      return res.status(404).json({ code: 404, data: null, message: '作品不存在' });
    }
    res.json({ code: 0, data: work } as ApiResponse<Work>);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    res.status(500).json({ code: 500, data: null, message });
  }
});

worksRouter.post('/', (req, res) => {
  try {
    const body = req.body as Partial<Work>;
    const work = store.create(body);
    res.status(201).json({ code: 0, data: work } as ApiResponse<Work>);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    res.status(500).json({ code: 500, data: null, message });
  }
});

worksRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as Partial<Work>;
    const updated = store.update(id, body);
    if (!updated) {
      return res.status(404).json({ code: 404, data: null, message: '作品不存在' });
    }
    res.json({ code: 0, data: updated } as ApiResponse<Work>);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    res.status(500).json({ code: 500, data: null, message });
  }
});

worksRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ok = store.delete(id);
    if (!ok) {
      return res.status(404).json({ code: 404, data: null, message: '作品不存在' });
    }
    res.json({ code: 0, data: { success: true }, message: '删除成功' } as ApiResponse<{ success: boolean }>);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    res.status(500).json({ code: 500, data: null, message });
  }
});

worksRouter.get('/:id/cost', (req, res) => {
  try {
    const { id } = req.params;
    const work = store.get(id);
    if (!work) {
      return res.status(404).json({ code: 404, data: null, message: '作品不存在' });
    }
    const cost = calculateMaterialCost(work.materials);
    res.json({
      code: 0,
      data: { cost, price: work.price, profit: work.price - cost },
    } as ApiResponse<{ cost: number; price: number; profit: number }>);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    res.status(500).json({ code: 500, data: null, message });
  }
});

export default worksRouter;
