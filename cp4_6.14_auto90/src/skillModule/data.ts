import { SkillNode } from '../shared/types';

export const SKILL_DATA: SkillNode[] = [
  // 战士
  { id: 'warrior_slam', name: '猛击', classId: 'warrior', tier: 0, prerequisites: [], effect: { damageMultiplier: 1.5, hitBonus: 0.05, critBonus: 0, cooldown: 3, description: '强力一击，造成150%伤害', icon: '⚔️' }, x: 0.35, y: 0.8 },
  { id: 'warrior_shield_wall', name: '盾墙', classId: 'warrior', tier: 0, prerequisites: [], effect: { damageMultiplier: 0, hitBonus: 0, critBonus: 0, cooldown: 15, description: '举起盾牌，大幅降低受到的伤害', icon: '🛡️' }, x: 0.65, y: 0.8 },
  { id: 'warrior_whirlwind', name: '旋风斩', classId: 'warrior', tier: 1, prerequisites: ['warrior_slam'], effect: { damageMultiplier: 1.2, hitBonus: 0.03, critBonus: 0.05, cooldown: 8, description: '旋转攻击周围所有敌人', icon: '🌀' }, x: 0.3, y: 0.5 },
  { id: 'warrior_battle_cry', name: '战吼', classId: 'warrior', tier: 1, prerequisites: ['warrior_shield_wall'], effect: { damageMultiplier: 0, hitBonus: 0.1, critBonus: 0.05, cooldown: 20, description: '鼓舞士气，提升全队命中和暴击', icon: '📯' }, x: 0.7, y: 0.5 },
  { id: 'warrior_armor_break', name: '破甲', classId: 'warrior', tier: 2, prerequisites: ['warrior_whirlwind', 'warrior_battle_cry'], effect: { damageMultiplier: 2.0, hitBonus: 0.08, critBonus: 0.1, cooldown: 12, description: '击碎敌人护甲，造成200%伤害并降低防御', icon: '💥' }, x: 0.5, y: 0.2 },

  // 法师
  { id: 'mage_fireball', name: '火球术', classId: 'mage', tier: 0, prerequisites: [], effect: { damageMultiplier: 1.8, hitBonus: 0.03, critBonus: 0.05, cooldown: 4, description: '发射火球，造成180%火焰伤害', icon: '🔥' }, x: 0.35, y: 0.8 },
  { id: 'mage_frost_armor', name: '冰霜护甲', classId: 'mage', tier: 0, prerequisites: [], effect: { damageMultiplier: 0, hitBonus: 0, critBonus: 0, cooldown: 18, description: '冰霜护体，提升防御并减速攻击者', icon: '❄️' }, x: 0.65, y: 0.8 },
  { id: 'mage_blizzard', name: '暴风雪', classId: 'mage', tier: 1, prerequisites: ['mage_fireball'], effect: { damageMultiplier: 1.5, hitBonus: 0.05, critBonus: 0.08, cooldown: 10, description: '召唤暴风雪，对区域内敌人持续伤害', icon: '🌨️' }, x: 0.3, y: 0.5 },
  { id: 'mage_arcane_wisdom', name: '奥术智慧', classId: 'mage', tier: 1, prerequisites: ['mage_frost_armor'], effect: { damageMultiplier: 0, hitBonus: 0.05, critBonus: 0.1, cooldown: 25, description: '奥术增幅，提升智力和暴击率', icon: '📖' }, x: 0.7, y: 0.5 },
  { id: 'mage_meteor', name: '陨石术', classId: 'mage', tier: 2, prerequisites: ['mage_blizzard', 'mage_arcane_wisdom'], effect: { damageMultiplier: 3.0, hitBonus: 0.1, critBonus: 0.15, cooldown: 20, description: '召唤陨石，造成300%毁灭性伤害', icon: '☄️' }, x: 0.5, y: 0.2 },

  // 游侠
  { id: 'ranger_multi_shot', name: '多重射击', classId: 'ranger', tier: 0, prerequisites: [], effect: { damageMultiplier: 1.3, hitBonus: 0.08, critBonus: 0.05, cooldown: 5, description: '同时射出多支箭矢', icon: '🏹' }, x: 0.35, y: 0.8 },
  { id: 'ranger_trap', name: '陷阱', classId: 'ranger', tier: 0, prerequisites: [], effect: { damageMultiplier: 0.5, hitBonus: 0.1, critBonus: 0, cooldown: 12, description: '布置陷阱，控制并伤害敌人', icon: '🪤' }, x: 0.65, y: 0.8 },
  { id: 'ranger_swift_step', name: '疾风步', classId: 'ranger', tier: 1, prerequisites: ['ranger_multi_shot'], effect: { damageMultiplier: 0, hitBonus: 0.15, critBonus: 0.1, cooldown: 15, description: '极速移动，大幅提升命中和暴击', icon: '💨' }, x: 0.3, y: 0.5 },
  { id: 'ranger_lethal_shot', name: '致命射击', classId: 'ranger', tier: 1, prerequisites: ['ranger_trap'], effect: { damageMultiplier: 2.2, hitBonus: 0.05, critBonus: 0.2, cooldown: 8, description: '精准一击，220%伤害且暴击率极高', icon: '🎯' }, x: 0.7, y: 0.5 },
  { id: 'ranger_nature_wrath', name: '自然之怒', classId: 'ranger', tier: 2, prerequisites: ['ranger_swift_step', 'ranger_lethal_shot'], effect: { damageMultiplier: 2.5, hitBonus: 0.1, critBonus: 0.15, cooldown: 18, description: '召唤自然之力，250%范围伤害', icon: '🌿' }, x: 0.5, y: 0.2 },

  // 盗贼
  { id: 'rogue_backstab', name: '背刺', classId: 'rogue', tier: 0, prerequisites: [], effect: { damageMultiplier: 2.0, hitBonus: 0.05, critBonus: 0.15, cooldown: 4, description: '从背后偷袭，200%伤害高暴击', icon: '🗡️' }, x: 0.35, y: 0.8 },
  { id: 'rogue_stealth', name: '潜行', classId: 'rogue', tier: 0, prerequisites: [], effect: { damageMultiplier: 0, hitBonus: 0, critBonus: 0, cooldown: 20, description: '隐入暗影，下次攻击必定暴击', icon: '👤' }, x: 0.65, y: 0.8 },
  { id: 'rogue_poison_blade', name: '毒刃', classId: 'rogue', tier: 1, prerequisites: ['rogue_backstab'], effect: { damageMultiplier: 1.5, hitBonus: 0.03, critBonus: 0.1, cooldown: 6, description: '淬毒匕首，造成持续伤害', icon: '🧪' }, x: 0.3, y: 0.5 },
  { id: 'rogue_evasion', name: '闪避', classId: 'rogue', tier: 1, prerequisites: ['rogue_stealth'], effect: { damageMultiplier: 0, hitBonus: 0.2, critBonus: 0, cooldown: 15, description: '极限闪避，提升闪避率和命中率', icon: '💨' }, x: 0.7, y: 0.5 },
  { id: 'rogue_shadow_step', name: '暗影步', classId: 'rogue', tier: 2, prerequisites: ['rogue_poison_blade', 'rogue_evasion'], effect: { damageMultiplier: 2.5, hitBonus: 0.1, critBonus: 0.2, cooldown: 10, description: '瞬移至目标身后，250%暴击伤害', icon: '🌑' }, x: 0.5, y: 0.2 },

  // 牧师
  { id: 'priest_heal', name: '治疗术', classId: 'priest', tier: 0, prerequisites: [], effect: { damageMultiplier: 0, hitBonus: 0, critBonus: 0, cooldown: 3, description: '恢复目标大量生命值', icon: '💚' }, x: 0.35, y: 0.8 },
  { id: 'priest_holy_shield', name: '神圣护盾', classId: 'priest', tier: 0, prerequisites: [], effect: { damageMultiplier: 0, hitBonus: 0, critBonus: 0, cooldown: 15, description: '施加神圣护盾，吸收伤害', icon: '✨' }, x: 0.65, y: 0.8 },
  { id: 'priest_blessing', name: '祈福', classId: 'priest', tier: 1, prerequisites: ['priest_heal'], effect: { damageMultiplier: 0, hitBonus: 0.05, critBonus: 0.1, cooldown: 20, description: '祈福目标，提升精神和暴击', icon: '🙏' }, x: 0.3, y: 0.5 },
  { id: 'priest_smite', name: '惩击', classId: 'priest', tier: 1, prerequisites: ['priest_holy_shield'], effect: { damageMultiplier: 1.8, hitBonus: 0.08, critBonus: 0.05, cooldown: 5, description: '神圣之光惩击敌人，180%伤害', icon: '⚡' }, x: 0.7, y: 0.5 },
  { id: 'priest_resurrection', name: '复活', classId: 'priest', tier: 2, prerequisites: ['priest_blessing', 'priest_smite'], effect: { damageMultiplier: 0, hitBonus: 0, critBonus: 0, cooldown: 30, description: '复活一名阵亡队友', icon: '🕊️' }, x: 0.5, y: 0.2 },

  // 术士
  { id: 'warlock_shadow_bolt', name: '暗影箭', classId: 'warlock', tier: 0, prerequisites: [], effect: { damageMultiplier: 1.6, hitBonus: 0.05, critBonus: 0.1, cooldown: 3, description: '发射暗影能量箭，160%伤害', icon: '🔮' }, x: 0.35, y: 0.8 },
  { id: 'warlock_life_drain', name: '生命汲取', classId: 'warlock', tier: 0, prerequisites: [], effect: { damageMultiplier: 1.2, hitBonus: 0.03, critBonus: 0.05, cooldown: 6, description: '吸取敌人生命，伤害并治疗自己', icon: '🩸' }, x: 0.65, y: 0.8 },
  { id: 'warlock_curse', name: '诅咒', classId: 'warlock', tier: 1, prerequisites: ['warlock_shadow_bolt'], effect: { damageMultiplier: 0.8, hitBonus: 0.1, critBonus: 0, cooldown: 12, description: '施加诅咒，降低敌人属性', icon: '☠️' }, x: 0.3, y: 0.5 },
  { id: 'warlock_summon_demon', name: '恶魔召唤', classId: 'warlock', tier: 1, prerequisites: ['warlock_life_drain'], effect: { damageMultiplier: 1.0, hitBonus: 0.05, critBonus: 0.05, cooldown: 20, description: '召唤恶魔仆从协助战斗', icon: '👹' }, x: 0.7, y: 0.5 },
  { id: 'warlock_soul_siphon', name: '灵魂虹吸', classId: 'warlock', tier: 2, prerequisites: ['warlock_curse', 'warlock_summon_demon'], effect: { damageMultiplier: 2.8, hitBonus: 0.08, critBonus: 0.15, cooldown: 15, description: '虹吸灵魂，280%暗影伤害', icon: '👻' }, x: 0.5, y: 0.2 },
];
