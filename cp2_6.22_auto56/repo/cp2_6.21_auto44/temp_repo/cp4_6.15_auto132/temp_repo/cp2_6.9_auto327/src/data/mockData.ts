import { Item, Actor, Play } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const BOX_IDS = ['box-1', 'box-2', 'box-3', 'box-4', 'box-5', 'box-6'];
export const BOX_NAMES = ['大衣箱', '二衣箱', '三衣箱', '盔头箱', '把子箱', '旗包箱'];

const createItem = (
  name: string,
  category: Item['category'],
  color: string,
  pattern: string,
  boxId: string,
  thumbnail: string,
  status: Item['status'] = 'available'
): Item => ({
  id: uuidv4(),
  name,
  category,
  color,
  pattern,
  thumbnail,
  boxId,
  status,
});

export const initialItems: Item[] = [
  createItem('红蟒袍', 'robe', '#dc143c', '龙纹', 'box-1', '👘'),
  createItem('绿蟒袍', 'robe', '#228b22', '龙纹', 'box-1', '👘'),
  createItem('黄蟒袍', 'robe', '#ffd700', '龙纹', 'box-1', '👘'),
  createItem('白蟒袍', 'robe', '#ffffff', '龙纹', 'box-1', '👘'),
  createItem('黑蟒袍', 'robe', '#000000', '龙纹', 'box-1', '👘'),
  createItem('紫蟒袍', 'robe', '#8b008b', '龙纹', 'box-1', '👘'),
  createItem('蓝帔', 'cape', '#4169e1', '团花', 'box-1', '🧥'),
  createItem('红帔', 'cape', '#dc143c', '团花', 'box-1', '🧥'),
  createItem('青褶子', 'folded', '#191970', '素面', 'box-2', '👔'),
  createItem('蓝褶子', 'folded', '#4682b4', '素面', 'box-2', '👔'),
  createItem('花褶子', 'folded', '#ff6347', '花卉', 'box-2', '👔'),
  createItem('女褶子', 'folded', '#ffb6c1', '绣花', 'box-2', '👔'),
  createItem('箭衣', 'folded', '#8b4513', '镶边', 'box-2', '🎽'),
  createItem('马褂', 'folded', '#2f4f4f', '对襟', 'box-2', '🧥'),
  createItem('红斗篷', 'cape', '#dc143c', '镶边', 'box-3', '🧣'),
  createItem('白斗篷', 'cape', '#ffffff', '素面', 'box-3', '🧣'),
  createItem('皇帝盔', 'helmet', '#ffd700', '旒冕', 'box-4', '👑'),
  createItem('相貂', 'helmet', '#000000', '展脚', 'box-4', '🎩'),
  createItem('纱帽', 'helmet', '#000000', '方翅', 'box-4', '🎩'),
  createItem('凤冠', 'helmet', '#ffd700', '珠翠', 'box-4', '👑'),
  createItem('七星额子', 'helmet', '#c0c0c0', '绒球', 'box-4', '⚔️'),
  createItem('紫金冠', 'helmet', '#ffd700', '雉尾', 'box-4', '👑'),
  createItem('髯口', 'accessory', '#000000', '三绺', 'box-5', '🧔'),
  createItem('玉带', 'accessory', '#ffd700', '銙带', 'box-5', '⌚'),
  createItem('朝珠', 'accessory', '#4b0082', '佛珠', 'box-5', '📿'),
  createItem('令旗', 'accessory', '#dc143c', '刺绣', 'box-6', '🚩'),
  createItem('飞虎旗', 'accessory', '#ffd700', '飞虎', 'box-6', '🚩'),
];

export const initialActors: Actor[] = [
  {
    id: 'actor-1',
    name: '梅兰芳',
    role: '旦角',
    avatar: '👩',
    currentItems: [],
  },
  {
    id: 'actor-2',
    name: '程砚秋',
    role: '生角',
    avatar: '👨',
    currentItems: [],
  },
  {
    id: 'actor-3',
    name: '金少山',
    role: '净角',
    avatar: '🧔',
    currentItems: [],
  },
];

export const plays: Play[] = [
  {
    id: 'play-1',
    title: '牡丹亭',
    date: '今日',
    cast: [
      { actorId: 'actor-1', role: '杜丽娘', requiredItems: [] },
      { actorId: 'actor-2', role: '柳梦梅', requiredItems: [] },
    ],
    lyrics: [
      { time: 0, text: '原来姹紫嫣红开遍' },
      { time: 1, text: '似这般都付与断井颓垣' },
      { time: 2, text: '良辰美景奈何天' },
      { time: 3, text: '赏心乐事谁家院' },
      { time: 4, text: '朝飞暮卷，云霞翠轩' },
      { time: 5, text: '雨丝风片，烟波画船' },
    ],
  },
  {
    id: 'play-2',
    title: '长生殿',
    date: '明日',
    cast: [
      { actorId: 'actor-1', role: '杨贵妃', requiredItems: [] },
      { actorId: 'actor-3', role: '唐明皇', requiredItems: [] },
    ],
    lyrics: [
      { time: 0, text: '天淡云闲，列长空数行新雁' },
      { time: 1, text: '御园中秋色斓斑' },
      { time: 2, text: '柳添黄，苹减绿，红莲脱瓣' },
      { time: 3, text: '一抹雕阑，喷清香桂花初绽' },
      { time: 4, text: '携手向花阴，共倚湖山石畔' },
      { time: 5, text: '把钗盒私盟，对天重誓愿' },
    ],
  },
];

export const getItemById = (items: Item[], id: string) => items.find(i => i.id === id);
export const getActorById = (actors: Actor[], id: string) => actors.find(a => a.id === id);
