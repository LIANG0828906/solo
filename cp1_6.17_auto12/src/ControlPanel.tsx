import { useState } from 'react'
import { useFightStore, SwordsmanSkill, MageSkill } from './store'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  color: string
  onChange: (val: number) => void
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, color, onChange }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: '14px',
          color: '#FFFFFF',
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 'bold' }}>{value}</span>
      </div>
      <div style={{ position: 'relative', height: '6px' }}>
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '6px',
            background: '#444444',
            borderRadius: '3px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            height: '6px',
            width: `${((value - min) / (max - min)) * 100}%`,
            background: color,
            borderRadius: '3px',
            transition: 'width 0.2s ease',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            top: '-6px',
            left: '0',
            width: '100%',
            height: '18px',
            margin: '0',
            opacity: '0',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-5px',
            left: `calc(${((value - min) / (max - min)) * 100}% - 9px)`,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
            pointerEvents: 'none',
            transition: 'left 0.2s ease, box-shadow 0.2s ease',
          }}
        />
      </div>
    </div>
  )
}

const SkillIcon: React.FC<{ skill: string; color: string }> = ({ skill, color }) => {
  const symbols: Record<string, string> = {
    heavy_slash: '⚔',
    whirlwind: '🌀',
    block: '🛡',
    fireball: '🔥',
    ice_spike: '❄',
    shield: '✨',
  }
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '32px',
        height: '32px',
        fontSize: '28px',
        opacity: '0.15',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
      }}
    >
      {symbols[skill] || '?'}
    </div>
  )
}

const ControlPanel: React.FC = () => {
  const swordsman = useFightStore((s) => s.swordsman)
  const mage = useFightStore((s) => s.mage)
  const fightStatus = useFightStore((s) => s.fightStatus)
  const updateCharacter = useFightStore((s) => s.updateCharacter)
  const startFight = useFightStore((s) => s.startFight)
  const [isPressed, setIsPressed] = useState(false)

  const swordsmanSkills: { value: SwordsmanSkill; label: string }[] = [
    { value: 'heavy_slash', label: '重斩' },
    { value: 'whirlwind', label: '旋风斩' },
    { value: 'block', label: '格挡' },
  ]

  const mageSkills: { value: MageSkill; label: string }[] = [
    { value: 'fireball', label: '火球' },
    { value: 'ice_spike', label: '冰锥' },
    { value: 'shield', label: '护盾' },
  ]

  const selectStyle = (color: string) => ({
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    background: '#2C2C2C',
    color: '#FFFFFF',
    border: `1px solid #444`,
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    ':hover': {
      borderColor: color,
      boxShadow: `0 0 8px ${color}`,
    },
  })

  return (
    <div
      style={{
        width: '800px',
        height: '200px',
        background: '#1E1E1E',
        padding: '20px',
        boxSizing: 'border-box',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px',
        position: 'relative',
      }}
    >
      <div
        style={{
          flex: 1,
          position: 'relative',
          padding: '10px',
          border: '1px solid rgba(0, 191, 255, 0.2)',
          borderRadius: '8px',
          background: 'rgba(0, 191, 255, 0.03)',
          transition: 'all 0.2s ease',
        }}
      >
        <SkillIcon skill={swordsman.skill as string} color="#00BFFF" />
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#00BFFF',
            marginBottom: '12px',
            textShadow: '0 0 10px rgba(0, 191, 255, 0.5)',
          }}
        >
          ⚔ 剑士
        </div>
        <Slider
          label="生命值"
          value={swordsman.maxHp}
          min={100}
          max={300}
          color="#00BFFF"
          onChange={(val) => updateCharacter('swordsman', { maxHp: val, hp: val })}
        />
        <Slider
          label="攻击力"
          value={swordsman.attack}
          min={10}
          max={50}
          color="#00BFFF"
          onChange={(val) => updateCharacter('swordsman', { attack: val })}
        />
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', color: '#FFFFFF', marginBottom: '6px' }}>技能</div>
          <select
            value={swordsman.skill}
            onChange={(e) =>
              updateCharacter('swordsman', { skill: e.target.value as SwordsmanSkill })
            }
            disabled={fightStatus === 'fighting'}
            style={selectStyle('#00BFFF')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00BFFF'
              e.currentTarget.style.boxShadow = '0 0 8px #00BFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#444'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {swordsmanSkills.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 10px',
        }}
      >
        <button
          onClick={startFight}
          disabled={fightStatus === 'fighting'}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          style={{
            width: '120px',
            height: '44px',
            background: fightStatus === 'fighting'
              ? '#555'
              : 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: fightStatus === 'fighting' ? 'not-allowed' : 'pointer',
            letterSpacing: '2px',
            transition: 'all 0.2s ease',
            boxShadow: isPressed
              ? 'inset 0 2px 8px rgba(0,0,0,0.5)'
              : fightStatus === 'fighting'
              ? 'none'
              : '0 4px 12px rgba(76, 175, 80, 0.4)',
            filter: fightStatus === 'fighting' ? 'grayscale(0.5)' : 'none',
          }}
        >
          {fightStatus === 'fighting' ? '战斗中' : 'START'}
        </button>
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          padding: '10px',
          border: '1px solid rgba(255, 64, 128, 0.2)',
          borderRadius: '8px',
          background: 'rgba(255, 64, 128, 0.03)',
          transition: 'all 0.2s ease',
        }}
      >
        <SkillIcon skill={mage.skill as string} color="#FF4080" />
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#FF4080',
            marginBottom: '12px',
            textShadow: '0 0 10px rgba(255, 64, 128, 0.5)',
            textAlign: 'right',
          }}
        >
          ✦ 法师
        </div>
        <Slider
          label="生命值"
          value={mage.maxHp}
          min={80}
          max={200}
          color="#FF4080"
          onChange={(val) => updateCharacter('mage', { maxHp: val, hp: val })}
        />
        <Slider
          label="攻击力"
          value={mage.attack}
          min={20}
          max={60}
          color="#FF4080"
          onChange={(val) => updateCharacter('mage', { attack: val })}
        />
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', color: '#FFFFFF', marginBottom: '6px' }}>技能</div>
          <select
            value={mage.skill}
            onChange={(e) => updateCharacter('mage', { skill: e.target.value as MageSkill })}
            disabled={fightStatus === 'fighting'}
            style={selectStyle('#FF4080')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FF4080'
              e.currentTarget.style.boxShadow = '0 0 8px #FF4080'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#444'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {mageSkills.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
