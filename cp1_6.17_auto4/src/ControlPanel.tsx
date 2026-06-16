import { useState } from 'react';
import { useCombatStore, SwordsmanSkill, MageSkill, CharacterType } from './store';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  color: string;
  onChange: (value: number) => void;
  disabled: boolean;
}

function Slider({ label, value, min, max, step, color, onChange, disabled }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ color: '#E0E0E0', fontSize: '13px', fontWeight: 500 }}>{label}</span>
        <span style={{ color: '#FFFFFF', fontSize: '14px', fontFamily: "'JetBrains Mono', monospace" }}>
          {value}
        </span>
      </div>
      <div style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '8px',
            background: '#444',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              background: color,
              transition: 'width 0.2s ease',
              boxShadow: disabled ? 'none' : `0 0 8px ${color}60`,
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            width: '100%',
            height: '24px',
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `calc(${percentage}% - 8px)`,
            width: '16px',
            height: '16px',
            background: color,
            borderRadius: '50%',
            boxShadow: disabled ? 'none' : `0 0 10px ${color}`,
            transition: 'left 0.05s linear, box-shadow 0.2s ease',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

interface SkillIconProps {
  skill: string;
  type: CharacterType;
}

function SkillIcon({ skill, type }: SkillIconProps) {
  const color = type === 'swordsman' ? '#00BFFF' : '#FF4080';
  const icons: Record<string, string> = {
    heavy_slash: '⚔️',
    whirlwind: '🌀',
    block: '🛡️',
    fireball: '🔥',
    ice_spike: '❄️',
    shield: '🔮',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        opacity: 0.3,
        filter: `drop-shadow(0 0 4px ${color})`,
      }}
    >
      {icons[skill] || '⚔️'}
    </div>
  );
}

export default function ControlPanel() {
  const [isPressed, setIsPressed] = useState(false);
  const {
    swordsman,
    mage,
    fighting,
    winner,
    updateCharacter,
    startFight,
  } = useCombatStore((state) => state);

  const disabled = fighting || !!winner;

  const swordsmanSkills: { value: SwordsmanSkill; label: string }[] = [
    { value: 'heavy_slash', label: '重斩' },
    { value: 'whirlwind', label: '旋风斩' },
    { value: 'block', label: '格挡' },
  ];

  const mageSkills: { value: MageSkill; label: string }[] = [
    { value: 'fireball', label: '火球' },
    { value: 'ice_spike', label: '冰锥' },
    { value: 'shield', label: '护盾' },
  ];

  return (
    <div
      style={{
        width: '800px',
        height: '200px',
        background: '#1E1E1E',
        padding: '20px',
        boxSizing: 'border-box',
        display: 'flex',
        gap: '20px',
        borderRadius: '0 0 4px 4px',
        border: '2px solid #444',
        borderTop: 'none',
      }}
    >
      <div
        style={{
          flex: 1,
          position: 'relative',
          padding: '12px',
          background: 'rgba(0, 191, 255, 0.05)',
          borderRadius: '6px',
          border: '1px solid rgba(0, 191, 255, 0.2)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = 'rgba(0, 191, 255, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 191, 255, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 191, 255, 0.05)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <SkillIcon skill={swordsman.skill} type="swordsman" />
        <h3
          style={{
            color: '#00BFFF',
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: 700,
            textShadow: '0 0 10px rgba(0, 191, 255, 0.5)',
          }}
        >
          剑士配置
        </h3>
        <Slider
          label="生命值"
          value={swordsman.maxHp}
          min={100}
          max={300}
          step={10}
          color="#00BFFF"
          onChange={(v) => updateCharacter('swordsman', 'maxHp', v)}
          disabled={disabled}
        />
        <Slider
          label="攻击力"
          value={swordsman.attack}
          min={10}
          max={50}
          step={5}
          color="#00BFFF"
          onChange={(v) => updateCharacter('swordsman', 'attack', v)}
          disabled={disabled}
        />
        <div>
          <span style={{ color: '#E0E0E0', fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
            技能
          </span>
          <select
            value={swordsman.skill}
            onChange={(e) => updateCharacter('swordsman', 'skill', e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#2C2C2C',
              color: '#E0E0E0',
              border: '1px solid #444',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = '#00BFFF';
                e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 191, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#444';
              e.currentTarget.style.boxShadow = 'none';
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 10px',
        }}
      >
        <button
          onClick={startFight}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={(e) => {
            setIsPressed(false);
            e.currentTarget.style.filter = fighting ? 'grayscale(0.5) brightness(0.7)' : 'brightness(1)';
          }}
          disabled={fighting}
          style={{
            width: '120px',
            height: '44px',
            background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: fighting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isPressed
              ? 'inset 0 2px 8px rgba(0,0,0,0.5)'
              : '0 4px 15px rgba(76, 175, 80, 0.4)',
            transform: isPressed ? 'translateY(2px)' : 'translateY(0)',
            filter: fighting ? 'grayscale(0.5) brightness(0.7)' : 'brightness(1)',
            letterSpacing: '2px',
          }}
          onMouseEnter={(e) => {
            if (!fighting) {
              e.currentTarget.style.filter = 'brightness(1.2)';
            }
          }}
        >
          START
        </button>
        {fighting && (
          <span style={{ color: '#888', fontSize: '11px', marginTop: '8px' }}>战斗中...</span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          padding: '12px',
          background: 'rgba(255, 64, 128, 0.05)',
          borderRadius: '6px',
          border: '1px solid rgba(255, 64, 128, 0.2)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = 'rgba(255, 64, 128, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 64, 128, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 64, 128, 0.05)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <SkillIcon skill={mage.skill} type="mage" />
        <h3
          style={{
            color: '#FF4080',
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: 700,
            textShadow: '0 0 10px rgba(255, 64, 128, 0.5)',
          }}
        >
          法师配置
        </h3>
        <Slider
          label="生命值"
          value={mage.maxHp}
          min={80}
          max={200}
          step={10}
          color="#FF4080"
          onChange={(v) => updateCharacter('mage', 'maxHp', v)}
          disabled={disabled}
        />
        <Slider
          label="攻击力"
          value={mage.attack}
          min={20}
          max={60}
          step={5}
          color="#FF4080"
          onChange={(v) => updateCharacter('mage', 'attack', v)}
          disabled={disabled}
        />
        <div>
          <span style={{ color: '#E0E0E0', fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
            技能
          </span>
          <select
            value={mage.skill}
            onChange={(e) => updateCharacter('mage', 'skill', e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#2C2C2C',
              color: '#E0E0E0',
              border: '1px solid #444',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = '#FF4080';
                e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 64, 128, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#444';
              e.currentTarget.style.boxShadow = 'none';
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
  );
}
