import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const users = [
  {
    id: 'user-001',
    name: '张三',
    email: 'zhangsan@example.com',
    role: 'reader',
    avatar: null,
    phone: '13800138001',
    borrowCount: 12,
    maxBorrow: 5,
  },
  {
    id: 'user-002',
    name: '李四',
    email: 'lisi@example.com',
    role: 'reader',
    avatar: null,
    phone: '13800138002',
    borrowCount: 5,
    maxBorrow: 5,
  },
  {
    id: 'admin-001',
    name: '王管理员',
    email: 'admin@library.com',
    role: 'admin',
    avatar: null,
    phone: '13900139000',
    borrowCount: 0,
    maxBorrow: 10,
  },
];

let books = [];

const initBooks = () => {
  const categories = ['文学小说', '科学技术', '历史传记', '经济管理', '艺术设计', '儿童读物', '哲学思想', '生活百科'];
  const bookData = [
    { title: '百年孤独', author: '加西亚·马尔克斯', category: '文学小说', isbn: '978-7-5442-6998-1', description: '马孔多小镇布恩迪亚家族七代人的传奇故事，魔幻现实主义文学的代表作，讲述了一个家族在时间长河中的兴衰荣辱。' },
    { title: '三体', author: '刘慈欣', category: '科学技术', isbn: '978-7-5366-9293-0', description: '地球文明与三体文明的宇宙博弈，中国科幻文学的里程碑之作，展现了宏大的宇宙观和深刻的人性思考。' },
    { title: '人类简史', author: '尤瓦尔·赫拉利', category: '历史传记', isbn: '978-7-5086-4455-5', description: '从认知革命到生物工程，重新审视人类的发展历程，以独特视角讲述人类从石器时代到21世纪的演化史。' },
    { title: '穷查理宝典', author: '彼得·考夫曼', category: '经济管理', isbn: '978-7-5086-3290-4', description: '查理·芒格的智慧箴言与投资哲学，收录了芒格最精华的思想和投资策略，是投资者的必读之作。' },
    { title: '设计心理学', author: '唐纳德·诺曼', category: '艺术设计', isbn: '978-7-5086-4833-1', description: '以人为本的设计理念与实践案例，揭示了日常物品设计背后的心理学原理，指导设计师创造更易用的产品。' },
    { title: '小王子', author: '安托万·德·圣-埃克苏佩里', category: '儿童读物', isbn: '978-7-02-004249-4', description: '一个来自B-612星球的小王子的星际旅行，一本写给所有大人的童话，关于爱、责任和成长的永恒寓言。' },
    { title: '苏菲的世界', author: '乔斯坦·贾德', category: '哲学思想', isbn: '978-7-5063-9390-5', description: '通过少女苏菲的视角开启西方哲学之旅，一部深入浅出的哲学史著作，让哲学变得生动有趣。' },
    { title: '中国居民膳食指南', author: '中国营养学会', category: '生活百科', isbn: '978-7-117-22310-2', description: '科学合理的饮食建议与营养搭配，为中国居民提供权威的膳食指导，帮助人们建立健康的饮食习惯。' },
    { title: '活着', author: '余华', category: '文学小说', isbn: '978-7-5063-6543-7', description: '福贵一生的苦难与坚韧，讲述了一个人和他的命运之间的友情，是一部关于生命意义的深刻作品。' },
    { title: '深度学习', author: 'Ian Goodfellow', category: '科学技术', isbn: '978-7-115-46182-2', description: '深度学习领域的经典教材，由三位顶尖专家撰写，全面涵盖深度学习的理论基础与实践应用。' },
    { title: '明朝那些事儿', author: '当年明月', category: '历史传记', isbn: '978-7-213-04862-4', description: '用幽默笔触讲述明朝三百年风云变幻，让历史变得鲜活有趣，是近年来最受欢迎的通俗历史读物。' },
    { title: '原则', author: '瑞·达利欧', category: '经济管理', isbn: '978-7-5086-8380-5', description: '桥水基金创始人的生活与工作原则，分享了达利欧多年来总结的决策方法和管理智慧。' },
    { title: '写给大家看的设计书', author: 'Robin Williams', category: '艺术设计', isbn: '978-7-115-39598-6', description: '设计入门必读，四大基本原则让设计变得简单，用通俗易懂的语言讲解设计的核心原理。' },
    { title: '夏洛的网', author: 'E.B.怀特', category: '儿童读物', isbn: '978-7-5327-4248-6', description: '小猪威尔伯与蜘蛛夏洛的真挚友谊，一个关于生命、友情和牺牲的动人故事，感动了无数读者。' },
    { title: '被讨厌的勇气', author: '岸见一郎', category: '哲学思想', isbn: '978-7-111-49516-2', description: '阿德勒心理学的通俗解读，教你获得真正的自由，探讨了如何在复杂的人际关系中保持自我。' },
    { title: '跑步圣经', author: '赫尔伯特·史迪凡尼', category: '生活百科', isbn: '978-7-5304-7531-7', description: '全面系统的跑步训练指南，从入门到马拉松，涵盖跑步技巧、训练计划、营养建议等方方面面。' },
    { title: '红楼梦', author: '曹雪芹', category: '文学小说', isbn: '978-7-02-000220-3', description: '贾宝玉与林黛玉的爱情悲剧，贾府的兴衰荣辱，中国古典文学的巅峰之作，被誉为封建社会的百科全书。' },
    { title: '黑客与画家', author: '保罗·格雷厄姆', category: '科学技术', isbn: '978-7-115-25790-1', description: '来自硅谷创业之父的智慧箴言，探讨了黑客文化、创业精神和技术创新，启发了无数创业者。' },
    { title: '万历十五年', author: '黄仁宇', category: '历史传记', isbn: '978-7-108-00982-1', description: '大历史观下的明朝切片分析，通过1587年这一平凡年份，揭示了明朝衰败的深层原因。' },
    { title: '从0到1', author: '彼得·蒂尔', category: '经济管理', isbn: '978-7-5086-5258-0', description: '硅谷创投教父的创业秘籍，讲述了如何通过创新实现从0到1的突破，打造垄断性企业。' },
  ];

  books = bookData.map((book, index) => ({
    id: `book-${String(index + 1).padStart(3, '0')}`,
    ...book,
    status: index % 4 === 0 ? 'borrowed' : 'available',
    totalCopies: Math.floor(Math.random() * 5) + 1,
    availableCopies: index % 4 === 0 ? 0 : Math.floor(Math.random() * 3) + 1,
    publishYear: 2015 + Math.floor(Math.random() * 10),
    pages: 200 + Math.floor(Math.random() * 500),
    coverColor: `hsl(${index * 15}, 60%, 40%)`,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

initBooks();

const getBookById = (id) => books.find(b => b.id === id);

const generateInitialRecords = () => {
  const now = new Date();
  return [
    {
      id: 'record-001',
      userId: 'user-001',
      bookId: 'book-001',
      type: 'borrowed',
      status: 'borrowed',
      renewCount: 1,
      reservedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      borrowedAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      returnedAt: null,
      bookSnapshot: { ...getBookById('book-001') },
    },
    {
      id: 'record-002',
      userId: 'user-001',
      bookId: 'book-003',
      type: 'borrowed',
      status: 'borrowed',
      renewCount: 0,
      reservedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      borrowedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      returnedAt: null,
      bookSnapshot: { ...getBookById('book-003') },
    },
    {
      id: 'record-003',
      userId: 'user-001',
      bookId: 'book-005',
      type: 'reserved',
      status: 'reserved',
      renewCount: 0,
      reservedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      borrowedAt: null,
      dueDate: null,
      returnedAt: null,
      bookSnapshot: { ...getBookById('book-005') },
    },
    {
      id: 'record-004',
      userId: 'user-001',
      bookId: 'book-007',
      type: 'borrowed',
      status: 'returned',
      renewCount: 0,
      reservedAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      borrowedAt: new Date(now.getTime() - 48 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      returnedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      bookSnapshot: { ...getBookById('book-007') },
    },
    {
      id: 'record-005',
      userId: 'user-002',
      bookId: 'book-002',
      type: 'borrowed',
      status: 'borrowed',
      renewCount: 0,
      reservedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      borrowedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      returnedAt: null,
      bookSnapshot: { ...getBookById('book-002') },
    },
  ];
};

let lendingRecords = generateInitialRecords();

router.post('/login', (req, res) => {
  try {
    const { userId } = req.body;
    const user = users.find(u => u.id === userId) || users[0];

    const userRecords = lendingRecords.filter(r => r.userId === user.id);

    res.json({
      success: true,
      data: {
        user,
        records: userRecords.sort((a, b) => new Date(b.reservedAt) - new Date(a.reservedAt)),
      },
      message: '登录成功',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '登录失败', error: error.message });
  }
});

router.get('/users/:id/records', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    let userRecords = lendingRecords.filter(r => r.userId === id);

    if (status) {
      userRecords = userRecords.filter(r => r.status === status);
    }

    userRecords.sort((a, b) => new Date(b.reservedAt) - new Date(a.reservedAt));

    res.json({
      success: true,
      data: userRecords,
      total: userRecords.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取借阅记录失败', error: error.message });
  }
});

router.post('/reserve', (req, res) => {
  try {
    const { userId, bookId } = req.body;

    if (!userId || !bookId) {
      return res.status(400).json({ success: false, message: '用户ID和图书ID为必填项' });
    }

    const book = getBookById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: '图书不存在' });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const existingReservation = lendingRecords.find(
      r => r.userId === userId && r.bookId === bookId && (r.status === 'reserved' || r.status === 'borrowed')
    );
    if (existingReservation) {
      return res.status(400).json({ success: false, message: '您已预约或借阅过此图书' });
    }

    const activeRecords = lendingRecords.filter(
      r => r.userId === userId && (r.status === 'reserved' || r.status === 'borrowed')
    );
    if (activeRecords.length >= user.maxBorrow) {
      return res.status(400).json({ success: false, message: `借阅数量已达上限（${user.maxBorrow}本）` });
    }

    const newRecord = {
      id: uuidv4(),
      userId,
      bookId,
      type: 'reserved',
      status: 'reserved',
      renewCount: 0,
      reservedAt: new Date().toISOString(),
      borrowedAt: null,
      dueDate: null,
      returnedAt: null,
      bookSnapshot: { ...book },
    };

    lendingRecords.unshift(newRecord);

    res.status(201).json({
      success: true,
      data: newRecord,
      message: '预约成功，请在3天内到图书馆办理借阅手续',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '预约失败', error: error.message });
  }
});

router.put('/borrow/:id', (req, res) => {
  try {
    const { id } = req.params;
    const record = lendingRecords.find(r => r.id === id);

    if (!record) {
      return res.status(404).json({ success: false, message: '预约记录不存在' });
    }

    if (record.status !== 'reserved') {
      return res.status(400).json({ success: false, message: '当前预约状态无法办理借阅' });
    }

    const book = getBookById(record.bookId);
    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: '图书库存不足，无法借阅' });
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    record.status = 'borrowed';
    record.type = 'borrowed';
    record.borrowedAt = now.toISOString();
    record.dueDate = dueDate.toISOString();

    book.availableCopies--;
    if (book.availableCopies <= 0) {
      book.status = 'borrowed';
    }

    const user = users.find(u => u.id === record.userId);
    if (user) {
      user.borrowCount++;
    }

    res.json({
      success: true,
      data: record,
      message: `借阅成功，应还日期：${dueDate.toLocaleDateString('zh-CN')}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '借阅失败', error: error.message });
  }
});

router.put('/return/:id', (req, res) => {
  try {
    const { id } = req.params;
    const record = lendingRecords.find(r => r.id === id);

    if (!record) {
      return res.status(404).json({ success: false, message: '借阅记录不存在' });
    }

    if (record.status !== 'borrowed') {
      return res.status(400).json({ success: false, message: '当前借阅状态无法办理归还' });
    }

    const now = new Date();
    const dueDate = new Date(record.dueDate);
    const isOverdue = now > dueDate;
    const overdueDays = isOverdue ? Math.ceil((now - dueDate) / (24 * 60 * 60 * 1000)) : 0;

    record.status = 'returned';
    record.returnedAt = now.toISOString();

    const book = getBookById(record.bookId);
    if (book) {
      book.availableCopies++;
      book.status = 'available';
    }

    res.json({
      success: true,
      data: {
        ...record,
        overdueDays,
        isOverdue,
      },
      message: isOverdue
        ? `归还成功，已逾期${overdueDays}天，请缴纳逾期费用`
        : '归还成功，感谢您准时归还图书',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '归还失败', error: error.message });
  }
});

router.put('/renew/:id', (req, res) => {
  try {
    const { id } = req.params;
    const record = lendingRecords.find(r => r.id === id);

    if (!record) {
      return res.status(404).json({ success: false, message: '借阅记录不存在' });
    }

    if (record.status !== 'borrowed') {
      return res.status(400).json({ success: false, message: '当前状态无法续借' });
    }

    if (record.renewCount >= 2) {
      return res.status(400).json({ success: false, message: '续借次数已达上限（每本最多2次）' });
    }

    const now = new Date();
    const dueDate = new Date(record.dueDate);
    if (now > dueDate) {
      return res.status(400).json({ success: false, message: '借阅已逾期，无法续借，请先归还图书' });
    }

    const newDueDate = new Date(dueDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    record.dueDate = newDueDate.toISOString();
    record.renewCount++;

    res.json({
      success: true,
      data: record,
      message: `续借成功，新的应还日期：${newDueDate.toLocaleDateString('zh-CN')}（第${record.renewCount}次续借）`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '续借失败', error: error.message });
  }
});

router.delete('/reserve/:id', (req, res) => {
  try {
    const { id } = req.params;
    const recordIndex = lendingRecords.findIndex(r => r.id === id);

    if (recordIndex === -1) {
      return res.status(404).json({ success: false, message: '预约记录不存在' });
    }

    if (lendingRecords[recordIndex].status !== 'reserved') {
      return res.status(400).json({ success: false, message: '只能取消待确认的预约' });
    }

    lendingRecords.splice(recordIndex, 1);
    res.json({ success: true, message: '预约已取消' });
  } catch (error) {
    res.status(500).json({ success: false, message: '取消预约失败', error: error.message });
  }
});

router.get('/records', (req, res) => {
  try {
    const { status, userId, bookId } = req.query;
    let filtered = [...lendingRecords];

    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    if (userId) {
      filtered = filtered.filter(r => r.userId === userId);
    }
    if (bookId) {
      filtered = filtered.filter(r => r.bookId === bookId);
    }

    filtered.sort((a, b) => new Date(b.reservedAt) - new Date(a.reservedAt));

    const enriched = filtered.map(r => {
      const user = users.find(u => u.id === r.userId);
      const book = getBookById(r.bookId);
      return {
        ...r,
        userSnapshot: user || null,
        bookSnapshot: book || r.bookSnapshot,
      };
    });

    res.json({
      success: true,
      data: enriched,
      total: enriched.length,
      stats: {
        total: lendingRecords.length,
        reserved: lendingRecords.filter(r => r.status === 'reserved').length,
        borrowed: lendingRecords.filter(r => r.status === 'borrowed').length,
        returned: lendingRecords.filter(r => r.status === 'returned').length,
        overdue: lendingRecords.filter(r => {
          if (r.status !== 'borrowed' || !r.dueDate) return false;
          return new Date() > new Date(r.dueDate);
        }).length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取记录失败', error: error.message });
  }
});

export default router;
