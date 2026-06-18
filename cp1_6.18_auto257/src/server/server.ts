import express from 'express';
import http from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Book, Comment, NewCommentPayload, InitialData } from '../shared/types';

const PORT = 3001;

const COVER_COLORS = [
  '#A3D1C6', '#D4A5A5', '#C9A8D6', '#F5D5A8', '#B8D4E8',
  '#E8C8C8', '#C8E8D4', '#D4C8A8', '#A8C8E8', '#E8A8C8',
  '#C8C8A8', '#A8E8D4', '#D4A8C8', '#A8D4E8', '#E8D4A8',
];

const BOOK_TITLES = [
  { title: '追风筝的人', author: '卡勒德·胡赛尼' },
  { title: '百年孤独', author: '加西亚·马尔克斯' },
  { title: '挪威的森林', author: '村上春树' },
  { title: '小王子', author: '圣埃克苏佩里' },
  { title: '活着', author: '余华' },
  { title: '围城', author: '钱钟书' },
  { title: '三体', author: '刘慈欣' },
  { title: '解忧杂货店', author: '东野圭吾' },
  { title: '白夜行', author: '东野圭吾' },
  { title: '嫌疑人X的献身', author: '东野圭吾' },
  { title: '1984', author: '乔治·奥威尔' },
  { title: '动物农场', author: '乔治·奥威尔' },
  { title: '了不起的盖茨比', author: '菲茨杰拉德' },
  { title: '月亮与六便士', author: '毛姆' },
  { title: '刀锋', author: '毛姆' },
  { title: '局外人', author: '加缪' },
  { title: '鼠疫', author: '加缪' },
  { title: '老人与海', author: '海明威' },
  { title: '永别了，武器', author: '海明威' },
  { title: '傲慢与偏见', author: '简·奥斯汀' },
  { title: '简爱', author: '夏洛蒂·勃朗特' },
  { title: '呼啸山庄', author: '艾米莉·勃朗特' },
  { title: '红与黑', author: '司汤达' },
  { title: '悲惨世界', author: '雨果' },
  { title: '巴黎圣母院', author: '雨果' },
  { title: '基督山伯爵', author: '大仲马' },
  { title: '三个火枪手', author: '大仲马' },
  { title: '包法利夫人', author: '福楼拜' },
  { title: '罪与罚', author: '陀思妥耶夫斯基' },
  { title: '卡拉马佐夫兄弟', author: '陀思妥耶夫斯基' },
  { title: '战争与和平', author: '托尔斯泰' },
  { title: '安娜·卡列尼娜', author: '托尔斯泰' },
  { title: '复活', author: '托尔斯泰' },
  { title: '静静的顿河', author: '肖洛霍夫' },
  { title: '飘', author: '玛格丽特·米切尔' },
  { title: '杀死一只知更鸟', author: '哈珀·李' },
  { title: '麦田里的守望者', author: '塞林格' },
  { title: '蝇王', author: '戈尔丁' },
  { title: '第二十二条军规', author: '海勒' },
  { title: '教父', author: '马里奥·普佐' },
  { title: '肖申克的救赎', author: '斯蒂芬·金' },
  { title: '绿山墙的安妮', author: '露西·蒙哥马利' },
  { title: '爱的教育', author: '亚米契斯' },
  { title: '假如给我三天光明', author: '海伦·凯勒' },
  { title: '钢铁是怎样炼成的', author: '奥斯特洛夫斯基' },
  { title: '童年', author: '高尔基' },
  { title: '在人间', author: '高尔基' },
  { title: '我的大学', author: '高尔基' },
  { title: '朝花夕拾', author: '鲁迅' },
  { title: '骆驼祥子', author: '老舍' },
];

