import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const categories = ['文学小说', '科学技术', '历史传记', '经济管理', '艺术设计', '儿童读物', '哲学思想', '生活百科'];

const generateBooks = () => {
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
    { title: '色彩设计手册', author: 'Sean Adams', category: '艺术设计', isbn: '978-7-5153-5137-7', description: '专业的色彩理论与应用指南，帮助设计师掌握色彩搭配技巧，创造出有感染力的设计作品。' },
    { title: '窗边的小豆豆', author: '黑柳彻子', category: '儿童读物', isbn: '978-7-5442-4671-2', description: '巴学园里的快乐童年故事，讲述了小豆豆在特殊学校的成长经历，传递了独特的教育理念。' },
    { title: '沉思录', author: '马可·奥勒留', category: '哲学思想', isbn: '978-7-5117-3324-5', description: '罗马皇帝的自我对话与人生思考，是斯多葛学派的代表作，教人如何面对人生的苦难与无常。' },
    { title: '急救手册', author: '中国红十字会', category: '生活百科', isbn: '978-7-117-27895-1', description: '家庭必备的急救知识指南，涵盖了常见意外伤害的急救方法，关键时刻能挽救生命。' },
  ];

  return bookData.map((book, index) => ({
    id: uuidv4(),
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

let books = generateBooks();

router.get('/books', (req, res) => {
  try {
    const { page = 1, limit = 50, category } = req.query;
    let filteredBooks = [...books];

    if (category && category !== 'all') {
      filteredBooks = filteredBooks.filter(b => b.category === category);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginatedBooks = filteredBooks.slice(start, start + limitNum);

    res.json({
      success: true,
      data: paginatedBooks,
      total: filteredBooks.length,
      page: pageNum,
      totalPages: Math.ceil(filteredBooks.length / limitNum),
      categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取图书列表失败', error: error.message });
  }
});

router.get('/books/categories', (req, res) => {
  try {
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取分类失败', error: error.message });
  }
});

router.get('/books/search', (req, res) => {
  try {
    const { q = '', category = 'all' } = req.query;
    const keyword = String(q).toLowerCase().trim();

    let results = books.filter(book => {
      const matchesKeyword = !keyword ||
        book.title.toLowerCase().includes(keyword) ||
        book.author.toLowerCase().includes(keyword) ||
        book.isbn.includes(keyword) ||
        book.description.toLowerCase().includes(keyword);

      const matchesCategory = category === 'all' || book.category === category;

      return matchesKeyword && matchesCategory;
    });

    res.json({
      success: true,
      data: results,
      total: results.length,
      query: q,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '搜索失败', error: error.message });
  }
});

router.get('/books/:id', (req, res) => {
  try {
    const { id } = req.params;
    const book = books.find(b => b.id === id);

    if (!book) {
      return res.status(404).json({ success: false, message: '图书不存在' });
    }

    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取图书详情失败', error: error.message });
  }
});

router.post('/books', (req, res) => {
  try {
    const { title, author, category, isbn, description, totalCopies = 1 } = req.body;

    if (!title || !author || !category) {
      return res.status(400).json({ success: false, message: '书名、作者和分类为必填项' });
    }

    const newBook = {
      id: uuidv4(),
      title,
      author,
      category,
      isbn: isbn || '',
      description: description || '',
      status: 'available',
      totalCopies: parseInt(totalCopies) || 1,
      availableCopies: parseInt(totalCopies) || 1,
      publishYear: new Date().getFullYear(),
      pages: 0,
      coverColor: `hsl(${Math.floor(Math.random() * 360)}, 60%, 40%)`,
      createdAt: new Date().toISOString(),
    };

    books.unshift(newBook);
    res.status(201).json({ success: true, data: newBook, message: '图书添加成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '添加图书失败', error: error.message });
  }
});

router.put('/books/:id', (req, res) => {
  try {
    const { id } = req.params;
    const bookIndex = books.findIndex(b => b.id === id);

    if (bookIndex === -1) {
      return res.status(404).json({ success: false, message: '图书不存在' });
    }

    const updateData = req.body;
    const updatedBook = { ...books[bookIndex], ...updateData };

    if (updateData.totalCopies !== undefined) {
      const diff = parseInt(updateData.totalCopies) - books[bookIndex].totalCopies;
      updatedBook.availableCopies = Math.max(0, books[bookIndex].availableCopies + diff);
    }

    updatedBook.status = updatedBook.availableCopies > 0 ? 'available' : 'borrowed';
    books[bookIndex] = updatedBook;

    res.json({ success: true, data: updatedBook, message: '图书更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新图书失败', error: error.message });
  }
});

router.delete('/books/:id', (req, res) => {
  try {
    const { id } = req.params;
    const bookIndex = books.findIndex(b => b.id === id);

    if (bookIndex === -1) {
      return res.status(404).json({ success: false, message: '图书不存在' });
    }

    books.splice(bookIndex, 1);
    res.json({ success: true, message: '图书删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除图书失败', error: error.message });
  }
});

export default router;
