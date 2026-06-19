export interface SaleRecord {
  id: string;
  date: string;
  customerName: string;
}

export interface TrajectoryNode {
  id: string;
  type: 'purchase' | 'sale';
  date: string;
  summary: string;
}

export interface Feedback {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface VinylRecord {
  id: string;
  title: string;
  artist: string;
  year: number;
  version: string;
  stock: number;
  price: number;
  coverUrl?: string;
  sales: SaleRecord[];
  trajectory: TrajectoryNode[];
  feedbacks: Feedback[];
}

export const initialRecords: VinylRecord[] = [
  {
    id: 'r1',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    year: 1959,
    version: '180g 限量蓝胶版',
    stock: 2,
    price: 388,
    sales: [
      { id: 's1', date: '2026-03-15', customerName: '李**' },
      { id: 's2', date: '2026-01-22', customerName: '王**' },
    ],
    trajectory: [
      { id: 't1', type: 'purchase', date: '2025-11-08', summary: '从日本收藏家处购入 3 张' },
      { id: 't2', type: 'sale', date: '2026-01-22', summary: '售出给王姓顾客' },
      { id: 't3', type: 'sale', date: '2026-03-15', summary: '售出给李姓顾客' },
    ],
    feedbacks: [
      { id: 'f1', rating: 5, comment: '音质太棒了，蓝胶颜色绝美', createdAt: '2026-03-16' },
    ],
  },
  {
    id: 'r2',
    title: 'Abbey Road',
    artist: 'The Beatles',
    year: 1969,
    version: '50周年纪念版',
    stock: 1,
    price: 520,
    sales: [
      { id: 's3', date: '2026-05-02', customerName: '张**' },
    ],
    trajectory: [
      { id: 't4', type: 'purchase', date: '2026-02-10', summary: '英国原版进口 2 张' },
      { id: 't5', type: 'sale', date: '2026-05-02', summary: '售出给张姓顾客' },
    ],
    feedbacks: [],
  },
  {
    id: 'r3',
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    year: 1973,
    version: '水晶透明胶版',
    stock: 0,
    price: 680,
    sales: [
      { id: 's4', date: '2026-04-18', customerName: '陈**' },
      { id: 's5', date: '2026-02-28', customerName: '刘**' },
    ],
    trajectory: [
      { id: 't6', type: 'purchase', date: '2025-12-20', summary: '欧洲私人收藏 2 张' },
      { id: 't7', type: 'sale', date: '2026-02-28', summary: '售出给刘姓顾客' },
      { id: 't8', type: 'sale', date: '2026-04-18', summary: '售出给陈姓顾客' },
    ],
    feedbacks: [
      { id: 'f2', rating: 5, comment: '经典中的经典，透明胶颜值爆表', createdAt: '2026-04-19' },
      { id: 'f3', rating: 4, comment: '包装稍微有点磨损，但碟片很新', createdAt: '2026-03-01' },
    ],
  },
  {
    id: 'r4',
    title: 'Blue',
    artist: 'Joni Mitchell',
    year: 1971,
    version: '复刻 180g 版',
    stock: 3,
    price: 268,
    sales: [],
    trajectory: [
      { id: 't9', type: 'purchase', date: '2026-04-05', summary: '美国华纳唱片公司直购 5 张' },
    ],
    feedbacks: [],
  },
  {
    id: 'r5',
    title: 'OK Computer',
    artist: 'Radiohead',
    year: 1997,
    version: '双碟 180g 重制版',
    stock: 2,
    price: 458,
    sales: [
      { id: 's6', date: '2026-06-01', customerName: '赵**' },
    ],
    trajectory: [
      { id: 't10', type: 'purchase', date: '2026-03-12', summary: '英国 XL Recordings 进口 3 张' },
      { id: 't11', type: 'sale', date: '2026-06-01', summary: '售出给赵姓顾客' },
    ],
    feedbacks: [
      { id: 'f4', rating: 5, comment: '重制版音质提升明显，值得收藏', createdAt: '2026-06-02' },
    ],
  },
  {
    id: 'r6',
    title: 'Nevermind',
    artist: 'Nirvana',
    year: 1991,
    version: '30周年 银胶限定版',
    stock: 1,
    price: 598,
    sales: [],
    trajectory: [
      { id: 't12', type: 'purchase', date: '2026-01-15', summary: '美国 DGC 原厂限量 1 张' },
    ],
    feedbacks: [],
  },
  {
    id: 'r7',
    title: 'A Love Supreme',
    artist: 'John Coltrane',
    year: 1965,
    version: 'Acoustic Sounds 复刻版',
    stock: 4,
    price: 328,
    sales: [
      { id: 's7', date: '2026-05-20', customerName: '孙**' },
    ],
    trajectory: [
      { id: 't13', type: 'purchase', date: '2026-02-28', summary: '美国 Impulse! Records 购入 5 张' },
      { id: 't14', type: 'sale', date: '2026-05-20', summary: '售出给孙姓顾客' },
    ],
    feedbacks: [],
  },
  {
    id: 'r8',
    title: 'Rumours',
    artist: 'Fleetwood Mac',
    year: 1977,
    version: '45周年 金胶限量版',
    stock: 0,
    price: 498,
    sales: [
      { id: 's8', date: '2026-04-10', customerName: '周**' },
      { id: 's9', date: '2026-03-08', customerName: '吴**' },
    ],
    trajectory: [
      { id: 't15', type: 'purchase', date: '2026-02-01', summary: '华纳限量金胶 2 张' },
      { id: 't16', type: 'sale', date: '2026-03-08', summary: '售出给吴姓顾客' },
      { id: 't17', type: 'sale', date: '2026-04-10', summary: '售出给周姓顾客' },
    ],
    feedbacks: [
      { id: 'f5', rating: 5, comment: '金胶在灯光下闪闪发光，音质一流', createdAt: '2026-04-11' },
    ],
  },
];
