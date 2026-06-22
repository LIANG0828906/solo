import { Civilization, Event } from '../types';
import { v4 as uuidv4 } from 'uuid';

const REGION_COLORS: Record<string, string> = {
  '非洲': '#E53935',
  '中东': '#FB8C00',
  '欧洲': '#43A047',
  '亚洲': '#1E88E5',
  '美洲': '#8E24AA',
  '大洋洲': '#00ACC1',
};

export const CIVILIZATIONS: Civilization[] = [
  {
    id: 'ancient-egypt',
    name: '古埃及',
    startYear: -3100,
    endYear: -30,
    region: '非洲',
    color: REGION_COLORS['非洲'],
  },
  {
    id: 'mesopotamia',
    name: '美索不达米亚',
    startYear: -3500,
    endYear: -539,
    region: '中东',
    color: REGION_COLORS['中东'],
  },
  {
    id: 'ancient-greece',
    name: '古希腊',
    startYear: -800,
    endYear: -146,
    region: '欧洲',
    color: REGION_COLORS['欧洲'],
  },
  {
    id: 'ancient-rome',
    name: '古罗马',
    startYear: -753,
    endYear: 476,
    region: '欧洲',
    color: REGION_COLORS['欧洲'],
  },
  {
    id: 'ancient-china',
    name: '古代中国',
    startYear: -2070,
    endYear: 220,
    region: '亚洲',
    color: REGION_COLORS['亚洲'],
  },
  {
    id: 'tang-dynasty',
    name: '唐朝',
    startYear: 618,
    endYear: 907,
    region: '亚洲',
    color: REGION_COLORS['亚洲'],
  },
  {
    id: 'song-dynasty',
    name: '宋朝',
    startYear: 960,
    endYear: 1279,
    region: '亚洲',
    color: REGION_COLORS['亚洲'],
  },
  {
    id: 'renaissance',
    name: '文艺复兴',
    startYear: 1400,
    endYear: 1600,
    region: '欧洲',
    color: REGION_COLORS['欧洲'],
  },
  {
    id: 'age-of-exploration',
    name: '大航海时代',
    startYear: 1450,
    endYear: 1700,
    region: '欧洲',
    color: REGION_COLORS['欧洲'],
  },
  {
    id: 'industrial-revolution',
    name: '工业革命',
    startYear: 1760,
    endYear: 1840,
    region: '欧洲',
    color: REGION_COLORS['欧洲'],
  },
  {
    id: 'maya',
    name: '玛雅文明',
    startYear: -2000,
    endYear: 1500,
    region: '美洲',
    color: REGION_COLORS['美洲'],
  },
  {
    id: 'islamic-golden-age',
    name: '伊斯兰黄金时代',
    startYear: 750,
    endYear: 1258,
    region: '中东',
    color: REGION_COLORS['中东'],
  },
];

const createEvent = (
  name: string,
  year: number,
  civilizationId: string,
  region: string,
  description: string,
  influenceWeight: number,
  relatedEventIds: string[] = []
): Omit<Event, 'id'> => ({
  name,
  year,
  civilizationId,
  region,
  description,
  influenceWeight,
  relatedEventIds,
});

