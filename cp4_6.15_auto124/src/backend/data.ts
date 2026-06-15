import { v4 as uuidv4 } from 'uuid';

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

const coverPrompt = (title: string, category: string) => {
  const encoded = encodeURIComponent(`${category} book cover elegant ${title} warm lighting`);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encoded}&image_size=portrait_4_3`;
};

export const books: Book[] = [
  {
    id: uuidv4(),
    title: '追风筝的人',
    author: '卡勒德·胡赛尼',
    isbn: '9787208061644',
    category: '文学',
    stock: 12,
    price: 45.00,
    cover: coverPrompt('追风筝的人', 'literary fiction'),
    description: '这是一个关于友谊、背叛与救赎的故事。12岁的阿富汗富家少爷阿米尔与仆人哈桑情同手足，然而在一场风筝比赛后，发生了一件悲惨的事，令阿米尔感到自责和痛苦……',
    isBestseller: true,
  },
  {
    id: uuidv4(),
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    isbn: '9787544253994',
    category: '文学',
    stock: 2,
    price: 55.00,
    cover: coverPrompt('百年孤独', 'magical realism novel'),
    description: '《百年孤独》是魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰，反映了拉丁美洲一个世纪以来风云变幻的历史。',
    isBestseller: true,
  },
  {
    id: uuidv4(),
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    isbn: '9787508647357',
    category: '历史',
    stock: 8,
    price: 68.00,
    cover: coverPrompt('人类简史', 'history humanity evolution'),
    description: '从十万年前有生命迹象开始到21世纪资本、科技交织的人类发展史。我们是如何登上生物链顶端，从动物变成上帝的？这是一部宏大的人类发展史诗。',
    isBestseller: true,
  },
  {
    id: uuidv4(),
    title: '三体',
    author: '刘慈欣',
    isbn: '9787536692930',
    category: '科幻',
    stock: 3,
    price: 23.00,
    cover: coverPrompt('三体', 'science fiction space'),
    description: '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划"红岸工程"取得了突破性进展。但在按下发射键的那一刻，历经劫难的叶文洁没有意识到，她彻底改变了人类的命运。',
    isBestseller: true,
  },
  {
    id: uuidv4(),
    title: '活着',
    author: '余华',
    isbn: '9787506365437',
    category: '文学',
    stock: 15,
    price: 20.00,
    cover: coverPrompt('活着', 'chinese literature rural'),
    description: '讲述了农村人福贵悲惨的人生遭遇。福贵本是个阔少爷，可他嗜赌如命，终于赌光了家业。他的父亲被他活活气死，母亲则在穷困中患了重病……',
    isBestseller: true,
  },
  {
    id: uuidv4(),
    title: '艺术的故事',
    author: '贡布里希',
    isbn: '9787807463726',
    category: '艺术',
    stock: 4,
    price: 280.00,
    cover: coverPrompt('艺术的故事', 'art history painting'),
    description: '有关艺术的书籍中最著名、最流行的著作之一。它概括地叙述了从最早的洞窟绘画到当今的实验艺术的发展历程，以阐明艺术史是"各种传统不断迂回、不断改变的历史"。',
  },
  {
    id: uuidv4(),
    title: '思考，快与慢',
    author: '丹尼尔·卡尼曼',
    isbn: '9787508633558',
    category: '商业',
    stock: 6,
    price: 69.00,
    cover: coverPrompt('思考快与慢', 'psychology behavioral economics'),
    description: '诺贝尔经济学奖得主力作，揭示人类思维的两种模式：快思考与慢思考。我们以为自己在理性思考，但实际上我们的决策充满了各种偏见和谬误。',
  },
  {
    id: uuidv4(),
    title: '小王子',
    author: '安托万·德·圣·埃克苏佩里',
    isbn: '9787020042494',
    category: '文学',
    stock: 20,
    price: 22.00,
    cover: coverPrompt('小王子', 'children fairy tale classic'),
    description: '这是一本足以让人永葆童心的不朽经典，被全球亿万读者誉为最值得收藏的书。书中以一位飞行员作为故事叙述者，讲述了小王子从自己星球出发前往地球的过程中，所经历的各种历险。',
    isBestseller: true,
  },
  {
    id: uuidv4(),
    title: '沙丘',
    author: '弗兰克·赫伯特',
    isbn: '9787539967363',
    category: '科幻',
    stock: 0,
    price: 62.00,
    cover: coverPrompt('沙丘', 'sci-fi desert planet epic'),
    description: '在遥远的未来，人类分散在浩瀚的星系中。一颗叫做厄拉科斯的沙漠行星是整个宇宙中最稀有的资源——香料的唯一产地。香料可以延长寿命、增强意识，更是星际航行的关键。',
  },
  {
    id: uuidv4(),
    title: '明朝那些事儿',
    author: '当年明月',
    isbn: '9787213046438',
    category: '历史',
    stock: 1,
    price: 358.00,
    cover: coverPrompt('明朝那些事儿', 'chinese history ming dynasty'),
    description: '以史料为基础，以年代和具体人物为主线，并加入了小说的笔法，对明朝十七帝和其他王公权贵和小人物的命运进行全景展示。',
  },
  {
    id: uuidv4(),
    title: '原则',
    author: '瑞·达利欧',
    isbn: '9787508683805',
    category: '商业',
    stock: 7,
    price: 98.00,
    cover: coverPrompt('原则', 'business management principles'),
    description: '华尔街投资大神、对冲基金公司桥水创始人，人生经验之作。瑞·达利欧分享了他的生活和工作原则，这些原则帮助他在四十多年的职业生涯中取得了非凡的成就。',
  },
  {
    id: uuidv4(),
    title: '梵高手稿',
    author: '文森特·梵高',
    isbn: '9787550287143',
    category: '艺术',
    stock: 3,
    price: 128.00,
    cover: coverPrompt('梵高手稿', 'van gogh art sketches letters'),
    description: '从梵高写给弟弟提奥及家人的大量信件中，精选了150多封精心编纂的书信，并配以梵高的亲笔手稿、珍贵草图以及相关画作。',
  },