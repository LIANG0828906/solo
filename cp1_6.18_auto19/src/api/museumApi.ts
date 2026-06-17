import type { Zone, Exhibit, QuizQuestion } from '@/types';

const zones: Zone[] = [
  { id: 'zone-1', name: '古代文明', order: 1 },
  { id: 'zone-2', name: '中世纪', order: 2 },
  { id: 'zone-3', name: '文艺复兴', order: 3 },
  { id: 'zone-4', name: '近代历史', order: 4 },
];

const exhibits: Exhibit[] = [
  {
    id: 'exhibit-1',
    name: '司母戊鼎',
    era: '商代(约公元前1300年)',
    description: '迄今出土的最重的青铜器，象征商代青铜铸造的巅峰',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="35" width="60" height="45" rx="3" fill="#8B4513"/><rect x="35" y="25" width="50" height="12" rx="2" fill="#D4A017"/><rect x="40" y="20" width="8" height="8" rx="1" fill="#D4A017"/><rect x="52" y="18" width="16" height="10" rx="2" fill="#D4A017"/><rect x="33" y="80" width="8" height="18" rx="2" fill="#8B4513"/><rect x="56" y="80" width="8" height="18" rx="2" fill="#8B4513"/><rect x="79" y="80" width="8" height="18" rx="2" fill="#8B4513"/><rect x="35" y="45" width="50" height="3" fill="#D4A017" opacity="0.6"/><rect x="35" y="55" width="50" height="3" fill="#D4A017" opacity="0.4"/><circle cx="50" cy="62" r="4" fill="#C4A882" opacity="0.7"/><circle cx="70" cy="62" r="4" fill="#C4A882" opacity="0.7"/></svg>',
    zoneId: 'zone-1',
  },
  {
    id: 'exhibit-2',
    name: '彩陶罐',
    era: '新石器时代(约公元前5000年)',
    description: '仰韶文化典型器物，饰有精美鱼纹图案',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="M35 40 Q35 25 60 25 Q85 25 85 40 L82 80 Q82 90 60 90 Q38 90 38 80 Z" fill="#C4A882"/><path d="M35 40 Q35 25 60 25 Q85 25 85 40" fill="none" stroke="#8B4513" stroke-width="2"/><path d="M40 55 Q50 50 60 55 Q70 60 80 55" fill="none" stroke="#8B4513" stroke-width="1.5"/><path d="M42 65 Q52 60 62 65 Q72 70 78 65" fill="none" stroke="#8B4513" stroke-width="1.5"/><ellipse cx="52" cy="52" rx="6" ry="3" fill="none" stroke="#D4A017" stroke-width="1.5"/><ellipse cx="68" cy="72" rx="6" ry="3" fill="none" stroke="#D4A017" stroke-width="1.5"/><circle cx="60" cy="35" r="2" fill="#8B4513"/><line x1="48" y1="48" x2="55" y2="56" stroke="#D4A017" stroke-width="1"/></svg>',
    zoneId: 'zone-1',
  },
  {
    id: 'exhibit-3',
    name: '玉璧',
    era: '西周(约公元前1000年)',
    description: '礼天之物，象征古人天地和谐的宇宙观',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="45" fill="#C4A882" opacity="0.3"/><circle cx="60" cy="60" r="45" fill="none" stroke="#8B4513" stroke-width="3"/><circle cx="60" cy="60" r="18" fill="#1a1a2e"/><circle cx="60" cy="60" r="18" fill="none" stroke="#8B4513" stroke-width="3"/><circle cx="60" cy="60" r="32" fill="none" stroke="#D4A017" stroke-width="1" opacity="0.6"/><path d="M60 17 L63 23 L60 20 L57 23 Z" fill="#D4A017"/><path d="M60 97 L63 93 L60 96 L57 93 Z" fill="#D4A017"/><path d="M17 60 L23 57 L20 60 L23 63 Z" fill="#D4A017"/><path d="M97 60 L93 57 L96 60 L93 63 Z" fill="#D4A017"/></svg>',
    zoneId: 'zone-1',
  },
  {
    id: 'exhibit-4',
    name: '骑士盔甲',
    era: '15世纪',
    description: '哥特式全身板甲，重约25公斤',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="M45 25 Q60 18 75 25 L78 45 Q78 55 72 58 L72 60 L80 62 L82 85 L70 85 L68 65 L52 65 L50 85 L38 85 L40 62 L48 60 L48 58 Q42 55 42 45 Z" fill="#8B4513"/><path d="M52 30 Q60 26 68 30 L70 42 Q70 48 60 48 Q50 48 50 42 Z" fill="#C4A882" opacity="0.5"/><rect x="55" y="48" width="10" height="15" rx="1" fill="#D4A017" opacity="0.6"/><line x1="42" y1="45" x2="38" y2="65" stroke="#8B4513" stroke-width="4" stroke-linecap="round"/><line x1="78" y1="45" x2="82" y2="65" stroke="#8B4513" stroke-width="4" stroke-linecap="round"/><circle cx="56" cy="35" r="2" fill="#D4A017"/><circle cx="64" cy="35" r="2" fill="#D4A017"/><line x1="50" y1="85" x2="48" y2="100" stroke="#8B4513" stroke-width="5" stroke-linecap="round"/><line x1="70" y1="85" x2="72" y2="100" stroke="#8B4513" stroke-width="5" stroke-linecap="round"/></svg>',
    zoneId: 'zone-2',
  },
  {
    id: 'exhibit-5',
    name: '羊皮卷',
    era: '12世纪',
    description: '记载中世纪修道院的手抄本',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="20" width="60" height="80" rx="3" fill="#C4A882"/><rect x="35" y="25" width="50" height="70" rx="2" fill="#D4A017" opacity="0.2"/><path d="M42 35 Q60 32 78 35" fill="none" stroke="#8B4513" stroke-width="1.5"/><path d="M42 43 Q60 40 78 43" fill="none" stroke="#8B4513" stroke-width="1.5"/><path d="M42 51 Q60 48 78 51" fill="none" stroke="#8B4513" stroke-width="1.5"/><path d="M42 59 Q60 56 78 59" fill="none" stroke="#8B4513" stroke-width="1.5"/><path d="M42 67 Q55 64 65 67" fill="none" stroke="#8B4513" stroke-width="1.5"/><path d="M42 75 Q50 72 58 75" fill="none" stroke="#8B4513" stroke-width="1.5"/><circle cx="72" cy="72" r="6" fill="#D4A017" opacity="0.4"/><path d="M72 68 L74 72 L72 70 L70 72 Z" fill="#8B4513"/><rect x="25" y="20" width="8" height="80" rx="2" fill="#8B4513"/></svg>',
    zoneId: 'zone-2',
  },
  {
    id: 'exhibit-6',
    name: '十字军旗帜',
    era: '11世纪',
    description: '第一次十字军东征的战旗',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><line x1="30" y1="15" x2="30" y2="105" stroke="#8B4513" stroke-width="4" stroke-linecap="round"/><circle cx="30" cy="15" r="4" fill="#D4A017"/><path d="M32 22 L90 22 L90 70 L32 70 Z" fill="#C4A882"/><path d="M32 22 L90 22 L90 70 L32 70 Z" fill="none" stroke="#8B4513" stroke-width="1.5"/><rect x="55" y="30" width="12" height="35" rx="1" fill="#D4A017"/><rect x="46" y="38" width="30" height="10" rx="1" fill="#D4A017"/><path d="M32 70 L36 67 L36 73 Z" fill="#8B4513"/><path d="M90 70 L86 67 L86 73 Z" fill="#8B4513"/></svg>',
    zoneId: 'zone-2',
  },
  {
    id: 'exhibit-7',
    name: '大卫雕塑',
    era: '1504年',
    description: '米开朗基罗的传世杰作，高5.17米',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="M52 15 Q60 10 68 15 L70 28 Q70 34 60 34 Q50 34 50 28 Z" fill="#C4A882"/><path d="M48 34 L72 34 L74 50 Q74 55 60 55 Q46 55 46 50 Z" fill="#C4A882"/><path d="M46 55 L74 55 L76 90 Q76 95 60 95 Q44 95 44 90 Z" fill="#C4A882"/><line x1="46" y1="42" x2="30" y2="58" stroke="#C4A882" stroke-width="5" stroke-linecap="round"/><line x1="74" y1="42" x2="85" y2="55" stroke="#C4A882" stroke-width="5" stroke-linecap="round"/><line x1="48" y1="95" x2="44" y2="112" stroke="#C4A882" stroke-width="6" stroke-linecap="round"/><line x1="72" y1="95" x2="76" y2="112" stroke="#C4A882" stroke-width="6" stroke-linecap="round"/><rect x="40" y="10" width="40" height="2" rx="1" fill="#D4A017"/><circle cx="56" cy="23" r="1.5" fill="#8B4513"/><circle cx="64" cy="23" r="1.5" fill="#8B4513"/><path d="M57 28 Q60 30 63 28" fill="none" stroke="#8B4513" stroke-width="1"/><rect x="38" y="108" width="44" height="5" rx="1" fill="#8B4513"/></svg>',
    zoneId: 'zone-3',
  },
  {
    id: 'exhibit-8',
    name: '蒙娜丽莎',
    era: '1503年',
    description: '达芬奇最神秘的微笑',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="10" width="80" height="100" rx="3" fill="#8B4513"/><rect x="25" y="15" width="70" height="90" rx="2" fill="#C4A882"/><path d="M45 35 Q60 30 75 35 L78 55 Q78 68 60 70 Q42 68 42 55 Z" fill="#D4A017" opacity="0.6"/><path d="M48 40 Q60 36 72 40 L74 52 Q74 62 60 64 Q46 62 46 52 Z" fill="#C4A882" opacity="0.5"/><circle cx="53" cy="48" r="2" fill="#8B4513"/><circle cx="67" cy="48" r="2" fill="#8B4513"/><path d="M55 56 Q60 59 65 56" fill="none" stroke="#8B4513" stroke-width="1"/><path d="M42 70 Q42 85 50 90 Q60 95 70 90 Q78 85 78 70" fill="#D4A017" opacity="0.5"/><rect x="35" y="10" width="50" height="3" fill="#D4A017"/><rect x="35" y="107" width="50" height="3" fill="#D4A017"/></svg>',
    zoneId: 'zone-3',
  },
  {
    id: 'exhibit-9',
    name: '天文望远镜',
    era: '1609年',
    description: '伽利略改良的折射望远镜',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><line x1="55" y1="85" x2="55" y2="55" stroke="#8B4513" stroke-width="4"/><line x1="55" y1="85" x2="42" y2="100" stroke="#8B4513" stroke-width="3" stroke-linecap="round"/><line x1="55" y1="85" x2="68" y2="100" stroke="#8B4513" stroke-width="3" stroke-linecap="round"/><line x1="55" y1="85" x2="55" y2="100" stroke="#8B4513" stroke-width="3" stroke-linecap="round"/><line x1="30" y1="50" x2="80" y2="38" stroke="#C4A882" stroke-width="10" stroke-linecap="round"/><line x1="30" y1="50" x2="80" y2="38" stroke="#8B4513" stroke-width="6" stroke-linecap="round"/><circle cx="28" cy="51" r="8" fill="none" stroke="#D4A017" stroke-width="2"/><circle cx="82" cy="37" r="6" fill="#8B4513"/><circle cx="82" cy="37" r="3" fill="#C4A882"/><circle cx="55" cy="55" r="3" fill="#D4A017"/></svg>',
    zoneId: 'zone-3',
  },
  {
    id: 'exhibit-10',
    name: '蒸汽机',
    era: '1769年',
    description: '瓦特改良的蒸汽机，工业革命的标志',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="25" y="50" width="45" height="40" rx="4" fill="#8B4513"/><rect x="30" y="55" width="35" height="12" rx="2" fill="#C4A882" opacity="0.6"/><circle cx="48" cy="75" r="10" fill="none" stroke="#D4A017" stroke-width="2"/><circle cx="48" cy="75" r="4" fill="#D4A017"/><rect x="70" y="60" width="25" height="20" rx="2" fill="#8B4513"/><rect x="72" y="62" width="10" height="16" rx="1" fill="#C4A882" opacity="0.4"/><line x1="70" y1="70" x2="60" y2="70" stroke="#D4A017" stroke-width="3"/><path d="M35 45 Q40 35 45 45" fill="none" stroke="#C4A882" stroke-width="2" opacity="0.6"/><path d="M45 40 Q50 30 55 40" fill="none" stroke="#C4A882" stroke-width="2" opacity="0.4"/><path d="M55 45 Q60 35 65 45" fill="none" stroke="#C4A882" stroke-width="2" opacity="0.3"/><rect x="30" y="90" width="55" height="8" rx="2" fill="#8B4513"/><circle cx="40" cy="98" r="5" fill="#D4A017"/><circle cx="60" cy="98" r="5" fill="#D4A017"/><circle cx="80" cy="98" r="5" fill="#D4A017"/></svg>',
    zoneId: 'zone-4',
  },
  {
    id: 'exhibit-11',
    name: '怀表',
    era: '18世纪',
    description: '精密机械制造的杰作',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="62" r="40" fill="#8B4513"/><circle cx="60" cy="62" r="36" fill="#C4A882"/><circle cx="60" cy="62" r="32" fill="#1a1a2e" opacity="0.1"/><circle cx="60" cy="62" r="32" fill="none" stroke="#D4A017" stroke-width="1.5"/><circle cx="60" cy="62" r="2" fill="#D4A017"/><line x1="60" y1="62" x2="60" y2="40" stroke="#8B4513" stroke-width="2" stroke-linecap="round"/><line x1="60" y1="62" x2="75" y2="58" stroke="#8B4513" stroke-width="1.5" stroke-linecap="round"/><line x1="60" y1="34" x2="60" y2="38" stroke="#D4A017" stroke-width="1.5"/><line x1="60" y1="86" x2="60" y2="82" stroke="#D4A017" stroke-width="1.5"/><line x1="32" y1="62" x2="36" y2="62" stroke="#D4A017" stroke-width="1.5"/><line x1="88" y1="62" x2="84" y2="62" stroke="#D4A017" stroke-width="1.5"/><rect x="55" y="16" width="10" height="10" rx="2" fill="#D4A017"/><circle cx="60" cy="18" r="4" fill="none" stroke="#8B4513" stroke-width="1.5"/></svg>',
    zoneId: 'zone-4',
  },
  {
    id: 'exhibit-12',
    name: '电报机',
    era: '1837年',
    description: '莫尔斯电报机，信息革命的起点',
    svgIcon: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="45" width="80" height="45" rx="4" fill="#8B4513"/><rect x="25" y="50" width="70" height="35" rx="2" fill="#C4A882" opacity="0.3"/><rect x="30" y="55" width="25" height="8" rx="2" fill="#D4A017" opacity="0.6"/><circle cx="80" cy="59" r="6" fill="#8B4513"/><circle cx="80" cy="59" r="3" fill="#D4A017"/><rect x="30" y="70" width="55" height="3" rx="1" fill="#8B4513" opacity="0.5"/><path d="M75 30 L75 45" stroke="#8B4513" stroke-width="3"/><path d="M75 30 Q75 25 80 25 Q85 25 85 30 L85 45" stroke="#C4A882" stroke-width="2" fill="none"/><circle cx="80" cy="25" r="3" fill="#D4A017"/><line x1="40" y1="90" x2="40" y2="100" stroke="#8B4513" stroke-width="3"/><line x1="80" y1="90" x2="80" y2="100" stroke="#8B4513" stroke-width="3"/><rect x="35" y="100" width="50" height="5" rx="1" fill="#8B4513"/><circle cx="48" cy="59" r="2" fill="#D4A017"/><circle cx="56" cy="59" r="2" fill="#D4A017"/><circle cx="64" cy="59" r="2" fill="#D4A017"/></svg>',
    zoneId: 'zone-4',
  },
];

