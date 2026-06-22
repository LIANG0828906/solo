const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function generateDungeon(seed, floor) {
  const actualSeed = seed ? hashSeed(String(seed)) : Math.floor(Math.random() * 2147483647);
  const rng = mulberry32(actualSeed);

  const rand = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const randFloat = () => rng();

  const roomCount = rand(4, 7);
  const mapWidth = 60;
  const mapHeight = 40;
  const rooms = [];

  for (let i = 0; i < roomCount; i++) {
    const w = rand(5, 10);
    const h = rand(5, 8);
    const x = rand(1, mapWidth - w - 1);
    const y = rand(1, mapHeight - h - 1);

    let overlapping = false;
    for (const r of rooms) {
      if (x < r.x + r.width + 2 && x + w + 2 > r.x && y < r.y + r.height + 2 && y + h + 2 > r.y) {
        overlapping = true;
        break;
      }
    }

    if (overlapping && rooms.length > 0) {
      continue;
    }

    rooms.push({
      id: uuidv4(),
      x,
      y,
      width: w,
      height: h,
      connections: [],
      isEntrance: false,
      isExit: false,
      hasChest: false,
      enemyCount: rand(0, Math.min(floor + 1, 5)),
    });
  }

  if (rooms.length >= 2) {
    rooms[0].isEntrance = true;
    rooms[0].enemyCount = 0;
    rooms[rooms.length - 1].isExit = true;
  }

  for (const room of rooms) {
    if (!room.isEntrance && !room.isExit && randFloat() < 0.3) {
      room.hasChest = true;
    }
  }

  const corridors = [];
  for (let i = 0; i < rooms.length - 1; i++) {
    const a = rooms[i];
    const b = rooms[i + 1];
    const ax = Math.floor(a.x + a.width / 2);
    const ay = Math.floor(a.y + a.height / 2);
    const bx = Math.floor(b.x + b.width / 2);
    const by = Math.floor(b.y + b.height / 2);

    const midX = bx;
    const midY = ay;

    a.connections.push(b.id);
    b.connections.push(a.id);

    corridors.push({
      from: a.id,
      to: b.id,
      points: [
        { x: ax, y: ay },
        { x: midX, y: midY },
        { x: bx, y: by },
      ],
    });
  }

  if (rooms.length > 3) {
    const extraCount = rand(0, Math.floor(rooms.length / 3));
    for (let e = 0; e < extraCount; e++) {
      const i = rand(0, rooms.length - 1);
      let j = rand(0, rooms.length - 1);
      if (i === j || rooms[i].connections.includes(rooms[j].id)) continue;

      const a = rooms[i];
      const b = rooms[j];
      const ax = Math.floor(a.x + a.width / 2);
      const ay = Math.floor(a.y + a.height / 2);
      const bx = Math.floor(b.x + b.width / 2);
      const by = Math.floor(b.y + b.height / 2);

      a.connections.push(b.id);
      b.connections.push(a.id);

      corridors.push({
        from: a.id,
        to: b.id,
        points: [
          { x: ax, y: ay },
          { x: ax, y: by },
          { x: bx, y: by },
        ],
      });
    }
  }

  const enemyTypes = getEnemyTypesForFloor(floor);
  const enemies = [];
  for (const room of rooms) {
    if (room.enemyCount > 0) {
      for (let e = 0; e < room.enemyCount; e++) {
        const type = enemyTypes[rand(0, enemyTypes.length - 1)];
        enemies.push({
          id: uuidv4(),
          roomId: room.id,
          type: type.type,
          name: type.name,
          hp: type.hp + rand(0, floor * 2),
          attack: type.attack + rand(0, floor),
          defense: type.defense + rand(0, Math.floor(floor / 2)),
        });
      }
    }
  }

  const loot = [];
  for (const room of rooms) {
    if (room.hasChest) {
      const item = rollLootItem(floor, rng);
      loot.push({ ...item, roomId: room.id });
    }
  }

  return { seed: actualSeed, floor, rooms, corridors, enemies, loot };
}

function getEnemyTypesForFloor(floor) {
  const scale = 1 + (floor - 1) * 0.15;

  if (floor <= 4) {
    return [
      { type: 'skeleton', name: '骷髅战士', hp: Math.floor(30 * scale), attack: Math.floor(8 * scale), defense: Math.floor(3 * scale) },
      { type: 'skeleton', name: '骷髅弓箭手', hp: Math.floor(22 * scale), attack: Math.floor(12 * scale), defense: Math.floor(2 * scale) },
      { type: 'skeleton', name: '骷髅长枪兵', hp: Math.floor(35 * scale), attack: Math.floor(10 * scale), defense: Math.floor(5 * scale) },
    ];
  } else if (floor <= 9) {
    return [
      { type: 'ghost', name: '幽灵法师', hp: Math.floor(28 * scale), attack: Math.floor(15 * scale), defense: Math.floor(4 * scale) },
      { type: 'ghost', name: '幽灵刺客', hp: Math.floor(22 * scale), attack: Math.floor(18 * scale), defense: Math.floor(2 * scale) },
      { type: 'ghost', name: '怨灵', hp: Math.floor(40 * scale), attack: Math.floor(12 * scale), defense: Math.floor(6 * scale) },
    ];
  } else {
    return [
      { type: 'demon', name: '恶魔守卫', hp: Math.floor(50 * scale), attack: Math.floor(18 * scale), defense: Math.floor(8 * scale) },
      { type: 'demon', name: '炎魔', hp: Math.floor(45 * scale), attack: Math.floor(22 * scale), defense: Math.floor(5 * scale) },
      { type: 'demon', name: '暗影恶魔', hp: Math.floor(38 * scale), attack: Math.floor(25 * scale), defense: Math.floor(4 * scale) },
    ];
  }
}

