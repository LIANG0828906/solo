import React from 'react'
import type { SkillType, Player as PlayerType } from '../types/game'
import { SKILL_CONFIG } from '../types/game'

interface PlayerPanelProps {
  player: PlayerType
  isCurrentTurn: boolean
  turnTimer: number
  selectedSkill: SkillType | null
  onSelectSkill: (skill: SkillType | null) => void
  onEndTurn: () => void
  side: 'left' | 'right'
  roomReady: boolean
}

const hpColor = (percent: number) => {
  if (percent > 60) return 'linear-gradient(90deg,#16A34A,#22C55E,#4ADE80)'
  if (percent >= 30) return 'linear-gradient(90deg,#CA8A04,#EAB308,#FACC15)'
  return 'linear-gradient(90deg,#B91C1C,#EF4444,#F87171)'
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  player,
  isCurrentTurn,
  turnTimer,
  selectedSkill,
  onSelectSkill,
  onEndTurn,
  side,
  roomReady,
}) => {
  const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100)
  const skills: SkillType[] = ['fireball', 'iceshield', 'lightning']

  return (
    <div
      className="flex flex-col items-center gap-4 p-5 rounded-2xl"
      style={{
        background: '#1E293B',
        boxShadow: isCurrentTurn
          ? `0 0 30px ${player.id === 1 ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.5)'}`
          : 'none',
        minWidth: 280,
        border: isCurrentTurn ? `2px solid ${player.id === 1 ? '#EF4444' : '#3B82F6'}` : '2px solid transparent',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{
            background: player.id === 1 ? 'linear-gradient(135deg,#7F1D1D,#DC2626)' : 'linear-gradient(135deg,#1E3A8A,#2563EB)',
            boxShadow: `0 0 15px ${player.id === 1 ? '#EF4444' : '#3B82F6'}`,
          }}
        >
          {player.id === 1 ? '🔥' : '❄️'}
        </div>
        <div>
          <div className="text-white text-lg font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {player.name}
          </div>
          <div
            className="text-xs"
            style={{
              color: isCurrentTurn ? '#4ADE80' : '#94A3B8',
              fontFamily: 'Orbitron, sans-serif',
            }}
          >
            {isCurrentTurn ? `行动中 ${turnTimer}s` : '等待中...'}
          </div>
        </div>
        {player.hasIceShield && (
          <div className="text-xl" title="冰盾激活">🛡️</div>
        )}
      </div>

      <div className="w-full">
        <div
          style={{
            width: 200,
            height: 24,
            background: '#0F172A',
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid #334155',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
          }}
        >
          <div
            style={{
              width: `${hpPercent}%`,
              height: '100%',
              background: hpColor(hpPercent),
              transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.05)',
            }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: 1,
            }}
          >
            {player.hp} / {player.maxHp}
          </div>
        </div>
      </div>

      <div className={`flex ${side === 'right' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
        {skills.map((skill) => {
          const cfg = SKILL_CONFIG[skill]
          const cd = player.cooldowns[skill]
          const disabled = cd > 0 || !isCurrentTurn || !roomReady
          const selected = selectedSkill === skill
          return (
            <button
              key={skill}
              disabled={disabled}
              onClick={() => onSelectSkill(selected ? null : skill)}
              className="relative overflow-hidden"
              style={{
                width: 80,
                height: 40,
                borderRadius: 8,
                border: selected ? '2px solid #FACC15' : '1px solid #475569',
                background: disabled
                  ? 'linear-gradient(180deg,#334155,#1E293B)'
                  : 'linear-gradient(180deg,#3B82F6,#2563EB)',
                color: '#FFFFFF',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transform: 'translateY(0)',
                boxShadow: selected
                  ? '0 0 20px rgba(250,204,21,0.7)'
                  : disabled
                  ? 'none'
                  : '0 4px 10px rgba(37,99,235,0.4)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,99,235,0.6)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = selected
                  ? '0 0 20px rgba(250,204,21,0.7)'
                  : disabled
                  ? 'none'
                  : '0 4px 10px rgba(37,99,235,0.4)'
              }}
            >
              <span className="mr-1">{cfg.icon}</span>
              {cfg.name}
              {cd > 0 && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: 'rgba(0,0,0,0.7)',
                    fontSize: 16,
                    fontFamily: 'Orbitron, sans-serif',
                  }}
                >
                  {cd}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {isCurrentTurn && roomReady && (
        <button
          onClick={onEndTurn}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid #F59E0B',
            background: 'linear-gradient(180deg,#F59E0B,#D97706)',
            color: 'white',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(245,158,11,0.4)',
          }}
        >
          结束回合 ⏭
        </button>
      )}
    </div>
  )
}
