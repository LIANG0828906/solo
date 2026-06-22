import type { Book, WishlistItem, BorrowRecord, SaleRecord } from './types';

const literatureTitles = [
  '百年孤独', '霍乱时期的爱情', '活着', '许三观卖血记', '在细雨中呼喊',
  '兄弟', '第七天', '平凡的世界', '白鹿原', '废都',
  '围城', '边城', '子夜', '家', '春',
  '秋', '骆驼祥子', '茶馆', '四世同堂', '狂人日记',
  '阿Q正传', '祝福', '伤逝', '野草', '朝花夕拾',
  '三体', '流浪地球', '球状闪电', '超新星纪元', '乡村教师',
  '红楼梦', '西游记', '水浒传', '三国演义', '金瓶梅',
  '聊斋志异', '儒林外史', '镜花缘', '封神演义', '东周列国志',
  '1984', '动物农场', '了不起的盖茨比', '老人与海', '太阳照常升起',
  '永别了武器', '丧钟为谁而鸣', '巴黎圣母院', '悲惨世界', '九三年',
  '简爱', '呼啸山庄', '傲慢与偏见', '理智与情感', '爱玛',
  '大卫科波菲尔', '双城记', '雾都孤儿', '远大前程', '艰难时世',
  '战争与和平', '安娜卡列尼娜', '复活', '罪与罚', '白痴',
  '卡拉马佐夫兄弟', '被欺凌与被侮辱的', '死魂灵', '钦差大臣', '静静的顿河',
];

const scitechTitles = [
  '时间简史', '果壳中的宇宙', '大设计', '宇宙简史', '黑洞与时间弯曲',
  '从一到无穷大', '啊哈灵机一动', '啊哈原来如此', '物理世界奇遇记', '趣味物理学',
  '编码', '深入理解计算机系统', '算法导论', '数据结构与算法分析', '计算机程序的构造和解释',
  '代码大全', '重构', '设计模式', '敏捷软件开发', '测试驱动开发',
  '人月神话', '代码整洁之道', '程序员修炼之道', '重构改善既有代码的设计', '领域驱动设计',
  '人工智能', '深度学习', '机器学习实战', '统计学习方法', '神经网络与深度学习',
  'Python编程从入门到实践', '流畅的Python', 'Python核心编程', 'Python Cookbook', '利用Python进行数据分析',
  'JavaScript高级程序设计', 'JavaScript语言精粹', '你不知道的JavaScript', 'ES6标准入门', '深入浅出Node.js',
  'React设计原理', '深入React技术栈', 'React全家桶', 'Vue.js设计与实现', '深入浅出Vue.js',
  '数学之美', '浪潮之巅', '文明之光', '智能时代', '硅谷之谜',
];

const lifeTitles = [
  '家常菜大全', '烘焙圣经', '中国居民膳食指南', '食物与厨艺', '吃出健康的智慧',
  '跑步圣经', '硬派健身', '囚徒健身', '施瓦辛格健身全书', '运动解剖学',
  '睡眠革命', '为什么我们会睡觉', '精力管理', '高效能人士的七个习惯', '搞定',
  '番茄工作法图解', '刻意练习', '学习之道', '如何阅读一本书', '思考快与慢',
  '穷查理宝典', '小狗钱钱', '富爸爸穷爸爸', '漫步华尔街', '聪明的投资者',
  '断舍离', '怦然心动的人生整理魔法', '极简生活', '小家越住越大', '住宅设计解剖书',
  '育儿百科', '正面管教', '你就是孩子最好的玩具', '好妈妈胜过好老师', '童年的秘密',
  '非暴力沟通', '关键对话', '影响力', '人性的弱点', '卡耐基人际交往心理学',
  '旅行的艺术', '背包十年', '孤独星球中国', '不去会死', '最好的时光在路上',
  '园艺百科全书', '阳台种菜', '多肉植物图鉴', '室内绿植完整手册', 'DK园艺百科',
];

const literatureAuthors = [
  '加西亚·马尔克斯', '余华', '路遥', '陈忠实', '贾平凹',
  '钱钟书', '沈从文', '茅盾', '巴金', '老舍',
  '鲁迅', '刘慈欣', '曹雪芹', '吴承恩', '施耐庵',
  '罗贯中', '蒲松龄', '吴敬梓', '李汝珍', '乔治·奥威尔',
  '菲茨杰拉德', '海明威', '雨果', '夏洛蒂·勃朗特', '艾米莉·勃朗特',
  '简·奥斯汀', '狄更斯', '托尔斯泰', '陀思妥耶夫斯基', '果戈理',
];

const scitechAuthors = [
  '霍金', '加莫夫', '马丁·伽德纳', '乔治·伽莫夫', '查尔斯·佩措尔德',
  '兰德尔·布莱恩特', '科尔曼', '马克·艾伦·维斯', '阿贝尔森', '迈克儿·珀特',
  '马丁·福勒', '埃里克·伽玛', '罗伯特·C·马丁', '布鲁克斯', '史蒂夫·麦康奈尔',
  '米切尔', '伊恩·古德费洛', '李航', '周志华', '埃里克·马瑟斯',
  '卢西亚诺·拉马略', '韦斯利·春', '麦金尼', '马特·弗里斯比', '道格拉斯·克罗克福特',
  '凯尔·辛普森', '阮一峰', '朴灵', '卡马克', '尤雨溪',
  '吴军', '李开复', '李彦宏', '吴恩达', '杰弗里·辛顿',
];

