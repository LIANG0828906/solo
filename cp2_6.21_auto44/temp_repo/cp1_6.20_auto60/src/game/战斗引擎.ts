import { 宠物数据 } from './宠物系统';
import { 技能模板列表, AI策略列表, 技能模板 } from '../data/初始数据';

export type 战斗事件类型 = '技能使用' | '造成伤害' | '治愈' | '回合开始' | '战斗结束' | '增益';

export interface 战斗事件 {
  type: 战斗事件类型;
  行动方: '玩家' | '敌方';
  技能名称?: string;
  数值?: number;
  消息: string;
}

export interface 战斗状态 {
  玩家宠物: 宠物数据;
  敌方宠物: 宠物数据;
  回合数: number;
  当前行动方: '玩家' | '敌方';
  战斗日志: 战斗事件[];
  战斗结束: boolean;
  胜负结果?: '玩家' | '敌方';
  技能冷却: {
    玩家: Record<string, number>;
    敌方: Record<string, number>;
  };
  增益效果: {
    玩家: { 防御提升: number; 回合数: number }[];
    敌方: { 防御提升: number; 回合数: number }[];
  };
}

type 战斗事件回调 = (事件: 战斗事件) => void;

let 当前战斗: 战斗状态 | null = null;
let 事件回调: 战斗事件回调 | null = null;

export function 监听战斗事件(回调: 战斗事件回调) {
  事件回调 = 回调;
}

function 触发事件(事件: 战斗事件) {
  if (事件回调) 事件回调(事件);
  if (当前战斗) {
    当前战斗.战斗日志.push(事件);
  }
}

function 获取技能详情(技能id: string): 技能模板 | undefined {
  return 技能模板列表.find(s => s.id === 技能id);
}

function 计算伤害(攻击者: 宠物数据, 防御者: 宠物数据, 技能: 技能模板, 防御方增益: { 防御提升: number; 回合数: number }[]): number {
  if (技能.效果类型 === 'heal' || 技能.效果类型 === 'buff') return 0;
  
  const 防御加成 = 防御方增益.reduce((sum, g) => sum + g.防御提升, 0);
  const 基础伤害 = 技能.基础伤害 + 攻击者.attack * 0.5;
  const 减伤 = Math.max(0, (防御者.defense + 防御加成) * 0.3);
  const 最终伤害 = Math.max(1, Math.floor(基础伤害 - 减伤 + (Math.random() * 6 - 3)));
  
  return 最终伤害;
}

function AI选择技能(战斗: 战斗状态): string {
  const 策略 = AI策略列表[Math.floor(Math.random() * AI策略列表.length)];
  const 可用技能 = 战斗.敌方宠物.已装备技能ids.filter(id => {
    const 冷却 = 战斗.技能冷却.敌方[id] || 0;
    return 冷却 <= 0;
  });

  if (可用技能.length === 0) return 'skill_tackle';

  const HP比例 = 战斗.敌方宠物.hp / 战斗.敌方宠物.maxHp;
  
  if (HP比例 < 0.3) {
    const 治愈技能 = 可用技能.find(id => {
      const 技能 = 获取技能详情(id);
      return 技能 && 技能.效果类型 === 'heal';
    });
    if (治愈技能 && Math.random() < 策略.防御倾向 + 0.3) return 治愈技能;
  }

  const 偏好技能 = 可用技能.filter(id => 策略.技能偏好.includes(id));
  if (偏好技能.length > 0 && Math.random() < 策略.攻击倾向) {
    return 偏好技能[Math.floor(Math.random() * 偏好技能.length)];
  }

  return 可用技能[Math.floor(Math.random() * 可用技能.length)];
}

