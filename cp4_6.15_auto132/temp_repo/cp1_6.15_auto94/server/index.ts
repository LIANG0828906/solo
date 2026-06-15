import express, { type Request, type Response } from 'express';
import cors from 'cors';
import type {
  PlantBase,
  PlantConfig,
  StageMorphology,
  EvolutionGraph,
  GrowthActionRequest,
  GrowthActionResponse,
  PlantInfo,
  ApiResponse,
  GrowthStage
} from '../src/types.js';
import {
  queryPlants,
  queryPlantConfig,
  calculateStageMorphology,
  queryEvolutionGraph,
  simulateGrowth,
  queryPlantInfo
} from './data.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function wrapResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: Date.now()
  };
}

function wrapError(error: string): ApiResponse<never> {
  return {
    success: false,
    error,
    timestamp: Date.now()
  };
}

app.get('/api/plants', (_req: Request, res: Response<ApiResponse<PlantBase[]>>) => {
  try {
    const plants = queryPlants();
    res.json(wrapResponse(plants));
  } catch (e) {
    const err = e instanceof Error ? e.message : '未知错误';
    res.status(500).json(wrapError(`获取植物列表失败: ${err}`));
  }
});

app.get('/api/plants/:id', (req: Request<{ id: string }>, res: Response<ApiResponse<PlantConfig | null>>) => {
  try {
    const { id } = req.params;
    const config = queryPlantConfig(id);
    if (!config) {
      res.status(404).json(wrapError(`未找到植物: ${id}`));
      return;
    }
    res.json(wrapResponse(config));
  } catch (e) {
    const err = e instanceof Error ? e.message : '未知错误';
    res.status(500).json(wrapError(`获取植物配置失败: ${err}`));
  }
});

app.get(
  '/api/plants/:id/stage/:stage',
  (req: Request<{ id: string; stage: string }>, res: Response<ApiResponse<StageMorphology | null>>) => {
    try {
      const { id, stage } = req.params;
      const validStages: GrowthStage[] = ['sprout', 'unfolding', 'mature', 'spore'];
      if (!validStages.includes(stage as GrowthStage)) {
        res.status(400).json(wrapError(`无效的成长阶段: ${stage}`));
        return;
      }
      const morphology = calculateStageMorphology(id, stage as GrowthStage);
      if (!morphology) {
        res.status(404).json(wrapError(`未找到植物: ${id}`));
        return;
      }
      res.json(wrapResponse(morphology));
    } catch (e) {
      const err = e instanceof Error ? e.message : '未知错误';
      res.status(500).json(wrapError(`计算阶段形态失败: ${err}`));
    }
  }
);

app.get('/api/evolution', (_req: Request, res: Response<ApiResponse<EvolutionGraph>>) => {
  try {
    const graph = queryEvolutionGraph();
    res.json(wrapResponse(graph));
  } catch (e) {
    const err = e instanceof Error ? e.message : '未知错误';
    res.status(500).json(wrapError(`获取演化图失败: ${err}`));
  }
});

app.post(
  '/api/growth',
  (req: Request<Record<string, never>, ApiResponse<GrowthActionResponse | null>, GrowthActionRequest>, res: Response) => {
    try {
      const { plantId, fromStage, action } = req.body;
      if (!plantId || !fromStage || !action) {
        res.status(400).json(wrapError('缺少必要参数: plantId, fromStage, action'));
        return;
      }
      const validStages: GrowthStage[] = ['sprout', 'unfolding', 'mature', 'spore'];
      if (!validStages.includes(fromStage)) {
        res.status(400).json(wrapError(`无效的成长阶段: ${fromStage}`));
        return;
      }
      if (action !== 'grow' && action !== 'reset') {
        res.status(400).json(wrapError(`无效的操作: ${action}，应为 'grow' 或 'reset'`));
        return;
      }
      const result = simulateGrowth({ plantId, fromStage, action });
      if (!result) {
        res.status(404).json(wrapError(`未找到植物: ${plantId}`));
        return;
      }
      res.json(wrapResponse(result));
    } catch (e) {
      const err = e instanceof Error ? e.message : '未知错误';
      res.status(500).json(wrapError(`模拟成长失败: ${err}`));
    }
  }
);

app.get('/api/plants/:id/info', (req: Request<{ id: string }>, res: Response<ApiResponse<PlantInfo | null>>) => {
  try {
    const { id } = req.params;
    const info = queryPlantInfo(id);
    if (!info) {
      res.status(404).json(wrapError(`未找到植物: ${id}`));
      return;
    }
    res.json(wrapResponse(info));
  } catch (e) {
    const err = e instanceof Error ? e.message : '未知错误';
    res.status(500).json(wrapError(`获取植物信息失败: ${err}`));
  }
});

app.get('/api/plants/:id/config', (req: Request<{ id: string }>, res: Response<ApiResponse<PlantConfig | null>>) => {
  try {
    const { id } = req.params;
    const config = queryPlantConfig(id);
    if (!config) {
      res.status(404).json(wrapError(`未找到植物: ${id}`));
      return;
    }
    res.json(wrapResponse(config));
  } catch (e) {
    const err = e instanceof Error ? e.message : '未知错误';
    res.status(500).json(wrapError(`获取植物配置失败: ${err}`));
  }
});

app.get('/api/evolution/graph', (_req: Request, res: Response<ApiResponse<EvolutionGraph>>) => {
  try {
    const graph = queryEvolutionGraph();
    res.json(wrapResponse(graph));
  } catch (e) {
    const err = e instanceof Error ? e.message : '未知错误';
    res.status(500).json(wrapError(`获取演化图失败: ${err}`));
  }
});

app.post(
  '/api/growth/action',
  (req: Request<Record<string, never>, ApiResponse<GrowthActionResponse | null>, GrowthActionRequest>, res: Response) => {
    try {
      const { plantId, fromStage, action } = req.body;
      if (!plantId || !fromStage || !action) {
        res.status(400).json(wrapError('缺少必要参数: plantId, fromStage, action'));
        return;
      }
      const validStages: GrowthStage[] = ['sprout', 'unfolding', 'mature', 'spore'];
      if (!validStages.includes(fromStage)) {
        res.status(400).json(wrapError(`无效的成长阶段: ${fromStage}`));
        return;
      }
      if (action !== 'grow' && action !== 'reset') {
        res.status(400).json(wrapError(`无效的操作: ${action}，应为 'grow' 或 'reset'`));
        return;
      }
      const result = simulateGrowth({ plantId, fromStage, action });
      if (!result) {
        res.status(404).json(wrapError(`未找到植物: ${plantId}`));
        return;
      }
      res.json(wrapResponse(result));
    } catch (e) {
      const err = e instanceof Error ? e.message : '未知错误';
      res.status(500).json(wrapError(`模拟成长失败: ${err}`));
    }
  }
);

app.listen(PORT, () => {
  console.log(`蕨类植物演化模拟器后端服务已启动: http://localhost:${PORT}`);
});

export default app;