const lifeAuthors = [
  '贝太厨房', '保罗·霍利伍德', '中国营养学会', '哈洛德·马基', '西木博士',
  '乔治·希恩', '斌卡', '保罗·威德', '施瓦辛格', '安德鲁·比尔',
  '马修·沃克', '西格蒙德·弗洛伊德', '吉姆·洛尔', '史蒂芬·柯维', '戴维·艾伦',
  '诺特伯格', '安德斯·艾利克森', '芭芭拉·奥克利', '莫提默·艾德勒', '丹尼尔·卡尼曼',
  '彼得·考夫曼', '博多·舍费尔', '罗伯特·清崎', '伯顿·马尔基尔', '本杰明·格雷厄姆',
  '山下英子', '近藤麻理惠', '乔舒亚·贝克尔', '逯薇', '中山繁信',
  '斯波克', '简·尼尔森', '玛丽·希迪·柯琴卡', '尹建莉', '蒙台梭利',
  '马歇尔·卢森堡', '科里·帕特森', '罗伯特·西奥迪尼', '戴尔·卡耐基', '阿德勒',
  '阿兰·德波顿', '小鹏', '托尼·惠勒', '石田裕辅', '郭子鹰',
  'DK百科', '克里斯·鲍尔', '多肉植物图鉴编委会', '乔恩·罗斯', '皇家园艺学会',
];

const categories = ['文学', '科技', '生活'] as const;

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateISBN(): string {
  return '978' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
}

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString().split('T')[0];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMockBooks(count: number = 200): Book[] {
  const books: Book[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = pickRandom(categories);
    let title: string;
    let author: string;
    
    if (category === '文学') {
      title = pickRandom(literatureTitles);
      author = pickRandom(literatureAuthors);
    } else if (category === '科技') {
      title = pickRandom(scitechTitles);
      author = pickRandom(scitechAuthors);
    } else {
      title = pickRandom(lifeTitles);
      author = pickRandom(lifeAuthors);
    }
    
    const entryDate = randomDate(180);
    const hasSale = Math.random() > 0.3;
    const lastSaleDate = hasSale ? randomDate(60) : undefined;
    const stock = Math.floor(Math.random() * 20) + 1;
    const price = Math.floor(Math.random() * 80) + 10;
    const isBorrowed = Math.random() > 0.85;
    const dueDate = isBorrowed ? randomDate(-14) : undefined;
    const borrowerName = isBorrowed ? pickRandom(['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十']) : undefined;
    
    books.push({
      id: generateId(),
      title: title + (Math.random() > 0.7 ? '（修订版）' : ''),
      author,
      isbn: generateISBN(),
      category,
      price,
      stock,
      entryDate,
      lastSaleDate,
      isBorrowed,
      borrowerName,
      dueDate,
    });
  }
  
  return books;
}

export function generateMockWishlist(): WishlistItem[] {
  return [
    {
      id: generateId(),
      title: '百年孤独',
      author: '加西亚·马尔克斯',
      maxPrice: 45,
      status: '待匹配',
      submitDate: randomDate(3),
    },
    {
      id: generateId(),
      title: '三体全集',
      author: '刘慈欣',
      maxPrice: 80,
      status: '待匹配',
      submitDate: randomDate(7),
    },
    {
      id: generateId(),
      title: '活着',
      author: '余华',
      maxPrice: 20,
      status: '已联系',
      submitDate: randomDate(14),
    },
    {
      id: generateId(),
      title: '深度学习入门',
      author: '伊恩·古德费洛',
      maxPrice: 120,
      status: '待匹配',
      submitDate: randomDate(5),
    },
    {
      id: generateId(),
      title: '家常菜烹饪',
      author: '贝太厨房',
      maxPrice: 30,
      status: '已完成',
      submitDate: randomDate(30),
    },
  ];
}

export function generateMockBorrowRecords(books: Book[]): BorrowRecord[] {
  const records: BorrowRecord[] = [];
  const borrowedBooks = books.filter(b => b.isBorrowed);
  
  borrowedBooks.forEach(book => {
    records.push({
      id: generateId(),
      bookId: book.id,
      borrowerName: book.borrowerName || '未知',
      borrowDate: randomDate(30),
      dueDate: book.dueDate || randomDate(-7),
    });
  });
  
  return records;
}

export function generateMockSales(books: Book[]): SaleRecord[] {
  const records: SaleRecord[] = [];
  
  for (let i = 0; i < 100; i++) {
    const book = pickRandom(books);
    records.push({
      id: generateId(),
      bookId: book.id,
      saleDate: randomDate(90),
      price: book.price * (0.8 + Math.random() * 0.4),
    });
  }
  
  return records;
}
