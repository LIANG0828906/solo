import { Request, Response } from 'express';
import MapNode from '../models/MapNode';

export const getMapNodes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const nodes = await MapNode.find();
    res.status(200).json(nodes);
  } catch (error) {
    console.error('Get map nodes error:', error);
    res.status(500).json({ message: '获取地图节点失败' });
  }
};

export const getDefaultRoute = async (_req: Request, res: Response): Promise<void> => {
  try {
    const nodes = await MapNode.find().sort({ x: 1 });
    const route = nodes.map(n => n._id.toString());
    res.status(200).json({ route, nodes });
  } catch (error) {
    console.error('Get default route error:', error);
    res.status(500).json({ message: '获取默认路线失败' });
  }
};
