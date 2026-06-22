import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    await db.read();
    res.json({
      success: true,
      data: db.data?.books || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取图书列表失败',
      error: (error as Error).message
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    const { id } = req.params;
    await db.read();
    const book = db.data?.books.find((b) => b.id === id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '图书不存在'
      });
    }
    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取图书信息失败',
      error: (error as Error).message
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    const { title, author, coverImage, totalPages, currentPage } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: '书名和作者不能为空'
      });
    }

    const newBook = {
      id: uuidv4(),
      title,
      author,
      coverImage: coverImage || '',
      totalPages: totalPages || 0,
      currentPage: currentPage || 0,
      createdAt: new Date().toISOString()
    };

    await db.read();
    if (!db.data) db.data = { books: [], readingRecords: [], goals: { dailyMinutes: 30, dailyPages: 20 } };
    db.data.books.push(newBook);
    await db.write();

    res.status(201).json({
      success: true,
      data: newBook,
      message: '图书添加成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加图书失败',
      error: (error as Error).message
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    const { id } = req.params;
    const { title, author, coverImage, totalPages, currentPage } = req.body;

    await db.read();
    if (!db.data) db.data = { books: [], readingRecords: [], goals: { dailyMinutes: 30, dailyPages: 20 } };
    const bookIndex = db.data.books.findIndex((b) => b.id === id);

    if (bookIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '图书不存在'
      });
    }

    db.data.books[bookIndex] = {
      ...db.data.books[bookIndex],
      title: title !== undefined ? title : db.data.books[bookIndex].title,
      author: author !== undefined ? author : db.data.books[bookIndex].author,
      coverImage: coverImage !== undefined ? coverImage : db.data.books[bookIndex].coverImage,
      totalPages: totalPages !== undefined ? totalPages : db.data.books[bookIndex].totalPages,
      currentPage: currentPage !== undefined ? currentPage : db.data.books[bookIndex].currentPage
    };

    await db.write();

    res.json({
      success: true,
      data: db.data.books[bookIndex],
      message: '图书更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新图书失败',
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
    const bookIndex = db.data.books.findIndex((b) => b.id === id);

    if (bookIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '图书不存在'
      });
    }

    db.data.books.splice(bookIndex, 1);
    await db.write();

    res.json({
      success: true,
      message: '图书删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除图书失败',
      error: (error as Error).message
    });
  }
});

router.put('/:id/progress', async (req: Request, res: Response) => {
  try {
    const { db } = req;
    const { id } = req.params;
    const { currentPage } = req.body;

    if (currentPage === undefined || currentPage < 0) {
      return res.status(400).json({
        success: false,
        message: '当前页数不能为空且不能小于0'
      });
    }

    await db.read();
    if (!db.data) db.data = { books: [], readingRecords: [], goals: { dailyMinutes: 30, dailyPages: 20 } };
    const bookIndex = db.data.books.findIndex((b) => b.id === id);

    if (bookIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '图书不存在'
      });
    }

    db.data.books[bookIndex].currentPage = currentPage;
    await db.write();

    res.json({
      success: true,
      data: db.data.books[bookIndex],
      message: '阅读进度更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新阅读进度失败',
      error: (error as Error).message
    });
  }
});

export default router;