const quizzes: QuizQuestion[] = [
  {
    id: 'quiz-1',
    exhibitId: 'exhibit-1',
    question: '司母戊鼎是哪个朝代的青铜器？',
    options: ['商代', '周代', '秦代', '汉代'],
    correctIndex: 0,
  },
  {
    id: 'quiz-2',
    exhibitId: 'exhibit-2',
    question: '彩陶罐属于哪一文化的典型器物？',
    options: ['龙山文化', '仰韶文化', '大汶口文化', '良渚文化'],
    correctIndex: 1,
  },
  {
    id: 'quiz-3',
    exhibitId: 'exhibit-3',
    question: '玉璧在古代的主要用途是什么？',
    options: ['装饰品', '祭祀礼器', '货币', '乐器'],
    correctIndex: 1,
  },
  {
    id: 'quiz-4',
    exhibitId: 'exhibit-4',
    question: '哥特式板甲主要出现在哪个世纪？',
    options: ['12世纪', '13世纪', '15世纪', '17世纪'],
    correctIndex: 2,
  },
  {
    id: 'quiz-5',
    exhibitId: 'exhibit-5',
    question: '中世纪手抄本通常在哪里制作？',
    options: ['宫廷', '修道院', '大学', '工坊'],
    correctIndex: 1,
  },
  {
    id: 'quiz-6',
    exhibitId: 'exhibit-6',
    question: '第一次十字军东征发生在哪个世纪？',
    options: ['10世纪', '11世纪', '12世纪', '13世纪'],
    correctIndex: 1,
  },
  {
    id: 'quiz-7',
    exhibitId: 'exhibit-7',
    question: '大卫雕塑的创作者是谁？',
    options: ['拉斐尔', '达芬奇', '米开朗基罗', '多纳泰罗'],
    correctIndex: 2,
  },
  {
    id: 'quiz-8',
    exhibitId: 'exhibit-8',
    question: '蒙娜丽莎现藏于哪座博物馆？',
    options: ['大英博物馆', '卢浮宫', '乌菲兹美术馆', '大都会博物馆'],
    correctIndex: 1,
  },
  {
    id: 'quiz-9',
    exhibitId: 'exhibit-9',
    question: '伽利略改良望远镜是在哪一年？',
    options: ['1609年', '1492年', '1543年', '1687年'],
    correctIndex: 0,
  },
  {
    id: 'quiz-10',
    exhibitId: 'exhibit-10',
    question: '瓦特改良蒸汽机是在哪一年？',
    options: ['1712年', '1769年', '1800年', '1840年'],
    correctIndex: 1,
  },
  {
    id: 'quiz-11',
    exhibitId: 'exhibit-11',
    question: '18世纪怀表主要使用什么动力源？',
    options: ['电力', '发条弹簧', '水力', '气压'],
    correctIndex: 1,
  },
  {
    id: 'quiz-12',
    exhibitId: 'exhibit-12',
    question: '莫尔斯电报机发明于哪一年？',
    options: ['1810年', '1827年', '1837年', '1850年'],
    correctIndex: 2,
  },
];

export function getZones(): Zone[] {
  return [...zones].sort((a, b) => a.order - b.order);
}

export function getExhibitsByZone(zoneId: string): Exhibit[] {
  return exhibits.filter((e) => e.zoneId === zoneId);
}

export function getQuizForExhibit(exhibitId: string): QuizQuestion | null {
  return quizzes.find((q) => q.exhibitId === exhibitId) ?? null;
}
