import { MaterialItem, RoomLayout, RoomType } from './types';

export const ROOM_LAYOUTS: Record<RoomType, RoomLayout> = {
  living: {
    type: 'living',
    name: '客厅',
    width: 800,
    height: 600,
    walls: [
      { x: 0, y: 0, width: 800, height: 20 },
      { x: 0, y: 580, width: 800, height: 20 },
      { x: 0, y: 0, width: 20, height: 600 },
      { x: 780, y: 0, width: 20, height: 600 }
    ],
    doors: [
      { x: 350, y: 580, width: 100, height: 20 }
    ],
    windows: [
      { x: 150, y: 0, width: 150, height: 20 },
      { x: 500, y: 0, width: 150, height: 20 }
    ]
  },
  bedroom: {
    type: 'bedroom',
    name: '卧室',
    width: 600,
    height: 500,
    walls: [
      { x: 0, y: 0, width: 600, height: 20 },
      { x: 0, y: 480, width: 600, height: 20 },
      { x: 0, y: 0, width: 20, height: 500 },
      { x: 580, y: 0, width: 20, height: 500 }
    ],
    doors: [
      { x: 250, y: 480, width: 80, height: 20 }
    ],
    windows: [
      { x: 100, y: 0, width: 120, height: 20 },
      { x: 380, y: 0, width: 120, height: 20 }
    ]
  },
  kitchen: {
    type: 'kitchen',
    name: '厨房',
    width: 500,
    height: 400,
    walls: [
      { x: 0, y: 0, width: 500, height: 20 },
      { x: 0, y: 380, width: 500, height: 20 },
      { x: 0, y: 0, width: 20, height: 400 },
      { x: 480, y: 0, width: 20, height: 400 }
    ],
    doors: [
      { x: 200, y: 380, width: 100, height: 20 }
    ],
    windows: [
      { x: 150, y: 0, width: 200, height: 20 }
    ]
  },
  study: {
    type: 'study',
    name: '书房',
    width: 500,
    height: 450,
    walls: [
      { x: 0, y: 0, width: 500, height: 20 },
      { x: 0, y: 430, width: 500, height: 20 },
      { x: 0, y: 0, width: 20, height: 450 },
      { x: 480, y: 0, width: 20, height: 450 }
    ],
    doors: [
      { x: 200, y: 430, width: 100, height: 20 }
    ],
    windows: [
      { x: 100, y: 0, width: 300, height: 20 }
    ]
  }
};

export const CATEGORY_NAMES: Record<string, string> = {
  sofa: '沙发',
  table: '桌子',
  lamp: '灯具',
  carpet: '地毯',
  decoration: '装饰画',
  bed: '床',
  chair: '椅子',
  storage: '储物柜'
};

const sofaSvg = `<svg viewBox="0 0 100 60"><rect x="5" y="15" width="90" height="40" rx="5" fill="#8B5E3C"/><rect x="10" y="5" width="25" height="15" rx="3" fill="#A0522D"/><rect x="65" y="5" width="25" height="15" rx="3" fill="#A0522D"/></svg>`;
const tableSvg = `<svg viewBox="0 0 80 80"><rect x="5" y="5" width="70" height="70" rx="4" fill="#D2691E"/><rect x="10" y="10" width="60" height="60" rx="2" fill="#CD853F"/></svg>`;
const lampSvg = `<svg viewBox="0 0 40 60"><circle cx="20" cy="15" r="12" fill="#FFD700"/><rect x="17" y="25" width="6" height="30" fill="#8B4513"/><ellipse cx="20" cy="58" rx="12" ry="4" fill="#654321"/></svg>`;
const carpetSvg = `<svg viewBox="0 0 120 80"><rect x="0" y="0" width="120" height="80" rx="6" fill="#DEB887"/><rect x="10" y="10" width="100" height="60" rx="4" fill="#D2B48C"/><rect x="20" y="20" width="80" height="40" rx="2" fill="#F5DEB3"/></svg>`;
const decorationSvg = `<svg viewBox="0 0 60 80"><rect x="5" y="5" width="50" height="70" rx="2" fill="#8B4513"/><rect x="10" y="10" width="40" height="60" fill="#E8A87C"/><circle cx="25" cy="30" r="8" fill="#FFD700"/><path d="M40 50 Q45 40 50 50 Q45 60 40 50" fill="#90EE90"/></svg>`;
const bedSvg = `<svg viewBox="0 0 140 100"><rect x="5" y="20" width="130" height="75" rx="5" fill="#DEB887"/><rect x="10" y="25" width="120" height="45" fill="#F5F5DC"/><rect x="10" y="70" width="120" height="20" fill="#8B4513"/><rect x="5" y="10" width="130" height="15" rx="3" fill="#A0522D"/></svg>`;
const chairSvg = `<svg viewBox="0 0 50 60"><rect x="10" y="5" width="30" height="35" rx="3" fill="#8B4513"/><rect x="5" y="38" width="40" height="8" rx="2" fill="#A0522D"/><rect x="8" y="45" width="6" height="12" fill="#654321"/><rect x="36" y="45" width="6" height="12" fill="#654321"/></svg>`;
const storageSvg = `<svg viewBox="0 0 80 100"><rect x="5" y="5" width="70" height="90" rx="4" fill="#8B4513"/><rect x="10" y="10" width="60" height="35" fill="#A0522D"/><rect x="10" y="50" width="60" height="40" fill="#A0522D"/><circle cx="40" cy="27" r="3" fill="#FFD700"/><circle cx="40" cy="70" r="3" fill="#FFD700"/></svg>`;

