export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  stock: number;
  price: number;
  cover: string;
  description: string;
  isBestseller?: boolean;
}

export interface OrderItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'shipped';
  createdAt: string;
  customerName?: string;
}

export const books: Book[] = [
  {
    id: 'b001',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    isbn: '978-7-5442-6998-1',
    category: '文学',
    stock: 42,
    price: 55.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20book%20cover%20magical%20realism%20butterflies%20warm%20sepia%20tones&image_size=portrait_4_3',
    description: '布恩迪亚家族七代人的传奇故事，魔幻现实主义文学的代表作。马孔多小镇的百年兴衰，折射出拉丁美洲的历史与命运。',
    isBestseller: true
  },
  {
    id: 'b002',
    title: '三体',
    author: '刘慈欣',
    isbn: '978-7-5366-9293-0',
    category: '科幻',
    stock: 3,
    price: 68.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sci%20fi%20book%20cover%20distant%20galaxy%20three%20suns%20dark%20blue%20cosmos&image_size=portrait_4_3',
    description: '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划"红岸工程"取得了突破性进展。中国科幻的里程碑之作。',
    isBestseller: true
  },
  {
    id: 'b003',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    isbn: '978-7-5086-4550-6',
    category: '历史',
    stock: 28,
    price: 88.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=history%20book%20cover%20human%20evolution%20silhouettes%20ancient%20to%20modern%20warm%20beige&image_size=portrait_4_3',
    description: '从十万年前有生命迹象开始到21世纪资本、科技交织的人类发展史。理清影响人类发展的重大脉络。',
    isBestseller: true
  },
  {
    id: 'b004',
    title: '小王子',
    author: '安托万·德·圣-埃克苏佩里',
    isbn: '978-7-02-004249-4',
    category: '文学',
    stock: 15,
    price: 32.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20book%20cover%20little%20prince%20planet%20stars%20rose%20soft%20watercolor&image_size=portrait_4_3',
    description: '一部为成年人写的童话。以一位飞行员作为故事叙述者，讲述了小王子从自己星球出发前往地球的过程中，所经历的各种历险。'
  },
  {
    id: 'b005',
    title: '原则',
    author: '瑞·达利欧',
    isbn: '978-7-5086-8380-7',
    category: '商业',
    stock: 4,
    price: 98.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20book%20cover%20minimalist%20principles%20geometric%20lines%20elegant%20brown%20gold&image_size=portrait_4_3',
    description: '桥水基金创始人瑞·达利欧分享他的生活和工作原则。这些原则帮助他在四十多年的职业生涯中不断创造卓越成果。',
    isBestseller: true
  },
  {
    id: 'b006',
    title: '艺术的故事',
    author: '贡布里希',
    isbn: '978-7-80746-372-6',
    category: '艺术',
    stock: 12,
    price: 128.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=art%20history%20book%20cover%20renaissance%20painting%20swatches%20classical%20elegant&image_size=portrait_4_3',
    description: '概括地叙述了从最早的洞窟绘画到当今的实验艺术的发展历程，有关艺术的书籍中最著名、最流行的著作之一。'
  },
  {
    id: 'b007',
    title: '活着',
    author: '余华',
    isbn: '978-7-5063-3043-5',
    category: '文学',
    stock: 2,
    price: 39.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20literature%20book%20cover%20rural%20field%20old%20man%20buffalo%20sunset%20melancholy&image_size=portrait_4_3',
    description: '讲述了农村人福贵悲惨的人生遭遇。福贵本是个阔少爷，可他嗜赌如命，终于赌光了家业。',
    isBestseller: true
  },
  {
    id: 'b008',
    title: '沙丘',
    author: '弗兰克·赫伯特',
    isbn: '978-7-5404-6758-8',
    category: '科幻',
    stock: 22,
    price: 78.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sci%20fi%20book%20cover%20desert%20planet%20dune%20sandworm%20orange%20sky%20epic&image_size=portrait_4_3',
    description: '人类每次正视自己的渺小，都是自身的一次巨大进步。阿西莫夫后最伟大的科幻史诗，雨果奖与星云奖双料得主。'
  },
  {
    id: 'b009',
    title: '万历十五年',
    author: '黄仁宇',
    isbn: '978-7-108-00982-1',
    category: '历史',
    stock: 35,
    price: 45.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20history%20book%20cover%20ming%20dynasty%20scroll%20ink%20painting%20imperial&image_size=portrait_4_3',
    description: '以1587年为切入点，通过对历史关键人物的细致刻画，展现了明代中国的社会结构与制度困境。'
  },
  {
    id: 'b010',
    title: '设计心理学',
    author: '唐纳德·A·诺曼',
    isbn: '978-7-5086-4833-0',
    category: '艺术',
    stock: 8,
    price: 58.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=design%20book%20cover%20everyday%20objects%20door%20teapot%20minimalist%20clean%20lines&image_size=portrait_4_3',
    description: '设计领域的经典之作。解释了为什么有些设计让用户感到愉悦，而有些却让用户感到沮丧。'
  },
  {
    id: 'b011',
    title: '穷查理宝典',
    author: '彼得·考夫曼',
    isbn: '978-7-5086-5253-3',
    category: '商业',
    stock: 18,
    price: 108.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=investment%20book%20cover%20wisdom%20vintage%20compound%20interest%20charts%20elegant&image_size=portrait_4_3',
    description: '查理·芒格的智慧箴言录。收录了他最精华的思想和投资哲学，多元思维模型的集中体现。'
  },
  {
    id: 'b012',
    title: '挪威的森林',
    author: '村上春树',
    isbn: '978-7-5327-3601-0',
    category: '文学',
    stock: 0,
    price: 42.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20literature%20book%20cover%20forest%20moody%20soft%20focus%20melancholic%20green&image_size=portrait_4_3',
    description: '青春、恋爱、感伤的物语。以第一人称视角叙述了主角渡边在青春岁月中的爱情与友情、失去与成长。'
  },
  {
    id: 'b013',
    title: '基地',
    author: '艾萨克·阿西莫夫',
    isbn: '978-7-5399-4986-4',
    category: '科幻',
    stock: 5,
    price: 52.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sci%20fi%20book%20cover%20galactic%20empire%20fall%20spiral%20galaxy%20futuristic&image_size=portrait_4_3',
    description: '心理史学家哈里·谢顿预言银河帝国即将覆灭，并为保存人类文明建立了两个基地。科幻史上的丰碑。'
  },
  {
    id: 'b014',
    title: '明朝那些事儿',
    author: '当年明月',
    isbn: '978-7-213-04862-5',
    category: '历史',
    stock: 1,
    price: 35.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20history%20book%20cover%20ming%20dynasty%20dragon%20emperor%20red%20gold&image_size=portrait_4_3',
    description: '用通俗易懂的笔法讲述明朝三百年历史。从朱元璋起义到崇祯帝自缢，十七位皇帝的权力更迭与人性浮沉。',
    isBestseller: true
  },
  {
    id: 'b015',
    title: '梵高手稿',
    author: '文森特·梵高',
    isbn: '978-7-5502-7799-5',
    category: '艺术',
    stock: 9,
    price: 118.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=art%20book%20cover%20vangogh%20sunflowers%20swirls%20impressionist%20brushstrokes%20vibrant&image_size=portrait_4_3',
    description: '收录了梵高一生中最重要的书信和手稿，搭配其经典画作，深入了解这位天才艺术家的内心世界。'
  },
  {
    id: 'b016',
    title: '从0到1',
    author: '彼得·蒂尔',
    isbn: '978-7-5086-5901-4',
    category: '商业',
    stock: 25,
    price: 56.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=startup%20book%20cover%20zero%20to%20one%20minimalist%20binary%20innovation%20dark%20blue&image_size=portrait_4_3',
    description: 'PayPal创始人彼得·蒂尔的创业心法。在全球化竞争激烈的今天，如何找到创新的突破口，开启全新的市场。',
    isBestseller: true
  },
  {
    id: 'b017',
    title: '追风筝的人',
    author: '卡勒德·胡赛尼',
    isbn: '978-7-208-06164-4',
    category: '文学',
    stock: 30,
    price: 45.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=literature%20book%20cover%20kite%20flying%20afghanistan%20sky%20warm%20golden%20hour&image_size=portrait_4_3',
    description: '12岁的阿富汗富家少爷阿米尔与仆人哈桑情同手足。然而，关于风筝的一场比赛，却让一切发生了改变。'
  },
  {
    id: 'b018',
    title: '神经漫游者',
    author: '威廉·吉布森',
    isbn: '978-7-5364-6820-7',
    category: '科幻',
    stock: 11,
    price: 48.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cyberpunk%20book%20cover%20neon%20city%20matrix%20rain%20night%20purple%20blue&image_size=portrait_4_3',
    description: '赛博朋克文学的开山之作。一个关于网络黑客、人工智能与跨国企业阴谋的未来故事，预见了互联网时代。'
  },
  {
    id: 'b019',
    title: '叫魂',
    author: '孔飞力',
    isbn: '978-7-108-04179-6',
    category: '历史',
    stock: 6,
    price: 55.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20history%20book%20cover%20qing%20dynasty%20sorcery%20mystery%20traditional&image_size=portrait_4_3',
    description: '1768年，中国悲剧性近代的前夜。一种名为"叫魂"的妖术恐惧在中华大地上蔓延，折射出帝制中国的社会运行逻辑。'
  },
  {
    id: 'b020',
    title: '写给大家看的设计书',
    author: '罗宾·威廉姆斯',
    isbn: '978-7-115-20404-2',
    category: '艺术',
    stock: 16,
    price: 49.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=design%20book%20cover%20typography%20colorful%20grid%20modern%20playful&image_size=portrait_4_3',
    description: '设计入门的经典之作。亲密性、对齐、重复、对比四大基本原则，让你快速掌握优秀设计的核心秘诀。'
  },
  {
    id: 'b021',
    title: '黑天鹅',
    author: '纳西姆·尼古拉斯·塔勒布',
    isbn: '978-7-5086-4486-6',
    category: '商业',
    stock: 20,
    price: 68.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=finance%20book%20cover%20black%20swan%20minimalist%20elegant%20contrast&image_size=portrait_4_3',
    description: '在发现澳大利亚的黑天鹅之前，欧洲人认为天鹅都是白色的。极不可能发生的事件往往具有颠覆性影响。'
  },
  {
    id: 'b022',
    title: '平凡的世界',
    author: '路遥',
    isbn: '978-7-5302-0955-6',
    category: '文学',
    stock: 14,
    price: 128.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20literature%20book%20cover%20rural%20loess%20plateau%20sunrise%20workers%20epic&image_size=portrait_4_3',
    description: '茅盾文学奖获奖作品。以中国70年代中期到80年代中期十年间为背景，全景式地展现了当代中国城乡社会生活。',
    isBestseller: true
  },
  {
    id: 'b023',
    title: '你想活出怎样的人生',
    author: '吉野源三郎',
    isbn: '978-7-5442-8013-6',
    category: '文学',
    stock: 7,
    price: 45.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=philosophy%20book%20cover%20boy%20looking%20at%20sky%20clouds%20soft%20dreamy&image_size=portrait_4_3',
    description: '一本关于人生的成长小说。少年本田润一在舅舅的引导下，开始思考关于人生、贫穷、勇气等重要课题。'
  },
  {
    id: 'b024',
    title: '银河系搭车客指南',
    author: '道格拉斯·亚当斯',
    isbn: '978-7-5327-5467-0',
    category: '科幻',
    stock: 19,
    price: 38.00,
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=comedy%20sci%20fi%20book%20cover%20space%20hitchhiker%20towel%20don%27t%20panic%20funny&image_size=portrait_4_3',
    description: '地球被毁灭了，因为要在它所在的地方修建一条超空间快速通道。主人公阿瑟·邓特活下来了，科幻喜剧的巅峰之作。'
  }
];

export const orders: Order[] = [
  {
    id: 'ord-001',
    items: [{ bookId: 'b001', title: '百年孤独', price: 55, quantity: 1 }],
    total: 55,
    status: 'shipped',
    createdAt: new Date().toISOString().split('T')[0]
  },
  {
    id: 'ord-002',
    items: [
      { bookId: 'b003', title: '人类简史', price: 88, quantity: 1 },
      { bookId: 'b005', title: '原则', price: 98, quantity: 1 }
    ],
    total: 186,
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0]
  },
  {
    id: 'ord-003',
    items: [{ bookId: 'b016', title: '从0到1', price: 56, quantity: 2 }],
    total: 112,
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0]
  }
];