function getBossConfig(floor) {
  const scale = 1 + (floor - 1) * 0.2;
  if (floor <= 4) {
    return { type: 'boss_skeleton', name: '骷髅王', hp: Math.floor(150 * scale), attack: Math.floor(20 * scale), defense: Math.floor(10 * scale), isBoss: true };
  } else if (floor <= 9) {
    return { type: 'boss_ghost', name: '幽魂领主', hp: Math.floor(200 * scale), attack: Math.floor(28 * scale), defense: Math.floor(12 * scale), isBoss: true };
  } else {
    return { type: 'boss_demon', name: '深渊魔王', hp: Math.floor(300 * scale), attack: Math.floor(38 * scale), defense: Math.floor(16 * scale), isBoss: true };
  }
}

function rollLootItem(floor, rngFn) {
  const rng = rngFn || Math.random;
  const rand = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const randFloat = () => rng();

  const types = ['weapon', 'armor', 'accessory'];
  const type = types[rand(0, 2)];

  const rarityRoll = randFloat();
  let rarity;
  if (rarityRoll < 0.5) rarity = 'common';
  else if (rarityRoll < 0.8) rarity = 'rare';
  else if (rarityRoll < 0.95) rarity = 'epic';
  else rarity = 'legendary';

  const rarityMultiplier = { common: 1, rare: 1.5, epic: 2.2, legendary: 3.5 }[rarity];
  const floorScale = 1 + (floor - 1) * 0.12;

  const names = {
    weapon: {
      common: ['生锈的短剑', '铁剑', '木质法杖', '猎弓'],
      rare: ['精钢长剑', '秘银匕首', '火焰法杖', '疾风之弓'],
      epic: ['暗影之刃', '雷鸣战锤', '冰霜法杖', '龙骨长弓'],
      legendary: ['天罚圣剑', '毁灭之刃', '永恒法杖', '命运之弓'],
    },
    armor: {
      common: ['布甲', '皮甲', '铁盾', '锁子甲'],
      rare: ['精钢铠甲', '秘银胸甲', '魔法护盾', '暗皮战甲'],
      epic: ['龙鳞铠甲', '圣光之盾', '暗影斗篷', '风暴战甲'],
      legendary: ['神盾埃癸斯', '不朽铠甲', '虚空之袍', '泰坦护甲'],
    },
    accessory: {
      common: ['铜戒指', '布护腕', '皮腰带', '铁项链'],
      rare: ['银戒指', '秘银护腕', '魔法腰带', '宝石项链'],
      epic: ['龙牙戒指', '暗影护腕', '风暴腰带', '灵魂项链'],
      legendary: ['永恒之戒', '命运护腕', '神力腰带', '虚无项链'],
    },
  };

  const namePool = names[type][rarity];
  const name = namePool[rand(0, namePool.length - 1)];

  const baseStats = { weapon: { attack: 5 }, armor: { defense: 4, hp: 10 }, accessory: { attack: 2, defense: 2, hp: 5 } }[type];

  const stats = {};
  for (const [key, base] of Object.entries(baseStats)) {
    stats[key] = Math.floor(base * rarityMultiplier * floorScale * (0.9 + randFloat() * 0.2));
  }

  const bonusStats = {};
  if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
    const bonusOptions = { weapon: ['critRate', 'critDamage'], armor: ['dodge', 'hp'], accessory: ['critRate', 'dodge'] };
    const pool = bonusOptions[type];
    const bonusKey = pool[rand(0, pool.length - 1)];
    if (bonusKey === 'critRate') bonusStats.critRate = +(randFloat() * 0.05 * rarityMultiplier * floorScale).toFixed(3);
    else if (bonusKey === 'critDamage') bonusStats.critDamage = +(randFloat() * 0.15 * rarityMultiplier * floorScale).toFixed(3);
    else if (bonusKey === 'dodge') bonusStats.dodge = +(randFloat() * 0.04 * rarityMultiplier * floorScale).toFixed(3);
    else if (bonusKey === 'hp') bonusStats.hp = Math.floor(8 * rarityMultiplier * floorScale);
  }

  if (rarity === 'legendary') {
    const specialEffects = ['灼烧：攻击时附带火焰伤害', '冰冻：攻击时有概率冻结敌人', '吸血：攻击时恢复生命值', '雷霆：攻击附带闪电链', '破甲：无视部分防御', '再生：每回合恢复生命值'];
    bonusStats.specialEffect = specialEffects[rand(0, specialEffects.length - 1)];
  }

  return {
    id: uuidv4(),
    type,
    name,
    rarity,
    stats,
    bonusStats,
    level: Math.max(1, floor),
  };
}

app.post('/api/dungeon/generate', (req, res) => {
  const { seed, floor } = req.body;
  const actualFloor = floor && floor > 0 ? floor : 1;
  const dungeon = generateDungeon(seed, actualFloor);
  res.json(dungeon);
});

app.get('/api/enemies/config', (req, res) => {
  const floor = parseInt(req.query.floor, 10) || 1;
  const enemyTypes = getEnemyTypesForFloor(floor);
  const configs = enemyTypes.map((e) => ({ ...e, floor }));

  if (floor % 5 === 0) {
    const boss = getBossConfig(floor);
    configs.push({ ...boss, floor });
  }

  res.json(configs);
});

app.post('/api/loot/roll', (req, res) => {
  const { playerLevel, floor } = req.body;
  const actualFloor = floor && floor > 0 ? floor : 1;
  const item = rollLootItem(actualFloor);
  res.json(item);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log('Server running on port 3001');
});
