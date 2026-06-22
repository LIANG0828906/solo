import { useBattleStore, type MonsterTemplate, type MonsterInstance } from './store'

export const MONSTER_TEMPLATES: MonsterTemplate[] = [
  { id: 'goblin', name: '哥布林', race: '地精族', cost: 10, attack: 8, attackInterval: 1000, emoji: '👺' },
  { id: 'skeleton', name: '骷髅兵', race: '亡灵族', cost: 15, attack: 12, attackInterval: 1200, emoji: '💀' },
  { id: 'werewolf', name: '狼人', race: '兽族', cost: 25, attack: 20, attackInterval: 1500, emoji: '🐺' },
  { id: 'shadow_mage', name: '暗影法师', race: '元素族', cost: 30, attack: 15, attackInterval: 800, emoji: '🧙' },
  { id: 'gargoyle', name: '石像鬼', race: '恶魔族', cost: 35, attack: 25, attackInterval: 2000, emoji: '👹' },
  { id: 'vampire', name: '吸血鬼', race: '不死族', cost: 45, attack: 30, attackInterval: 1800, emoji: '🧛' },
]

let monsterIdCounter = 0

export function summonMonster(templateId: string): boolean {
  const store = useBattleStore.getState()
  const template = MONSTER_TEMPLATES.find((t) => t.id === templateId)
  if (!template) return false
  if (store.mana < template.cost) return false

  const instance: MonsterInstance = {
    id: `monster_${++monsterIdCounter}_${Date.now()}`,
    templateId,
    slotIndex: store.formation.length,
    lastAttackTime: 0,
  }

  useBattleStore.setState((s) => ({
    mana: s.mana - template.cost,
    formation: [...s.formation, instance],
  }))

  return true
}

export function initManaRegen(): () => void {
  const interval = setInterval(() => {
    const store = useBattleStore.getState()
    if (store.mana < store.maxMana) {
      useBattleStore.setState({ mana: Math.min(store.mana + 5, store.maxMana), manaPulse: true })
      setTimeout(() => useBattleStore.setState({ manaPulse: false }), 300)
    }
  }, 2000)

  return () => clearInterval(interval)
}

export function addKillMana(): void {
  const store = useBattleStore.getState()
  if (store.mana < store.maxMana) {
    useBattleStore.setState({ mana: Math.min(store.mana + 3, store.maxMana), manaFlash: true })
    setTimeout(() => useBattleStore.setState({ manaFlash: false }), 200)
  }
}

export function getMonsterTemplate(templateId: string): MonsterTemplate | undefined {
  return MONSTER_TEMPLATES.find((t) => t.id === templateId)
}
