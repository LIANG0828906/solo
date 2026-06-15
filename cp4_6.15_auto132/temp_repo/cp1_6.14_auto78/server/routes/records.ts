import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    const { bookId } = req.query;

    await db.read();
    let records = db.data?.readingRecords || [];

    if (bookId) {
      records = records.filter((r) => r.bookId === bookId);
    }

    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取阅读记录失败',
      error: (error as Error).message
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    const { bookId, date, startPage, endPage, duration, tags, notes } = req.body;

    if (!bookId || !date) {
      return res.status(400).json({
        success: false,
        message: '图书ID和日期不能为空'
      });
    }

    const newRecord = {
      id: uuidv4(),
      bookId,
      date,
      startPage: startPage || 0,
      endPage: endPage || 0,
      duration: duration || 0,
      tags: tags || [],
      notes: notes || ''
    };

    await db.read();
    if (!db.data) db.data = { books: [], readingRecords: [], goals: { dailyMinutes: 30, dailyPages: 20 } };
    db.data.readingRecords.push(newRecord);
    await db.write();

    res.status(201).json({
      success: true,
      data: newRecord,
      message: '阅读记录添加成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加阅读记录失败',
      error: (error as Error).message
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    const { id } = req.params;
    const { bookId, date, startPage, endPage, duration, tags, notes } = req.body;

    await db.read();
    if (!db.data) db.data = { books: [], readingRecords: [], goals: { dailyMinutes: 30, dailyPages: 20 } };
    const recordIndex = db.data.readingRecords.findIndex((r) => r.id === id);

    if (recordIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '阅读记录不存在'
      });
    }

    db.data.readingRecords[recordIndex] = {
      ...db.data.readingRecords[recordIndex],
      bookId: bookId !== undefined ? bookId : db.data.readingRecords[recordIndex].bookId,
      date: date !== undefined ? date : db.data.readingRecords[recordIndex].date,
      startPage: startPage !== undefined ? startPage : db.data.readingRecords[recordIndex].startPage,
      endPage: endPage !== undefined ? endPage : db.data.readingRecords[recordIndex].endPage,
      duration: duration !== undefined ? duration : db.data.readingRecords[recordIndex].duration,
      tags: tags !== undefined ? tags : db.data.readingRecords[recordIndex].tags,
      notes: notes !== undefined ? notes : db.data.readingRecords[recordIndex].notes
    };

    await db.write();

    res.json({
      success: true,
      data: db.data.readingRecords[recordIndex],
      message: '阅读记录更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新阅读记录失败',
      error: (error as Error).message
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    const { id } = req.params;

    await db.read();
    if (!db.data) db.data = { books: [], readingRecords: [], goals: { dailyMinutes: 30, dailyPages: 20 } };
    const recordIndex = db.data.readingRecords.findIndex((r) => r.id === id);

    if (recordIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '阅读记录不存在'
      });
    }

    db.data.readingRecords.splice(recordIndex, 1);
    await db.write();

    res.json({
      success: true,
      message: '阅读记录删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除阅读记录失败',
      error: (error as Error).message
    });
  }
});

export default router;
