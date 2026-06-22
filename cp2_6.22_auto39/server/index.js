import express from 'express';
import cors from 'express';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const QUALITY_WEIGHTS = {
  easy: { white: 60, blue: 28, purple: 10, gold: 2 },
  normal: { white: 45, blue: 32, purple: 18, gold: 5 },
  hard: { white: 25, blue: 35, purple: 30, gold: 10 },
};

const WEAPON_NAMES = [
  '暗影之刃', '等离子炮', '量子长矛', '能量战锤', '纳米双刃剑',
  '光子步枪', '虚空巨剑', '电磁手炮', '星尘之弓', '赛博战斧',
];
const ARMOR_NAMES = [
  '纳米护甲', '量子护盾', '虚空战甲', '光子屏障', '等离子胸甲',
  '能量护肩', '星尘披风', '赛博外骨骼', '暗影皮甲', '晶化头盔',
];
const ACCESSORY_NAMES = [
  '吸血项链', '连击戒指', '护盾护符', '闪避手镯', '暴击徽章',
  '能量核心', '时空罗盘', '光子吊坠', '虚空耳环', '量子腰带',
];

const EFFECTS = [
  { id: 'lifesteal', name: '吸血', desc: '攻击回复伤害的15%生命' },
  { id: 'combo', name: '连击', desc: '25%概率额外攻击一次' },
  { id: 'shield', name: '护盾', desc: '首次受伤减免50%伤害' },
  { id: 'dodge', name: '闪避', desc: '15%概率完全闪避攻击' },
  { id: 'crit', name: '暴击强化', desc: '暴击伤害提升50%' },
  { id: 'thorns', name: '反伤', desc: '受到攻击反弹20%伤害' },
  { id: 'rage', name: '狂暴', desc: '生命低于30%时攻击+30%' },
  { id: 'regen', name: '再生', desc: '每回合回复5%最大生命' },
];

const pickWeighted = (weights) => {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [key, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) return key;
  }
  return Object.keys(weights)[0];
};

app.get('/api/items', (req, res) => {
  const { difficulty = 'normal', count = '5' } = req.query;
  const diff = ['easy', 'normal', 'hard'].includes(difficulty) ? difficulty : 'normal';
  const num = Math.max(3, Math.min(5, parseInt(count) || 4));

  const items = [];
  const qWeights = QUALITY_WEIGHTS[diff];

  for (let i = 0; i < num; i++) {
    const quality = pickWeighted(qWeights);
    const types = ['weapon', 'armor', 'accessory'];
    const type = types[Math.floor(Math.random() * types.length)];

    const qMult = { white: 1, blue: 1.4, purple: 2, gold: 3 }[quality];
    const effChance = { white: 0.1, blue: 0.3, purple: 0.6, gold: 1 }[quality];

    let namePool = WEAPON_NAMES;
    if (type === 'armor') namePool = ARMOR_NAMES;
    else if (type === 'accessory') namePool = ACCESSORY_NAMES;

    const baseAtk = type === 'weapon' ? 10 + Math.floor(Math.random() * 10) : 0;
    const baseDef = type === 'armor' ? 8 + Math.floor(Math.random() * 8) : 0;
    const baseCrit = type === 'accessory' ? 3 + Math.floor(Math.random() * 5) : (type === 'weapon' ? 1 + Math.floor(Math.random() * 3) : 0);

    const item = {
      id: 'it_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 6),
      name: namePool[Math.floor(Math.random() * namePool.length)] + ' ' + (quality === 'gold' ? '★' : quality === 'purple' ? '◆' : quality === 'blue' ? '●' : ''),
      type,
      quality,
      stats: {
        attack: Math.floor(baseAtk * qMult),
        defense: Math.floor(baseDef * qMult),
        critRate: Math.floor(baseCrit * qMult * 10) / 10,
      },
      effect: Math.random() < effChance ? EFFECTS[Math.floor(Math.random() * EFFECTS.length)] : null,
    };
    items.push(item);
  }

  res.json({ items });
});

