import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    await db.read();
    res.json({
      success: true,
      data: db.data?.goals || { dailyMinutes: 30, dailyPages: 20 }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取目标设置失败',
      error: (error as Error).message
    });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    const { dailyMinutes, dailyPages } = req.body;

    if (dailyMinutes === undefined && dailyPages === undefined) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个目标参数'
      });
    }

    if (dailyMinutes !== undefined && dailyMinutes < 0) {
      return res.status(400).json({
        success: false,
        message: '每日阅读时长不能小于0'
      });
    }

    if (dailyPages !== undefined && dailyPages < 0) {
      return res.status(400).json({
        success: false,
        message: '每日阅读页数不能小于0'
      });
    }

    await db.read();
    if (!db.data) db.data = { books: [], readingRecords: [], goals: { dailyMinutes: 30, dailyPages: 20 } };
    db.data.goals = {
      dailyMinutes: dailyMinutes !== undefined ? dailyMinutes : db.data.goals.dailyMinutes,
      dailyPages: dailyPages !== undefined ? dailyPages : db.data.goals.dailyPages
    };
    await db.write();

    res.json({
      success: true,
      data: db.data.goals,
      message: '目标设置更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新目标设置失败',
      error: (error as Error).message
    });
  }
});

export default router;