const eventsData: Omit<Event, 'id'>[] = [
  createEvent(
    '古埃及统一',
    -3100,
    'ancient-egypt',
    '非洲',
    '上下埃及统一，法老王朝开始，建立了人类历史上第一个统一的国家政权。',
    0.95
  ),
  createEvent(
    '金字塔建造',
    -2560,
    'ancient-egypt',
    '非洲',
    '胡夫金字塔建成，代表古埃及建筑和工程技术的巅峰，成为古代世界七大奇迹之一。',
    0.9
  ),
  createEvent(
    '图坦卡蒙登基',
    -1332,
    'ancient-egypt',
    '非洲',
    '年轻法老图坦卡蒙登基，其陵墓是保存最完整的皇家陵墓，为研究古埃及提供了大量珍贵文物。',
    0.6
  ),
  createEvent(
    '拉美西斯二世统治',
    -1279,
    'ancient-egypt',
    '非洲',
    '拉美西斯二世在位期间，埃及国力达到鼎盛，进行了大规模的建筑工程和军事扩张。',
    0.8
  ),
  createEvent(
    '楔形文字发明',
    -3400,
    'mesopotamia',
    '中东',
    '苏美尔人发明楔形文字，是人类已知最早的书写系统之一，奠定了文明记录的基础。',
    0.95
  ),
  createEvent(
    '汉谟拉比法典',
    -1754,
    'mesopotamia',
    '中东',
    '古巴比伦国王汉谟拉比颁布的法典，是世界上现存最早的较为完整的成文法典。',
    0.9
  ),
  createEvent(
    '城邦制度兴起',
    -800,
    'ancient-greece',
    '欧洲',
    '古希腊城邦制度形成，雅典、斯巴达等城邦兴起，开创了民主政治的先河。',
    0.85
  ),
  createEvent(
    '第一届古代奥运会',
    -776,
    'ancient-greece',
    '欧洲',
    '第一届古代奥林匹克运动会在奥林匹亚举行，开创了体育竞技的传统，成为现代奥运会的源头。',
    0.8
  ),
  createEvent(
    '苏格拉底诞生',
    -470,
    'ancient-greece',
    '欧洲',
    '古希腊哲学家苏格拉底诞生，西方哲学的奠基人之一，其思想影响了柏拉图和亚里士多德。',
    0.9
  ),
  createEvent(
    '亚历山大东征',
    -334,
    'ancient-greece',
    '欧洲',
    '亚历山大大帝开始东征，建立了横跨欧亚非的庞大帝国，促进了东西方文化的交流与融合。',
    0.95
  ),
  createEvent(
    '罗马共和国建立',
    -509,
    'ancient-rome',
    '欧洲',
    '罗马共和国建立，推翻了君主制，建立了由元老院、执政官和公民大会组成的共和政体。',
    0.85
  ),
  createEvent(
    '凯撒大帝遇刺',
    -44,
    'ancient-rome',
    '欧洲',
    '尤利乌斯·凯撒在元老院遇刺身亡，结束了罗马共和国，为罗马帝国的建立铺平了道路。',
    0.9
  ),
  createEvent(
    '罗马帝国建立',
    -27,
    'ancient-rome',
    '欧洲',
    '屋大维被授予奥古斯都称号，罗马帝国正式建立，开启了罗马长达数百年的繁荣时期。',
    0.95
  ),
  createEvent(
    '西罗马帝国灭亡',
    476,
    'ancient-rome',
    '欧洲',
    '日耳曼人首领奥多亚克废黜最后一位西罗马皇帝，标志着西罗马帝国的灭亡和欧洲中世纪的开始。',
    0.9
  ),
  createEvent(
    '夏朝建立',
    -2070,
    'ancient-china',
    '亚洲',
    '大禹建立夏朝，中国历史上第一个世袭制王朝，标志着中国从原始社会进入奴隶社会。',
    0.85
  ),
  createEvent(
    '秦始皇统一六国',
    -221,
    'ancient-china',
    '亚洲',
    '秦王嬴政统一六国，建立中国历史上第一个中央集权的大一统王朝，统一文字、度量衡和货币。',
    0.98
  ),
  createEvent(
    '丝绸之路开辟',
    -138,
    'ancient-china',
    '亚洲',
    '张骞出使西域，开辟了连接东西方的丝绸之路，促进了欧亚大陆的经济文化交流。',
    0.95
  ),
  createEvent(
    '唐朝建立',
    618,
    'tang-dynasty',
    '亚洲',
    '李渊建立唐朝，开启了中国历史上最辉煌的朝代之一，政治、经济、文化全面繁荣。',
    0.95
  ),
  createEvent(
    '贞观之治',
    627,
    'tang-dynasty',
    '亚洲',
    '唐太宗李世民统治时期，政治清明、经济繁荣、文化昌盛，史称贞观之治，成为后世治世的典范。',
    0.9
  ),
  createEvent(
    '文成公主入藏',
    641,
    'tang-dynasty',
    '亚洲',
    '文成公主远嫁吐蕃松赞干布，促进了汉藏两族的友好关系和文化交流。',
    0.75
  ),
  createEvent(
    '安史之乱',
    755,
    'tang-dynasty',
    '亚洲',
    '安禄山、史思明发动叛乱，持续八年之久，是唐朝由盛转衰的转折点，对中国历史产生了深远影响。',
    0.85
  ),
  createEvent(
    '宋朝建立',
    960,
    'song-dynasty',
    '亚洲',
    '赵匡胤陈桥兵变，黄袍加身，建立宋朝，结束了五代十国的分裂局面，开启了经济文化高度繁荣的时代。',
    0.9
  ),
  createEvent(
    '活字印刷术发明',
    1040,
    'song-dynasty',
    '亚洲',
    '毕昇发明泥活字印刷术，是印刷史上的重大革命，对世界文明的发展产生了深远影响。',
    0.95
  ),
  createEvent(
    '指南针应用于航海',
    1100,
    'song-dynasty',
    '亚洲',
    '指南针开始广泛应用于航海，为大航海时代的到来提供了技术基础，促进了世界贸易的发展。',
    0.9
  ),
  createEvent(
    '文艺复兴开始',
    1400,
    'renaissance',
    '欧洲',
    '文艺复兴运动在意大利兴起，以人文主义为核心，在文学、艺术、科学等领域取得了辉煌成就。',
    0.98
  ),
  createEvent(
    '达芬奇诞生',
    1452,
    'renaissance',
    '欧洲',
    '列奥纳多·达·芬奇诞生，文艺复兴时期最杰出的代表人物，在绘画、科学、工程等领域都有卓越贡献。',
    0.85
  ),
  createEvent(
    '印刷机发明',
    1440,
    'renaissance',
    '欧洲',
    '古腾堡发明金属活字印刷机，使书籍的大规模生产成为可能，推动了知识的传播和文艺复兴的发展。',
    0.95
  ),
  createEvent(
    '哥伦布发现新大陆',
    1492,
    'age-of-exploration',
    '欧洲',
    '克里斯托弗·哥伦布率领船队横渡大西洋，到达美洲大陆，开启了欧洲对美洲的探索和殖民。',
    0.98
  ),
  createEvent(
    '达伽马到达印度',
    1498,
    'age-of-exploration',
    '欧洲',
    '瓦斯科·达伽马率领船队绕过好望角，到达印度，开辟了欧洲到亚洲的新航路。',
    0.9
  ),
  createEvent(
    '麦哲伦环球航行',
    1519,
    'age-of-exploration',
    '欧洲',
    '费迪南德·麦哲伦率领船队开始环球航行，证明了地球是圆的，为地理学的发展做出了重要贡献。',
    0.95
  ),
  createEvent(
    '蒸汽机发明',
    1769,
    'industrial-revolution',
    '欧洲',
    '詹姆斯·瓦特改良蒸汽机，为工业生产提供了强大的动力，推动了工业革命的深入发展。',
    0.98
  ),
  createEvent(
    '珍妮纺纱机发明',
    1764,
    'industrial-revolution',
    '欧洲',
    '哈格里夫斯发明珍妮纺纱机，大大提高了纺织效率，标志着工业革命的开始。',
    0.85
  ),
  createEvent(
    '蒸汽机车发明',
    1814,
    'industrial-revolution',
    '欧洲',
    '乔治·史蒂芬森发明蒸汽机车，开创了铁路运输的新时代，改变了人们的出行和货物运输方式。',
    0.9
  ),
  createEvent(
    '玛雅文明兴起',
    -2000,
    'maya',
    '美洲',
    '玛雅文明在中美洲兴起，发展出了独特的文字系统、历法和高度发达的天文学。',
    0.85
  ),
  createEvent(
    '玛雅历法完善',
    750,
    'maya',
    '美洲',
    '玛雅人完善了他们的历法系统，包括太阳历、神圣历和长纪年历，显示了高超的天文学水平。',
    0.8
  ),
  createEvent(
    '奇琴伊察建立',
    900,
    'maya',
    '美洲',
    '奇琴伊察成为玛雅文明的重要城市，建造了著名的库库尔坎金字塔，展现了玛雅建筑和天文学的辉煌成就。',
    0.75
  ),
  createEvent(
    '巴格达智慧宫建立',
    830,
    'islamic-golden-age',
    '中东',
    '阿拔斯王朝哈里发马蒙在巴格达建立智慧宫，翻译和研究古希腊、波斯和印度的学术著作。',
    0.9
  ),
  createEvent(
    '代数学创立',
    820,
    'islamic-golden-age',
    '中东',
    '花剌子密发表《代数学》，系统阐述了代数运算和方程求解，创立了代数学这一数学分支。',
    0.9
  ),
  createEvent(
    '阿维森纳医典问世',
    1025,
    'islamic-golden-age',
    '中东',
    '伊本·西那（阿维森纳）的《医典》问世，成为欧洲和伊斯兰世界的标准医学教科书达数百年之久。',
    0.85
  ),
];

