import { v4 as uuidv4 } from 'uuid';
import { 宠物种族模板列表, 技能模板列表, 种族类型 } from '../data/初始数据';

export interface 宠物数据 {
  id: string;
  name: string;
  种族: 种族类型;
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  进化阶段: number;
  已装备技能ids: string[];
  装饰品ids: string[];
  配色: { 主色: string; 副色: string; 强调色: string };
}

export interface 属性类型 {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

type 训练属性类型 = 'attack' | 'defense' | 'speed';

const 宠物存储: Map<string, 宠物数据> = new Map();

function 获取种族模板(种族: 种族类型) {
  return 宠物种族模板列表.find(r => r.种族 === 种族)!;
}

function 计算升级所需经验(等级: number): number {
  return Math.floor(100 * Math.pow(1.5, 等级 - 1));
}

function 应用升级(宠物: 宠物数据): 宠物数据 {
  const 模板 = 获取种族模板(宠物.种族);
  while (宠物.exp >= 宠物.expToNext && 宠物.level < 100) {
    宠物.exp -= 宠物.expToNext;
    宠物.level += 1;
    宠物.expToNext = 计算升级所需经验(宠物.level);
    
    宠物.maxHp += Math.floor(模板.成长系数.maxHp);
    宠物.attack += Math.floor(模板.成长系数.attack);
    宠物.defense += Math.floor(模板.成长系数.defense);
    宠物.speed += Math.floor(模板.成长系数.speed);
    宠物.hp = 宠物.maxHp;

    if (宠物.level >= 10 && 宠物.进化阶段 < 1) {
      宠物.进化阶段 = 1;
    } else if (宠物.level >= 25 && 宠物.进化阶段 < 2) {
      宠物.进化阶段 = 2;
    }
  }
  return 宠物;
}

export function 创建宠物(种族: 种族类型, 名字: string): 宠物数据 {
  const 模板 = 获取种族模板(种族);
  const 宠物: 宠物数据 = {
    id: uuidv4(),
    name: 名字,
    种族,
    level: 1,
    exp: 0,
    expToNext: 计算升级所需经验(1),
    hp: 模板.基础属性.maxHp,
    maxHp: 模板.基础属性.maxHp,
    attack: 模板.基础属性.attack,
    defense: 模板.基础属性.defense,
    speed: 模板.基础属性.speed,
    进化阶段: 0,
    已装备技能ids: [...模板.初始技能ids],
    装饰品ids: [],
    配色: { ...模板.外观配色 },
  };
  宠物存储.set(宠物.id, 宠物);
  return { ...宠物 };
}

export function 获取宠物(宠物id: string): 宠物数据 | undefined {
  const 宠物 = 宠物存储.get(宠物id);
  return 宠物 ? { ...宠物 } : undefined;
}

export function 投喂宠物(宠物id: string): { 宠物: 宠物数据; 获得: { hp: number; exp: number } } {
  const 宠物 = 宠物存储.get(宠物id);
  if (!宠物) throw new Error('宠物不存在');

  const 恢复HP = Math.floor(宠物.maxHp * 0.2);
  const 获得经验 = 10;
  
  宠物.hp = Math.min(宠物.maxHp, 宠物.hp + 恢复HP);
  宠物.exp += 获得经验;
  应用升级(宠物);

  return { 宠物: { ...宠物 }, 获得: { hp: 恢复HP, exp: 获得经验 } };
}

export function 训练宠物(宠物id: string, 属性: 训练属性类型): { 宠物: 宠物数据; 获得: number } {
  const 宠物 = 宠物存储.get(宠物id);
  if (!宠物) throw new Error('宠物不存在');

  const 模板 = 获取种族模板(宠物.种族);
  const 属性成长: Record<训练属性类型, number> = {
    attack: 模板.成长系数.attack,
    defense: 模板.成长系数.defense,
    speed: 模板.成长系数.speed,
  };

  const 增加量 = Math.max(1, Math.floor(属性成长[属性] * 0.3));
  宠物[属性] += 增加量;
  宠物.exp += 15;
  应用升级(宠物);

  return { 宠物: { ...宠物 }, 获得: 增加量 };
}

export function 治疗宠物(宠物id: string): { 宠物: 宠物数据; 恢复: number } {
  const 宠物 = 宠物存储.get(宠物id);
  if (!宠物) throw new Error('宠物不存在');

  const 恢复量 = 宠物.maxHp - 宠物.hp;
  宠物.hp = 宠物.maxHp;

  return { 宠物: { ...宠物 }, 恢复: 恢复量 };
}

export function 进化宠物(宠物id: string): { 宠物: 宠物数据; 成功: boolean; 信息?: string } {
  const 宠物 = 宠物存储.get(宠物id);
  if (!宠物) throw new Error('宠物不存在');

  const 模板 = 获取种族模板(宠物.种族);
  const 所需等级 = 宠物.进化阶段 === 0 ? 10 : 宠物.进化阶段 === 1 ? 25 : -1;

  if (所需等级 === -1) {
    return { 宠物: { ...宠物 }, 成功: false, 信息: '已达到最终进化形态' };
  }
  if (宠物.level < 所需等级) {
    return { 宠物: { ...宠物 }, 成功: false, 信息: `需要等级达到 ${所需等级} 才能进化` };
  }

  宠物.进化阶段 += 1;
  宠物.maxHp = Math.floor(宠物.maxHp * 1.3);
  宠物.attack = Math.floor(宠物.attack * 1.2);
  宠物.defense = Math.floor(宠物.defense * 1.2);
  宠物.speed = Math.floor(宠物.speed * 1.15);
  宠物.hp = 宠物.maxHp;

  return { 宠物: { ...宠物 }, 成功: true };
}

export function 装备技能(宠物id: string, 技能id: string, 槽位索引: number): { 宠物: 宠物数据; 成功: boolean; 信息?: string } {
  const 宠物 = 宠物存储.get(宠物id);
  if (!宠物) throw new Error('宠物不存在');

  const 技能 = 技能模板列表.find(s => s.id === 技能id);
  if (!技能) return { 宠物: { ...宠物 }, 成功: false, 信息: '技能不存在' };

  if (技能.种族限制 && !技能.种族限制.includes(宠物.种族)) {
    return { 宠物: { ...宠物 }, 成功: false, 信息: '该技能不适合此种族' };
  }

  if (槽位索引 < 0 || 槽位索引 >= 3) {
    return { 宠物: { ...宠物 }, 成功: false, 信息: '无效的技能槽位' };
  }

  while (宠物.已装备技能ids.length < 3) {
    宠物.已装备技能ids.push('');
  }

  const 已存在索引 = 宠物.已装备技能ids.indexOf(技能id);
  if (已存在索引 !== -1 && 已存在索引 !== 槽位索引) {
    宠物.已装备技能ids[已存在索引] = '';
  }

  宠物.已装备技能ids[槽位索引] = 技能id;
  宠物.已装备技能ids = 宠物.已装备技能ids.filter(id => id !== '');

  return { 宠物: { ...宠物 }, 成功: true };
}

export function 获取所有可解锁技能(宠物: 宠物数据) {
  return 技能模板列表.filter(s => !s.种族限制 || s.种族限制.includes(宠物.种族));
}

export function 添加经验(宠物id: string, 经验值: number): { 宠物: 宠物数据; 升级: boolean } {
  const 宠物 = 宠物存储.get(宠物id);
  if (!宠物) throw new Error('宠物不存在');

  const 原等级 = 宠物.level;
  宠物.exp += 经验值;
  应用升级(宠物);

  return { 宠物: { ...宠物 }, 升级: 宠物.level > 原等级 };
}
