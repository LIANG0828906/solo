import { IOpponentData } from '../types/pet';

export const opponentData: IOpponentData[] = [
  {
    id: 'opp-001',
    name: '烈焰龙',
    type: 'dragon',
    ownerName: '小明',
    hunger: 75,
    mood: 82,
    energy: 90,
    intelligence: 65,
    level: 3,
    exp: 450,
    expToNextLevel: 1000,
  },
  {
    id: 'opp-002',
    name: '星辉独角兽',
    type: 'unicorn',
    ownerName: '樱花',
    hunger: 68,
    mood: 95,
    energy: 70,
    intelligence: 88,
    level: 5,
    exp: 1200,
    expToNextLevel: 2000,
  },
  {
    id: 'opp-003',
    name: '机械战士X7',
    type: 'robot',
    ownerName: '科技狂人',
    hunger: 55,
    mood: 60,
    energy: 95,
    intelligence: 80,
    level: 4,
    exp: 800,
    expToNextLevel: 1500,
  },
  {
    id: 'opp-004',
    name: '云朵龙宝',
    type: 'dragon',
    ownerName: '白云',
    hunger: 88,
    mood: 78,
    energy: 65,
    intelligence: 72,
    level: 2,
    exp: 200,
    expToNextLevel: 500,
  },
  {
    id: 'opp-005',
    name: '梦幻独角兽',
    type: 'unicorn',
    ownerName: '星光',
    hunger: 82,
    mood: 88,
    energy: 75,
    intelligence: 92,
    level: 6,
    exp: 1800,
    expToNextLevel: 2500,
  },
];

export const getRandomOpponent = (excludeId?: string): IOpponentData => {
  const filtered = excludeId
    ? opponentData.filter((o) => o.id !== excludeId)
    : opponentData;
  return filtered[Math.floor(Math.random() * filtered.length)];
};
