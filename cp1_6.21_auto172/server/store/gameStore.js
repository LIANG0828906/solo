const characters = {
  berserker: {
    id: 'berserker',
    name: '近战狂战士',
    hp: 150,
    maxHp: 150,
    skills: [
      { id: 'heavy_strike', name: '重击', cooldown: 1500, currentCooldown: 0, damage: 30, range: 60 },
      { id: 'whirlwind', name: '旋风斩', cooldown: 3000, currentCooldown: 0, damage: 20, range: 80 },
      { id: 'war_cry', name: '战吼', cooldown: 5000, currentCooldown: 0, damage: 0, range: 0 },
    ],
    switchCooldown: 0,
    position: { x: 200, y: 300 },
  },
  ranger: {
    id: 'ranger',
    name: '远程游侠',
    hp: 100,
    maxHp: 100,
    skills: [
      { id: 'precise_shot', name: '精准射击', cooldown: 1000, currentCooldown: 0, damage: 25, range: 200 },
      { id: 'multi_arrow', name: '多重箭', cooldown: 4000, currentCooldown: 0, damage: 15, range: 150 },
      { id: 'dodge', name: '闪避', cooldown: 2000, currentCooldown: 0, damage: 0, range: 0 },
    ],
    switchCooldown: 0,
    position: { x: 200, y: 300 },
  },
  sage: {
    id: 'sage',
    name: '治疗贤者',
    hp: 80,
    maxHp: 80,
    skills: [
      { id: 'heal', name: '治疗术', cooldown: 3000, currentCooldown: 0, damage: 0, range: 0 },
      { id: 'holy_bolt', name: '圣光弹', cooldown: 2000, currentCooldown: 0, damage: 15, range: 150 },
      { id: 'shield', name: '护盾', cooldown: 8000, currentCooldown: 0, damage: 0, range: 0 },
    ],
    switchCooldown: 0,
    position: { x: 200, y: 300 },
  },
}

const levelProgress = {}
const comboRecords = {}
const healthTimelines = {}

let bestCombo = 0

export function getCharacter(id) {
  return characters[id] ? { ...characters[id], skills: characters[id].skills.map(s => ({ ...s })) } : null
}

export function getAllCharacters() {
  return Object.values(characters).map(c => ({ ...c, skills: c.skills.map(s => ({ ...s })) }))
}

export function updateCharacter(id, updates) {
  if (!characters[id]) return null
  if (updates.hp !== undefined) characters[id].hp = Math.max(0, Math.min(characters[id].maxHp, updates.hp))
  if (updates.switchTriggered) characters[id].switchCooldown = Date.now() + 500
  if (updates.activeSkill !== undefined) {
    const skill = characters[id].skills.find(s => s.id === updates.activeSkill)
    if (skill) skill.currentCooldown = Date.now() + skill.cooldown
  }
  return getCharacter(id)
}

export function getLevelProgress(levelId) {
  return levelProgress[levelId] || { levelId, currentWave: 0, totalWaves: 5, enemiesRemaining: 0, comboRecord: 0 }
}

export function updateLevelProgress(levelId, updates) {
  if (!levelProgress[levelId]) {
    levelProgress[levelId] = { levelId, currentWave: 0, totalWaves: 5, enemiesRemaining: 0, comboRecord: 0 }
  }
  Object.assign(levelProgress[levelId], updates)
  return levelProgress[levelId]
}

export function saveCombo(comboCount, levelId, timestamp) {
  if (!comboRecords[levelId]) comboRecords[levelId] = []
  comboRecords[levelId].push({ comboCount, timestamp })
  if (comboCount > bestCombo) bestCombo = comboCount
  return { saved: true, bestCombo }
}

export function getHealthTimeline(levelId) {
  return healthTimelines[levelId] || []
}

export function saveHealthTimeline(levelId, timeline) {
  healthTimelines[levelId] = timeline
  return { saved: true, pointCount: timeline.length }
}