function 玩家选择技能(战斗: 战斗状态): string {
  const 可用技能 = 战斗.玩家宠物.已装备技能ids.filter(id => {
    const 冷却 = 战斗.技能冷却.玩家[id] || 0;
    return 冷却 <= 0;
  });

  if (可用技能.length === 0) return 'skill_tackle';

  const HP比例 = 战斗.玩家宠物.hp / 战斗.玩家宠物.maxHp;
  if (HP比例 < 0.25) {
    const 治愈技能 = 可用技能.find(id => {
      const 技能 = 获取技能详情(id);
      return 技能 && 技能.效果类型 === 'heal';
    });
    if (治愈技能) return 治愈技能;
  }

  const 攻击技能 = 可用技能.filter(id => {
    const 技能 = 获取技能详情(id);
    return 技能 && (技能.效果类型 === 'damage');
  });
  
  if (攻击技能.length > 0) {
    攻击技能.sort((a, b) => {
      const 技能A = 获取技能详情(a)!;
      const 技能B = 获取技能详情(b)!;
      return 技能B.基础伤害 - 技能A.基础伤害;
    });
    return 攻击技能[0];
  }

  return 可用技能[0];
}

function 更新增益效果(战斗: 战斗状态) {
  ['玩家', '敌方'].forEach(方 => {
    const 增益 = 方 === '玩家' ? 战斗.增益效果.玩家 : 战斗.增益效果.敌方;
    for (let i = 增益.length - 1; i >= 0; i--) {
      增益[i].回合数--;
      if (增益[i].回合数 <= 0) {
        增益.splice(i, 1);
      }
    }
  });
}

function 更新技能冷却(战斗: 战斗状态) {
  ['玩家', '敌方'].forEach(方 => {
    const 冷却 = 方 === '玩家' ? 战斗.技能冷却.玩家 : 战斗.技能冷却.敌方;
    Object.keys(冷却).forEach(技能id => {
      if (冷却[技能id] > 0) 冷却[技能id]--;
    });
  });
}

function 执行技能行动(行动方: '玩家' | '敌方', 技能id: string) {
  if (!当前战斗) return;

  const 技能 = 获取技能详情(技能id);
  if (!技能) return;

  const 攻击者 = 行动方 === '玩家' ? 当前战斗.玩家宠物 : 当前战斗.敌方宠物;
  const 防御者 = 行动方 === '玩家' ? 当前战斗.敌方宠物 : 当前战斗.玩家宠物;
  const 防御方增益 = 行动方 === '玩家' ? 当前战斗.增益效果.敌方 : 当前战斗.增益效果.玩家;

  触发事件({
    type: '技能使用',
    行动方,
    技能名称: 技能.name,
    消息: `${攻击者.name} 使用了 ${技能.name}！`,
  });

  if (技能.效果类型 === 'damage') {
    const 伤害 = 计算伤害(攻击者, 防御者, 技能, 防御方增益);
    防御者.hp = Math.max(0, 防御者.hp - 伤害);
    
    触发事件({
      type: '造成伤害',
      行动方,
      数值: 伤害,
      消息: `${防御者.name} 受到了 ${伤害} 点伤害！`,
    });
  } else if (技能.效果类型 === 'heal') {
    const 治愈量 = Math.abs(技能.基础伤害);
    攻击者.hp = Math.min(攻击者.maxHp, 攻击者.hp + 治愈量);
    
    触发事件({
      type: '治愈',
      行动方,
      数值: 治愈量,
      消息: `${攻击者.name} 恢复了 ${治愈量} 点生命值！`,
    });
  } else if (技能.效果类型 === 'buff') {
    const 增益列表 = 行动方 === '玩家' ? 当前战斗.增益效果.玩家 : 当前战斗.增益效果.敌方;
    增益列表.push({ 防御提升: 20, 回合数: 2 });
    
    触发事件({
      type: '增益',
      行动方,
      消息: `${攻击者.name} 的防御力大幅提升！`,
    });
  }

  const 冷却记录 = 行动方 === '玩家' ? 当前战斗.技能冷却.玩家 : 当前战斗.技能冷却.敌方;
  冷却记录[技能id] = 技能.冷却回合;
}