export const EVENTS: Event[] = eventsData.map((e) => ({
  ...e,
  id: uuidv4(),
}));

const eventIdMap = new Map<string, string>();
eventsData.forEach((e, i) => {
  eventIdMap.set(e.name, EVENTS[i].id);
});

const setRelatedEvents = (eventName: string, relatedNames: string[]) => {
  const event = EVENTS.find((e) => e.name === eventName);
  if (event) {
    event.relatedEventIds = relatedNames
      .map((name) => eventIdMap.get(name))
      .filter((id): id is string => id !== undefined);
  }
};

setRelatedEvents('古埃及统一', ['金字塔建造']);
setRelatedEvents('金字塔建造', ['古埃及统一', '拉美西斯二世统治']);
setRelatedEvents('楔形文字发明', ['汉谟拉比法典']);
setRelatedEvents('汉谟拉比法典', ['楔形文字发明']);
setRelatedEvents('城邦制度兴起', ['第一届古代奥运会', '苏格拉底诞生']);
setRelatedEvents('苏格拉底诞生', ['城邦制度兴起', '亚历山大东征']);
setRelatedEvents('亚历山大东征', ['苏格拉底诞生', '罗马帝国建立']);
setRelatedEvents('罗马共和国建立', ['凯撒大帝遇刺']);
setRelatedEvents('凯撒大帝遇刺', ['罗马共和国建立', '罗马帝国建立']);
setRelatedEvents('罗马帝国建立', ['凯撒大帝遇刺', '西罗马帝国灭亡']);
setRelatedEvents('西罗马帝国灭亡', ['罗马帝国建立', '文艺复兴开始']);
setRelatedEvents('秦始皇统一六国', ['丝绸之路开辟']);
setRelatedEvents('丝绸之路开辟', ['秦始皇统一六国', '文成公主入藏']);
setRelatedEvents('唐朝建立', ['贞观之治', '文成公主入藏', '安史之乱']);
setRelatedEvents('贞观之治', ['唐朝建立', '安史之乱']);
setRelatedEvents('文成公主入藏', ['唐朝建立', '丝绸之路开辟']);
setRelatedEvents('安史之乱', ['唐朝建立', '贞观之治', '宋朝建立']);
setRelatedEvents('宋朝建立', ['安史之乱', '活字印刷术发明', '指南针应用于航海']);
setRelatedEvents('活字印刷术发明', ['宋朝建立', '印刷机发明']);
setRelatedEvents('指南针应用于航海', ['宋朝建立', '哥伦布发现新大陆']);
setRelatedEvents('文艺复兴开始', ['西罗马帝国灭亡', '达芬奇诞生', '印刷机发明', '哥伦布发现新大陆']);
setRelatedEvents('印刷机发明', ['文艺复兴开始', '活字印刷术发明']);
setRelatedEvents('哥伦布发现新大陆', ['文艺复兴开始', '麦哲伦环球航行', '达伽马到达印度']);
setRelatedEvents('达伽马到达印度', ['哥伦布发现新大陆', '麦哲伦环球航行']);
setRelatedEvents('麦哲伦环球航行', ['哥伦布发现新大陆', '达伽马到达印度']);
setRelatedEvents('珍妮纺纱机发明', ['蒸汽机发明']);
setRelatedEvents('蒸汽机发明', ['珍妮纺纱机发明', '蒸汽机车发明']);
setRelatedEvents('蒸汽机车发明', ['蒸汽机发明']);
setRelatedEvents('玛雅文明兴起', ['玛雅历法完善', '奇琴伊察建立']);
setRelatedEvents('玛雅历法完善', ['玛雅文明兴起', '奇琴伊察建立']);
setRelatedEvents('奇琴伊察建立', ['玛雅文明兴起', '玛雅历法完善']);
setRelatedEvents('巴格达智慧宫建立', ['代数学创立', '阿维森纳医典问世']);
setRelatedEvents('代数学创立', ['巴格达智慧宫建立']);
setRelatedEvents('阿维森纳医典问世', ['巴格达智慧宫建立']);

export const getEventsByCivilization = (civilizationId: string): Event[] => {
  return EVENTS.filter((e) => e.civilizationId === civilizationId);
};

export const getEventById = (id: string): Event | undefined => {
  return EVENTS.find((e) => e.id === id);
};

export const getCivilizationById = (id: string): Civilization | undefined => {
  return CIVILIZATIONS.find((c) => c.id === id);
};

export const searchEvents = (query: string): Event[] => {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return EVENTS.filter(
    (e) =>
      e.name.toLowerCase().includes(lowerQuery) ||
      e.description.toLowerCase().includes(lowerQuery) ||
      e.region.toLowerCase().includes(lowerQuery) ||
      e.year.toString().includes(lowerQuery)
  ).slice(0, 20);
};
