import { Request, Response } from 'express';
import Mission from '../models/Mission';
import Escort from '../models/Escort';

export const getMissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    
    const query = userId ? { userId } : {};
    const missions = await Mission.find(query).sort({ createdAt: -1 });
    
    res.status(200).json(missions);
  } catch (error) {
    console.error('Get missions error:', error);
    res.status(500).json({ message: '获取镖单列表失败' });
  }
};

export const getMissionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mission = await Mission.findById(id);
    
    if (!mission) {
      res.status(404).json({ message: '镖单不存在' });
      return;
    }
    
    res.status(200).json(mission);
  } catch (error) {
    console.error('Get mission error:', error);
    res.status(500).json({ message: '获取镖单详情失败' });
  }
};

export const createMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, escorts, carts, route } = req.body;

    if (!userId || !escorts || !carts || !route) {
      res.status(400).json({ message: '缺少必要参数' });
      return;
    }

    if (escorts.length < 3 || escorts.length > 5) {
      res.status(400).json({ message: '镖师数量必须在3-5人之间' });
      return;
    }

    const totalCarts = carts.reduce((sum: number, c: { count: number }) => sum + c.count, 0);
    if (totalCarts < 1 || totalCarts > 2) {
      res.status(400).json({ message: '镖车数量必须在1-2辆之间' });
      return;
    }

    const mission = new Mission({
      userId,
      escorts,
      carts,
      route,
      startTime: new Date(),
      status: 'in-progress'
    });

    await mission.save();

    res.status(201).json(mission);
  } catch (error) {
    console.error('Create mission error:', error);
    res.status(500).json({ message: '创建镖单失败' });
  }
};

export const updateMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, banditEncounters, endTime } = req.body;

    const mission = await Mission.findById(id);
    if (!mission) {
      res.status(404).json({ message: '镖单不存在' });
      return;
    }

    if (status) {
      mission.status = status;
      
      if (status === 'success' || status === 'failed') {
        mission.endTime = endTime || new Date();
        
        for (const escortId of mission.escorts) {
          const escort = await Escort.findById(escortId);
          if (escort) {
            escort.completedMissions += 1;
            if (status === 'success') {
              escort.successfulMissions += 1;
              escort.experience += 10;
            }
            await escort.save();
          }
        }
      }
    }

    if (banditEncounters !== undefined) {
      mission.banditEncounters = banditEncounters;
    }

    await mission.save();
    res.status(200).json(mission);
  } catch (error) {
    console.error('Update mission error:', error);
    res.status(500).json({ message: '更新镖单失败' });
  }
};