function 检查战斗结束(): boolean {
  if (!当前战斗) return true;

  if (当前战斗.玩家宠物.hp <= 0) {
    当前战斗.战斗结束 = true;
    当前战斗.胜负结果 = '敌方';
    触发事件({
      type: '战斗结束',
      行动方: '敌方',
      消息: `${当前战斗.敌方宠物.name} 获得了胜利！`,
    });
    return true;
  }

  if (当前战斗.敌方宠物.hp <= 0) {
    当前战斗.战斗结束 = true;
    当前战斗.胜负结果 = '玩家';
    触发事件({
      type: '战斗结束',
      行动方: '玩家',
      消息: `${当前战斗.玩家宠物.name} 获得了胜利！`,
    });
    return true;
  }

  return false;
}

export function 开始战斗(玩家宠物: 宠物数据, 敌方宠物: 宠物数据): 战斗状态 {
  当前战斗 = {
    玩家宠物: { ...玩家宠物, hp: 玩家宠物.maxHp },
    敌方宠物: { ...敌方宠物, hp: 敌方宠物.maxHp },
    回合数: 1,
    当前行动方: 玩家宠物.speed >= 敌方宠物.speed ? '玩家' : '敌方',
    战斗日志: [],
    战斗结束: false,
    技能冷却: { 玩家: {}, 敌方: {} },
    增益效果: { 玩家: [], 敌方: [] },
  };

  触发事件({
    type: '回合开始',
    行动方: 当前战斗.当前行动方,
    消息: `战斗开始！${当前战斗.当前行动方 === '玩家' ? 玩家宠物.name : 敌方宠物.name} 先手出击！`,
  });

  return { ...当前战斗 };
}

export function 执行下一回合(): 战斗状态 {
  if (!当前战斗 || 当前战斗.战斗结束) return 获取战斗状态();

  const 技能id = 当前战斗.当前行动方 === '玩家' 
    ? 玩家选择技能(当前战斗)
    : AI选择技能(当前战斗);

  执行技能行动(当前战斗.当前行动方, 技能id);

  if (检查战斗结束()) return 获取战斗状态();

  当前战斗.当前行动方 = 当前战斗.当前行动方 === '玩家' ? '敌方' : '玩家';

  if (当前战斗.当前行动方 === '玩家') {
    当前战斗.回合数++;
    更新技能冷却(当前战斗);
    更新增益效果(当前战斗);
  }

  if (!当前战斗.战斗结束) {
    触发事件({
      type: '回合开始',
      行动方: 当前战斗.当前行动方,
      消息: `第 ${当前战斗.回合数} 回合 - ${当前战斗.当前行动方 === '玩家' ? 当前战斗.玩家宠物.name : 当前战斗.敌方宠物.name} 的回合！`,
    });
  }

  return 获取战斗状态();
}

export function 获取战斗状态(): 战斗状态 {
  if (!当前战斗) throw new Error('没有进行中的战斗');
  return {
    ...当前战斗,
    玩家宠物: { ...当前战斗.玩家宠物 },
    敌方宠物: { ...当前战斗.敌方宠物 },
    战斗日志: [...当前战斗.战斗日志],
  };
}

export function 是否战斗结束(): boolean {
  return 当前战斗?.战斗结束 ?? false;
}

export function 获取战斗结果(): { 胜者: '玩家' | '敌方'; 金币: number; 经验: number } {
  if (!当前战斗 || !当前战斗.胜负结果) throw new Error('战斗尚未结束');

  const 等级差 = 当前战斗.敌方宠物.level - 当前战斗.玩家宠物.level;
  const 基础金币 = 50;
  const 基础经验 = 100;

  if (当前战斗.胜负结果 === '玩家') {
    const 金币奖励 = Math.max(10, Math.floor(基础金币 * (1 + 等级差 * 0.2) * (1 + Math.random() * 0.3)));
    const 经验奖励 = Math.max(20, Math.floor(基础经验 * (1 + 等级差 * 0.3)));
    return { 胜者: '玩家', 金币: 金币奖励, 经验: 经验奖励 };
  } else {
    return { 胜者: '敌方', 金币: 10, 经验: 20 };
  }
}

export function 重置战斗() {
  当前战斗 = null;
  事件回调 = null;
}