export const MATERIALS: MaterialItem[] = [
  {
    id: 'sofa-3seat',
    name: '三人沙发',
    category: 'sofa',
    width: 180,
    height: 90,
    depth: 85,
    colors: ['#8B5E3C', '#A0522D', '#CD853F', '#DEB887'],
    materials: ['布艺', '皮质', '亚麻'],
    thumbnail: '',
    topViewSvg: sofaSvg,
    color: '#8B5E3C'
  },
  {
    id: 'sofa-2seat',
    name: '双人沙发',
    category: 'sofa',
    width: 140,
    height: 85,
    depth: 80,
    colors: ['#8B5E3C', '#696969', '#E8A87C', '#F5E6D3'],
    materials: ['布艺', '皮质'],
    thumbnail: '',
    topViewSvg: sofaSvg,
    color: '#696969'
  },
  {
    id: 'sofa-lshape',
    name: 'L型沙发',
    category: 'sofa',
    width: 240,
    height: 160,
    depth: 90,
    colors: ['#2F4F4F', '#8B5E3C', '#708090'],
    materials: ['布艺', '科技布'],
    thumbnail: '',
    topViewSvg: sofaSvg,
    color: '#2F4F4F'
  },
  {
    id: 'table-coffee',
    name: '茶几',
    category: 'table',
    width: 120,
    height: 60,
    depth: 45,
    colors: ['#D2691E', '#FFFFFF', '#000000', '#808080'],
    materials: ['实木', '玻璃', '大理石'],
    thumbnail: '',
    topViewSvg: tableSvg,
    color: '#D2691E'
  },
  {
    id: 'table-dining',
    name: '餐桌',
    category: 'table',
    width: 140,
    height: 80,
    depth: 75,
    colors: ['#D2691E', '#FFFFFF', '#2F4F4F'],
    materials: ['实木', '岩板'],
    thumbnail: '',
    topViewSvg: tableSvg,
    color: '#2F4F4F'
  },
  {
    id: 'table-side',
    name: '边几',
    category: 'table',
    width: 50,
    height: 50,
    depth: 55,
    colors: ['#D2691E', '#FFD700', '#000000'],
    materials: ['实木', '金属', '玻璃'],
    thumbnail: '',
    topViewSvg: tableSvg,
    color: '#FFD700'
  },
  {
    id: 'lamp-floor',
    name: '落地灯',
    category: 'lamp',
    width: 40,
    height: 40,
    depth: 160,
    colors: ['#FFD700', '#FFFFFF', '#000000', '#E8A87C'],
    materials: ['金属', '木质', '布艺灯罩'],
    thumbnail: '',
    topViewSvg: lampSvg,
    color: '#FFD700'
  },
  {
    id: 'lamp-table',
    name: '台灯',
    category: 'lamp',
    width: 30,
    height: 30,
    depth: 50,
    colors: ['#FFFFFF', '#FFD700', '#E8A87C'],
    materials: ['金属', '陶瓷'],
    thumbnail: '',
    topViewSvg: lampSvg,
    color: '#FFFFFF'
  },
  {
    id: 'lamp-ceiling',
    name: '吸顶灯',
    category: 'lamp',
    width: 60,
    height: 60,
    depth: 15,
    colors: ['#FFFFFF', '#FFD700', '#C0C0C0'],
    materials: ['亚克力', '金属'],
    thumbnail: '',
    topViewSvg: lampSvg,
    color: '#C0C0C0'
  },
  {
    id: 'carpet-living',
    name: '客厅地毯',
    category: 'carpet',
    width: 240,
    height: 160,
    depth: 2,
    colors: ['#DEB887', '#F5F5DC', '#D3D3D3', '#2F4F4F'],
    materials: ['羊毛', '腈纶', '混纺'],
    thumbnail: '',
    topViewSvg: carpetSvg,
    color: '#DEB887'
  },
  {
    id: 'carpet-bedroom',
    name: '卧室地毯',
    category: 'carpet',
    width: 180,
    height: 120,
    depth: 2,
    colors: ['#F5F5DC', '#FFE4E1', '#E6E6FA', '#F0FFF0'],
    materials: ['长绒', '短绒', '羊羔绒'],
    thumbnail: '',
    topViewSvg: carpetSvg,
    color: '#FFE4E1'
  },
  {
    id: 'decoration-painting',
    name: '装饰画',
    category: 'decoration',
    width: 80,
    height: 100,
    depth: 3,
    colors: ['#8B4513', '#000000', '#FFFFFF', '#FFD700'],
    materials: ['油画', '帆布画', '相框'],
    thumbnail: '',
    topViewSvg: decorationSvg,
    color: '#8B4513'
  },
  {
    id: 'decoration-mirror',
    name: '装饰镜',
    category: 'decoration',
    width: 60,
    height: 80,
    depth: 2,
    colors: ['#C0C0C0', '#FFD700', '#000000'],
    materials: ['金属边框', '木质边框'],
    thumbnail: '',
    topViewSvg: decorationSvg,
    color: '#C0C0C0'
  },
  {
    id: 'bed-double',
    name: '双人床',
    category: 'bed',
    width: 180,
    height: 200,
    depth: 50,
    colors: ['#DEB887', '#FFFFFF', '#F5F5DC', '#8B4513'],
    materials: ['实木', '板式', '软包'],
    thumbnail: '',
    topViewSvg: bedSvg,
    color: '#DEB887'
  },
  {
    id: 'bed-single',
    name: '单人床',
    category: 'bed',
    width: 120,
    height: 200,
    depth: 45,
    colors: ['#F5F5DC', '#FFFFFF', '#8B4513'],
    materials: ['实木', '板式'],
    thumbnail: '',
    topViewSvg: bedSvg,
    color: '#F5F5DC'
  },
  {
    id: 'chair-dining',
    name: '餐椅',
    category: 'chair',
    width: 45,
    height: 50,
    depth: 90,
    colors: ['#8B4513', '#FFFFFF', '#000000', '#E8A87C'],
    materials: ['实木', '金属', '塑料'],
    thumbnail: '',
    topViewSvg: chairSvg,
    color: '#8B4513'
  },
  {
    id: 'chair-office',
    name: '办公椅',
    category: 'chair',
    width: 60,
    height: 60,
    depth: 110,
    colors: ['#000000', '#696969', '#2F4F4F'],
    materials: ['网布', '皮质', '人体工学'],
    thumbnail: '',
    topViewSvg: chairSvg,
    color: '#000000'
  },
  {
    id: 'storage-wardrobe',
    name: '衣柜',
    category: 'storage',
    width: 200,
    height: 60,
    depth: 220,
    colors: ['#8B4513', '#FFFFFF', '#F5E6D3'],
    materials: ['实木', '板式', '定制'],
    thumbnail: '',
    topViewSvg: storageSvg,
    color: '#8B4513'
  },
  {
    id: 'storage-bookshelf',
    name: '书架',
    category: 'storage',
    width: 120,
    height: 35,
    depth: 200,
    colors: ['#8B4513', '#FFFFFF', '#000000'],
    materials: ['实木', '金属', '板式'],
    thumbnail: '',
    topViewSvg: storageSvg,
    color: '#FFFFFF'
  },
  {
    id: 'storage-cabinet',
    name: '电视柜',
    category: 'storage',
    width: 180,
    height: 45,
    depth: 50,
    colors: ['#8B4513', '#FFFFFF', '#000000'],
    materials: ['实木', '板式'],
    thumbnail: '',
    topViewSvg: storageSvg,
    color: '#000000'
  }
];
