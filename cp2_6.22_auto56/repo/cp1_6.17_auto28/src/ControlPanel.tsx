import { useCombatStore, SwordsmanSkill, MageSkill } from './store'

interface ControlPanelProps {
  onStart: () => void
  disabled: boolean
}

const SWORDSMAN_SKILLS: SwordsmanSkill[] = ['重斩', '旋风斩', '格挡']
const MAGE_SKILLS: MageSkill[] = ['火球', '冰锥', '护盾']

function ControlPanel({ onStart, disabled }: ControlPanelProps) {
  const { swordsman, mage, updateSwordsman, updateMage } = useCombatStore()

  return (
    <div
      style={{
        width: '800px',
        height: '200px',
        background: '#1E1E1E',
        padding: '20px',
        borderRadius: '12px',
        display: 'flex',
        gap: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        border: '1px solid #333'
      }}
    >
      <div
        className="character-config swordsman"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          background: 'rgba(0, 191, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 191, 255, 0.2)'
        }}
      >
        <h3 style={{ color: '#00BFFF', fontSize: '18px', marginBottom: '8px' }}>
          ⚔️ 剑士配置
        </h3>

        <SliderRow
          label="生命值"
          value={swordsman.maxHp}
          min={100}
          max={300}
          onChange={(val) => updateSwordsman({ maxHp: val })}
          colorClass="swordsman-slider"
        />

        <SliderRow
          label="攻击力"
          value={swordsman.attack}
          min={10}
          max={50}
          onChange={(val) => updateSwordsman({ attack: val })}
          colorClass="swordsman-slider"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ color: '#fff', fontSize: '14px', minWidth: '60px' }}>技能</label>
          <select
            value={swordsman.skill}
            onChange={(e) => updateSwordsman({ skill: e.target.value as SwordsmanSkill })}
            disabled={disabled}
            style={{ flex: 1 }}
          >
            {SWORDSMAN_SKILLS.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px'
        }}
      >
        <button
          className="start-btn"
          onClick={onStart}
          disabled={disabled}
          style={{
            width: '120px',
            height: '44px'
          }}
        >
          {disabled ? '战斗中...' : 'START'}
        </button>
      </div>

      <div
        className="character-config mage"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          background: 'rgba(255, 64, 128, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 64, 128, 0.2)'
        }}
      >
        <h3 style={{ color: '#FF4080', fontSize: '18px', marginBottom: '8px' }}>
          🔮 法师配置
        </h3>

        <SliderRow
          label="生命值"
          value={mage.maxHp}
          min={80}
          max={200}
          onChange={(val) => updateMage({ maxHp: val })}
          colorClass="mage-slider"
        />

        <SliderRow
          label="攻击力"
          value={mage.attack}
          min={20}
          max={60}
          onChange={(val) => updateMage({ attack: val })}
          colorClass="mage-slider"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ color: '#fff', fontSize: '14px', minWidth: '60px' }}>技能</label>
          <select
            value={mage.skill}
            onChange={(e) => updateMage({ skill: e.target.value as MageSkill })}
            disabled={disabled}
            style={{ flex: 1 }}
          >
            {MAGE_SKILLS.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  colorClass: string
}

function SliderRow({ label, value, min, max, onChange, colorClass }: SliderRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <label style={{ color: '#fff', fontSize: '14px', minWidth: '60px' }}>{label}</label>
      <input
        type="range"
        className={colorClass}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1 }}
      />
      <span style={{
        color: '#FFFFFF',
        fontSize: '14px',
        minWidth: '40px',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums'
      }}>
        {value}
      </span>
    </div>
  )
}

export default ControlPanel
