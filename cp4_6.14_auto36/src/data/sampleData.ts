export interface Comment {
  id: string;
  username: string;
  timestamp: string;
  content: string;
}

export interface WireframeNode {
  id: string;
  title: string;
  createdAt: string;
  thumbnail: string;
  referenceCount: number;
  comments: Comment[];
  color: string;
}

export interface WireframeEdge {
  source: string;
  target: string;
}

export interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  thumbnail: string;
  referenceCount: number;
  color: string;
  x: number;
  y: number;
}

import type * as d3 from 'd3-force';

const nodeColors = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#10B981',
  '#F59E0B', '#6366F1', '#14B8A6', '#F97316',
  '#6D28D9', '#059669', '#DC2626', '#2563EB',
];

export const sampleNodes: WireframeNode[] = [
  {
    id: 'home',
    title: '首页',
    createdAt: '2026-06-01 09:00',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mobile+app+home+screen+wireframe+ui+design+clean+minimal&image_size=landscape_4_3',
    referenceCount: 5,
    color: nodeColors[0],
    comments: [
      { id: 'c1', username: '设计师小王', timestamp: '2026-06-01 10:30', content: '首页Banner区域需要突出品牌感，建议使用大图+渐变遮罩' },
      { id: 'c2', username: '产品经理李姐', timestamp: '2026-06-01 11:15', content: '底部导航栏图标需要统一风格' },
    ],
  },
  {
    id: 'login',
    title: '登录页',
    createdAt: '2026-06-01 09:30',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=login+screen+wireframe+form+input+fields+modern&image_size=landscape_4_3',
    referenceCount: 3,
    color: nodeColors[1],
    comments: [
      { id: 'c3', username: '设计师小王', timestamp: '2026-06-01 14:00', content: '登录表单需要增加第三方登录入口' },
    ],
  },
  {
    id: 'dashboard',
    title: '仪表盘',
    createdAt: '2026-06-02 10:00',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dashboard+analytics+charts+wireframe+data+visualization&image_size=landscape_4_3',
    referenceCount: 4,
    color: nodeColors[2],
    comments: [],
  },
  {
    id: 'profile',
    title: '个人中心',
    createdAt: '2026-06-02 11:00',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user+profile+page+wireframe+avatar+settings+menu&image_size=landscape_4_3',
    referenceCount: 2,
    color: nodeColors[3],
    comments: [
      { id: 'c4', username: '前端开发小张', timestamp: '2026-06-02 15:00', content: '头像上传需要支持裁剪功能' },
    ],
  },
  {
    id: 'settings',
    title: '设置页',
    createdAt: '2026-06-03 09:00',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=settings+page+wireframe+toggles+switches+list+items&image_size=landscape_4_3',
    referenceCount: 1,
    color: nodeColors[4],
    comments: [],
  },
  {
    id: 'search',
    title: '搜索页',
    createdAt: '2026-06-03 10:30',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=search+page+wireframe+search+bar+filter+results+list&image_size=landscape_4_3',
    referenceCount: 3,
    color: nodeColors[5],
    comments: [
      { id: 'c5', username: '产品经理李姐', timestamp: '2026-06-03 11:00', content: '搜索结果需要支持分页加载' },
    ],
  },
  {
    id: 'detail',
    title: '详情页',
    createdAt: '2026-06-04 09:00',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product+detail+page+wireframe+image+gallery+info&image_size=landscape_4_3',
    referenceCount: 2,
    color: nodeColors[6],
    comments: [
      { id: 'c6', username: '设计师小王', timestamp: '2026-06-04 10:00', content: '图片轮播需要支持手势滑动' },
      { id: 'c7', username: '前端开发小张', timestamp: '2026-06-04 11:00', content: '底部操作栏需要固定在底部' },
    ],
  },
  {
    id: 'cart',
    title: '购物车',
    createdAt: '2026-06-04 11:00',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shopping+cart+page+wireframe+product+list+checkout&image_size=landscape_4_3',
    referenceCount: 2,
    color: nodeColors[7],
    comments: [],
  },
  {
    id: 'checkout',
    title: '结算页',
    createdAt: '2026-06-05 09:00',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=checkout+payment+page+wireframe+form+order+summary&image_size=landscape_4_3',
    referenceCount: 1,
    color: nodeColors[8],
    comments: [
      { id: 'c8', username: '产品经理李姐', timestamp: '2026-06-05 10:00', content: '支付方式选择需要更直观' },
    ],
  },
  {
    id: 'messages',
    title: '消息中心',
    createdAt: '2026-06-05 10:00',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=messaging+notification+center+wireframe+chat+list&image_size=landscape_4_3',
    referenceCount: 2,
    color: nodeColors[9],
    comments: [],
  },
  {
    id: 'onboarding',
    title: '引导页',
    createdAt: '2026-06-06 09:00',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=onboarding+welcome+screens+wireframe+illustration+steps&image_size=landscape_4_3',
    referenceCount: 1,
    color: nodeColors[10],
    comments: [],
  },
  {
    id: 'help',
    title: '帮助中心',
    createdAt: '2026-06-06 11:00',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=help+center+faq+page+wireframe+accordion+list&image_size=landscape_4_3',
    referenceCount: 1,
    color: nodeColors[11],
    comments: [],
  },
];

export const sampleEdges: WireframeEdge[] = [
  { source: 'home', target: 'login' },
  { source: 'home', target: 'dashboard' },
  { source: 'home', target: 'search' },
  { source: 'home', target: 'profile' },
  { source: 'home', target: 'messages' },
  { source: 'login', target: 'home' },
  { source: 'login', target: 'onboarding' },
  { source: 'dashboard', target: 'detail' },
  { source: 'dashboard', target: 'search' },
  { source: 'dashboard', target: 'settings' },
  { source: 'profile', target: 'settings' },
  { source: 'search', target: 'detail' },
  { source: 'detail', target: 'cart' },
  { source: 'cart', target: 'checkout' },
  { source: 'checkout', target: 'home' },
  { source: 'messages', target: 'detail' },
  { source: 'onboarding', target: 'home' },
  { source: 'help', target: 'settings' },
  { source: 'home', target: 'help' },
];
