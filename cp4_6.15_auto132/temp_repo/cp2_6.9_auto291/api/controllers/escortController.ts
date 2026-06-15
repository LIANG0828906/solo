import { Request, Response } from 'express';
import Escort from '../models/Escort';

export const getAllEscorts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const escorts = await Escort.find().sort({ completedMissions: -1, successfulMissions: -1 });
    res.status(200).json(escorts);
  } catch (error) {
    console.error('Get escorts error:', error);
    res.status(500).json({ message: '获取镖师列表失败' });
  }
};

export const getEscortById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const escort = await Escort.findById(id);
    
    if (!escort) {
      res.status(404).json({ message: '镖师不存在' });
      return;
    }
    
    res.status(200).json(escort);
  } catch (error) {
    console.error('Get escort error:', error);
    res.status(500).json({ message: '获取镖师信息失败' });
  }
};

export const getEscortRanking = async (_req: Request, res: Response): Promise<void> => {
  try {
    const escorts = await Escort.find()
      .sort({ completedMissions: -1, successfulMissions: -1, martialSkill: -1 })
      .limit(10);
    res.status(200).json(escorts);
  } catch (error) {
    console.error('Get escort ranking error:', error);
    res.status(500).json({ message: '获取镖师排行榜失败' });
  }
};