app.get('/api/monsters', (req, res) => {
  const { difficulty = 'normal', level = '1' } = req.query;
  const diff = ['easy', 'normal', 'hard'].includes(difficulty) ? difficulty : 'normal';
  const lv = Math.max(1, parseInt(level) || 1);

  const scaleMap = { easy: 0.8, normal: 1, hard: 1.4 };
  const s = scaleMap[diff] * (1 + lv * 0.15);

  const monsterNames = [
    { name: '赛博幽灵', type: 'specter' },
    { name: '突变生化体', type: 'mutant' },
    { name: '量子机械兽', type: 'mech' },
    { name: '虚空掠夺者', type: 'void' },
    { name: '纳米虫群', type: 'swarm' },
  ];

  const skills = [
    { id: 'heavy_strike', name: '重击', desc: '造成150%攻击伤害', cd: 3, mult: 1.5 },
    { id: 'poison', name: '毒雾', desc: '下回合附加持续伤害', cd: 4, mult: 1.2 },
    { id: 'stun', name: '电磁脉冲', desc: '有概率眩晕目标', cd: 5, mult: 1.0 },
    { id: 'heal', name: '自我修复', desc: '回复25%最大生命', cd: 4, mult: 0 },
  ];

  const count = 1 + Math.floor(Math.random() * 2);
  const monsters = [];

  for (let i = 0; i < count; i++) {
    const mn = monsterNames[Math.floor(Math.random() * monsterNames.length)];
    const skillPool = skills.sort(() => Math.random() - 0.5).slice(0, 2);

    monsters.push({
      id: 'mon_' + Date.now() + '_' + i,
      name: mn.name + (count > 1 ? ` ${i + 1}` : ''),
      type: mn.type,
      stats: {
        maxHp: Math.floor((80 + Math.random() * 40) * s),
        hp: 0,
        attack: Math.floor((8 + Math.random() * 6) * s),
        defense: Math.floor((3 + Math.random() * 4) * s),
        critRate: Math.floor(Math.random() * 8 * s * 10) / 10,
      },
      skills: skillPool.map(sk => ({ ...sk, currentCd: 0 })),
    });
    monsters[i].stats.hp = monsters[i].stats.maxHp;
  }

  res.json({ monsters, difficulty: diff, level: lv });
});

app.post('/api/craft', (req, res) => {
  const { materials } = req.body;
  if (!Array.isArray(materials) || materials.length !== 3) {
    return res.status(400).json({ error: '需要3件材料' });
  }

  const type = materials[0].type;
  if (!materials.every(m => m.type === type)) {
    return res.status(400).json({ error: '必须为相同类型' });
  }

  const qualities = materials.map(m => m.quality);
  const qIndex = ['white', 'blue', 'purple', 'gold'];
  const maxIdx = Math.max(...qualities.map(q => qIndex.indexOf(q)));

  const upChanceMap = {
    white_white: 0.15,
    blue_blue: 0.4,
    purple_purple: 0.35,
  };
  const key = `${qIndex[maxIdx]}_${qIndex[maxIdx]}`;
  const upChance = upChanceMap[key] || 0;

  const up = maxIdx < 3 && Math.random() < upChance;
  const newQuality = up ? qIndex[Math.min(maxIdx + 1, 3)] : qIndex[maxIdx];

  const qMult = { white: 1, blue: 1.4, purple: 2, gold: 3 }[newQuality];
  const effChance = { white: 0.1, blue: 0.3, purple: 0.6, gold: 1 }[newQuality];

  const avgStat = materials.reduce(
    (acc, m) => ({
      attack: acc.attack + m.stats.attack,
      defense: acc.defense + m.stats.defense,
      critRate: acc.critRate + m.stats.critRate,
    }),
    { attack: 0, defense: 0, critRate: 0 }
  );

  let namePool = WEAPON_NAMES;
  if (type === 'armor') namePool = ARMOR_NAMES;
  else if (type === 'accessory') namePool = ACCESSORY_NAMES;

  const hasEff = materials.some(m => m.effect) || Math.random() < effChance;
  const effs = materials.filter(m => m.effect).map(m => m.effect);
  const pickEff = effs.length > 0 ? effs[Math.floor(Math.random() * effs.length)] : EFFECTS[Math.floor(Math.random() * EFFECTS.length)];

  const result = {
    id: 'it_craft_' + Date.now(),
    name: '[合成] ' + namePool[Math.floor(Math.random() * namePool.length)] + (newQuality === 'gold' ? ' ★' : newQuality === 'purple' ? ' ◆' : newQuality === 'blue' ? ' ●' : ''),
    type,
    quality: newQuality,
    stats: {
      attack: Math.floor(Math.max(avgStat.attack / 3, 2) * qMult),
      defense: Math.floor(Math.max(avgStat.defense / 3, 1) * qMult),
      critRate: Math.floor(Math.max(avgStat.critRate / 3, 0.5) * qMult * 10) / 10,
    },
    effect: hasEff ? pickEff : null,
    upgraded: up,
  };

  res.json({ result });
});

app.listen(PORT, () => {
  console.log(`[Server] Roguelike API running at http://localhost:${PORT}`);
});
