import { ConstellationData } from '../types';
import { getStarsByConstellation } from './stars';

const constellationNames = [
  '角宿', '亢宿', '氐宿', '房宿', '心宿', '尾宿', '箕宿',
  '斗宿', '牛宿', '女宿', '虚宿', '危宿', '室宿', '壁宿',
  '奎宿', '娄宿', '胃宿', '昴宿', '毕宿', '觜宿', '参宿',
  '井宿', '鬼宿', '柳宿', '星宿', '张宿', '翼宿', '轸宿'
];

const guardians = [
  '青龙', '青龙', '青龙', '青龙', '青龙', '青龙', '青龙',
  '玄武', '玄武', '玄武', '玄武', '玄武', '玄武', '玄武',
  '白虎', '白虎', '白虎', '白虎', '白虎', '白虎', '白虎',
  '朱雀', '朱雀', '朱雀', '朱雀', '朱雀', '朱雀', '朱雀'
];

const divisions = [
  '兖州', '豫州', '幽州', '扬州', '冀州', '荆州', '青州',
  '雍州', '并州', '徐州', '青州', '并州', '冀州', '幽州',
  '徐州', '豫州', '冀州', '扬州', '益州', '雍州', '益州',
  '雍州', '并州', '荆州', '豫州', '幽州', '徐州', '扬州'
];

const descriptions = [
  '角宿主造化万物，为东方七宿之首，属木，为苍龙。角宿者，主春生万物，为三光之首。',
  '亢宿主疏降，属金，为苍龙第二宿。亢宿者，主宗庙、朝廷之事。',
  '氐宿主根柢，属土，为苍龙第三宿。氐宿者，主卿大夫之位，掌财帛。',
  '房宿主华盖，属火，为苍龙第四宿。房宿者，主明堂布政之宫。',
  '心宿主明堂，属火，为苍龙第五宿。心宿者，主天下之赏罚，为大辰。',
  '尾宿主后宫，属火，为苍龙第六宿。尾宿者，主君臣、父子之礼。',
  '箕宿主风伯，属水，为苍龙第七宿。箕宿者，主风雨、口舌之事。',
  '斗宿主权衡，属水，为玄武第一宿。斗宿者，主丞相、三公之位。',
  '牛宿主牵牛，属金，为玄武第二宿。牛宿者，主桥梁、道路之事。',
  '女宿主织女星，属土，为玄武第三宿。女宿者，主女工、嫁娶之事。',
  '虚宿主冢宰，属日，为玄武第四宿。虚宿者，主哭泣、祭祀之事。',
  '危宿主宗庙，属月，为玄武第五宿。危宿者，主庙堂、祭祀之事。',
  '室宿主营室，属火，为玄武第六宿。室宿者，主军粮、府库之事。',
  '壁宿主东壁，属水，为玄武第七宿。壁宿者，主文章、图书之事。',
  '奎宿主天豕，属木，为白虎第一宿。奎宿者，主武库、兵甲之事。',
  '娄宿主聚众，属金，为白虎第二宿。娄宿者，主苑牧、牺牲之事。',
  '胃宿主天仓，属土，为白虎第三宿。胃宿者，主仓廪、五谷之事。',
  '昴宿主旄头，属日，为白虎第四宿。昴宿者，主胡兵、狱讼之事。',
  '毕宿主罕车，属月，为白虎第五宿。毕宿者，主弋猎、边兵之事。',
  '觜宿主虎首，属火，为白虎第六宿。觜宿者，主军旅、收敛之事。',
  '参宿主斩伐，属水，为白虎第七宿。参宿者，主大将、杀伐之事。',
  '井宿主水衡，属木，为朱雀第一宿。井宿者，主水泉、灌溉之事。',
  '鬼宿主天目，属金，为朱雀第二宿。鬼宿者，主祠祀、鬼神之事。',
  '柳宿主鸟喙，属土，为朱雀第三宿。柳宿者，主饮食、仓库之事。',
  '星宿主七星，属日，为朱雀第四宿。星宿主衣裳、文绣之事。',
  '张宿主宝珍，属月，为朱雀第五宿。张宿主珠玉、珍宝之事。',
  '翼宿主羽翮，属火，为朱雀第六宿。翼宿主礼乐、文章之事。',
  '轸宿主车骑，属水，为朱雀第七宿。轸宿主车骑、将军之事。'
];

const generateConnections = (count: number): [number, number][] => {
  const connections: [number, number][] = [];
  for (let i = 0; i < count - 1; i++) {
    connections.push([i, i + 1]);
  }
  for (let i = 0; i < Math.floor(count / 3); i++) {
    const a = Math.floor(Math.random() * count);
    const b = Math.floor(Math.random() * count);
    if (a !== b && !connections.some(c => (c[0] === a && c[1] === b) || (c[0] === b && c[1] === a))) {
      connections.push([Math.min(a, b), Math.max(a, b)]);
    }
  }
  return connections;
};

export const constellationsData: ConstellationData[] = constellationNames.map((name, index) => {
  const constellationId = `cons_${index.toString().padStart(2, '0')}`;
  const constellationStars = getStarsByConstellation(constellationId);
  
  return {
    id: constellationId,
    name,
    stars: constellationStars.map(s => s.id),
    connections: generateConnections(constellationStars.length),
    guardian: guardians[index],
    division: divisions[index],
    starCount: constellationStars.length,
    description: descriptions[index]
  };
});

export const getConstellationById = (id: string): ConstellationData | undefined => {
  return constellationsData.find(c => c.id === id);
};
