import React from 'react'
import { useGameStore } from '@/stores/gameStore'
import { Sword, Wand2, Heart } from 'lucide-react'
import type { Hero } from '@/types'

interface HeroListItemProps {
  hero: Hero
  isSelected: boolean
  onClick: () => void
}

const HeroListItem: React.FC<HeroListItemProps> = ({ hero, isSelected, onClick }) => {
  const hpPercentage = (hero.hp / hero.maxHp) * 100

  const getAvatar = () => {
    const baseClass = 'w-8 h-8 rounded-full flex items-center justify-center text-white'
    switch (hero.type) {
      case 'warrior':
        return (
          <div className={`${baseClass} bg-[var(--hero-color)]`}>
            <Sword size={16} />
          </div>
        )
      case 'mage':
        return (
          <div className={`${baseClass} bg-[var(--hero-color)]`}>
            <Wand2 size={16} />
          </div>
        )
      case 'cleric':
        return (
          <div className={`${baseClass} bg-[var(--hero-color)]`}>
            <Heart size={16} />
          </div>
        )
    }
  }

  const getHpBarColor = () => {
    if (hpPercentage > 60) return 'from-[var(--hp-high-start)] to-[var(--hp-high-end)]'
    if (hpPercentage > 30) return 'from-[var(--hp-mid-start)] to-[var(--hp-mid-end)]'
    return 'from-[var(--hp-low-start)] to-[var(--hp-low-end)]'
  }

  return (
    <div
      className={`h-[48px] bg-[var(--panel-bg)] rounded cursor-pointer transition-all duration-200 flex items-center px-3 gap-3 hover:brightness-110 ${
        isSelected ? 'border-2 border-[var(--selected-border)]' : 'border-2 border-transparent'
      }`}
      onClick={onClick}
    >
      {getAvatar()}

      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">{hero.name}</div>
        <div className="h-2 bg-[var(--hp-bg)] rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getHpBarColor()} transition-all duration-500 ease-out`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex gap-1">
        {hero.skills.map((skill, index) => (
          <div
            key={index}
            className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white/30 ${
              skill.currentCooldown > 0 ? 'opacity-50' : 'opacity-100'
            }`}
            style={{
              backgroundColor: skill.type === 'damage' ? '#E74C3C' : skill.type === 'heal' ? '#27AE60' : '#F39C12'
            }}
            title={skill.name}
          >
            {skill.currentCooldown > 0 ? skill.currentCooldown : skill.name.charAt(0)}
          </div>
        ))}
      </div>
    </div>
  )
}

export const HeroPanel: React.FC = () => {
  const { heroes, selectedHeroId, selectHero } = useGameStore()

  return (
    <div className="hero-panel w-[240px] flex flex-col gap-1 p-3 bg-[var(--app-bg)] border-r border-[var(--cell-border)]">
      <h2 className="text-white text-lg font-bold mb-2 px-1">英雄小队</h2>
      <div className="flex flex-col gap-[4px]">
        {heroes.map((hero) => (
          <HeroListItem
            key={hero.id}
            hero={hero}
            isSelected={selectedHeroId === hero.id}
            onClick={() => selectHero(hero.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default HeroPanel