const DESCRIPTIONS = [
  '这是一部感人至深的成长小说，讲述了一个关于爱、友谊与救赎的故事。作者以细腻的笔触描绘了主人公在乱世中的挣扎与蜕变，让读者在泪水中感悟生命的真谛。',
  '一部划时代的魔幻现实主义巨著，通过布恩迪亚家族七代人的传奇故事，展现了拉丁美洲百年历史的风云变幻。作品融合了神话传说与现实生活，被誉为20世纪最伟大的小说之一。',
  '这是一段关于青春、爱情与失落的温柔记忆。作者以诗意的语言，讲述了少年渡边在两个女孩之间的情感纠葛，以及他对生死、孤独的深刻思考。',
  '一则献给成年人的童话，用最简单的语言讲述最深刻的哲理。小王子的星际旅程，让我们重新审视什么是真正重要的东西——用心才能看见本质。',
  '一部写尽中国人苦难与坚韧的史诗。主人公福贵的一生经历了无数次生离死别，但他始终以顽强的生命力面对命运，展现了人性最深处的尊严与力量。',
  '一部知识分子的精神寓言，以方鸿渐的人生经历为线索，讽刺了抗战时期中国社会的种种弊病。"城外的人想冲进去，城里的人想逃出来"，道出了人生永恒的困境。',
  '中国科幻文学的巅峰之作。三体文明的入侵危机，引发了人类文明内部的分裂与对抗。作品以宏大的宇宙视野，探讨了生存、道德与文明存续的终极命题。',
  '一家神奇的杂货店，能够收到来自过去的信件，也能送出来自未来的回信。五个看似独立的故事，在时间的长河中彼此交织，温暖了每一颗孤独的心灵。',
  '一部结构精巧的悬疑小说，讲述了一对青梅竹马的男女跨越十九年的纠缠。罪恶与守护并行，黑暗与温暖同在，结局令人唏嘘不已。',
  '一个天才数学家为了守护心爱之人，策划了一场完美的犯罪。然而在另一位天才的步步紧逼下，真相逐渐浮出水面。爱与牺牲的极致表达，震撼人心。',
  '一部反乌托邦经典，描绘了一个极权主义统治下的未来社会。老大哥在看着你——这句话成为了对监控社会最警醒的预言，至今仍振聋发聩。',
  '一则简短却锋利的政治寓言。一群动物推翻了人类的压迫，却在权力的腐蚀下走向了新的专制。"所有动物一律平等，但有些动物比其他动物更平等"。',
  '爵士时代的一曲挽歌，讲述了百万富翁盖茨比为了追寻初恋黛西，最终梦碎长岛的故事。浮华背后的虚无，梦想破灭的悲哀，成就了美国文学史上最伟大的悲剧之一。',
  '一个伦敦股票经纪人抛弃一切，远走他乡追求艺术理想的故事。满地都是六便士，他却抬头看见了月亮——在世俗与梦想之间，作者给出了最勇敢的选择。',
  '一部关于寻找人生意义的哲理小说。第一次世界大战后，年轻的飞行员拉里放弃了稳定的生活，开始了横跨欧亚大陆的精神之旅，最终在东方哲学中找到了内心的宁静。',
];

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function generateBooks(): Book[] {
  const books: Book[] = [];
  for (let i = 0; i < 50; i++) {
    const meta = BOOK_TITLES[i % BOOK_TITLES.length];
    books.push({
      id: uuidv4(),
      title: meta.title,
      author: meta.author,
      description: pickRandom(DESCRIPTIONS, i * 7 + 3),
      rating: parseFloat((3.0 + Math.random() * 1.8).toFixed(1)),
      coverColor: COVER_COLORS[i % COVER_COLORS.length],
    });
  }
  return books;
}

function generateSeedComments(books: Book[]): Comment[] {
  const users = ['林间风', '星河客', '枕边书', '墨香斋主', '月下独酌', '书香门第', '字里行间', '万卷书生'];
  const samples = [
    '一口气读完，后劲太大了！强烈推荐给每一个热爱文学的朋友。',
    '这本书改变了我看待世界的方式，作者的洞察力太惊人了。',
    '第三次重读了，每一次都有新的收获。经典就是经典。',
    '情节设计非常精妙，最后三章完全颠覆了我的预期。',
    '人物刻画得栩栩如生，仿佛就生活在我身边一样。',
    '翻译得非常好，语言流畅优美，完全没有违和感。',
    '适合在一个安静的午后慢慢品读，会给你很多思考。',
    '这本书让我哭了三次也笑了三次，是今年读过最好的书。',
  ];
  const comments: Comment[] = [];
  const now = Date.now();
  for (let i = 0; i < 15; i++) {
    const book = books[i % books.length];
    comments.unshift({
      id: uuidv4(),
      bookId: book.id,
      bookTitle: book.title,
      username: users[i % users.length],
      content: samples[i % samples.length],
      rating: 3 + (i % 3),
      timestamp: now - i * 1000 * 60 * 12,
    });
  }
  return comments;
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});

const books: Book[] = generateBooks();
let comments: Comment[] = generateSeedComments(books);
const onlineSockets = new Set<Socket>();

app.get('/health', (_req, res) => {
  res.json({ ok: true, online: onlineSockets.size, books: books.length, comments: comments.length });
});

io.on('connection', (socket) => {
  onlineSockets.add(socket);
  console.log(`[Socket] Client connected: ${socket.id}. Online: ${onlineSockets.size}`);

  const initial: InitialData = {
    books,
    comments: comments.slice(0, 20),
  };
  socket.emit('initial-data', initial);

  socket.on('new-comment', (payload: NewCommentPayload) => {
    const book = books.find((b) => b.id === payload.bookId);
    if (!book) return;
    if (!payload.content?.trim() || !payload.username?.trim()) return;

    const newComment: Comment = {
      id: uuidv4(),
      bookId: payload.bookId,
      bookTitle: book.title,
      username: payload.username.trim(),
      content: payload.content.trim().slice(0, 300),
      rating: Math.min(5, Math.max(1, payload.rating)),
      timestamp: Date.now(),
    };
    comments = [newComment, ...comments].slice(0, 100);
    io.emit('comment-broadcast', newComment);
    console.log(`[Comment] ${newComment.username} -> ${book.title}: ${newComment.content.slice(0, 20)}...`);
  });

  socket.on('disconnect', () => {
    onlineSockets.delete(socket);
    console.log(`[Socket] Client disconnected: ${socket.id}. Online: ${onlineSockets.size}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 Generated ${books.length} books, ${comments.length} seed comments`);
});
