import React from 'react';
import { useFightStore, SwordsmanSkill, MageSkill } from './store';

const swordsmanSkills: { value: SwordsmanSkill; label: string }[] = [
  { value: 'heavySlash', label: '重斩' },
  { value: 'whirlwind', label: '旋风斩' },
  { value: 'block', label: '格挡' },
];

const mageSkills: { value: MageSkill; label: string }[] = [
  { value: 'fireball', label: '火球' },
  { value: 'iceSpike', label: '冰锥' },
  { value: 'shield', label: '护盾' },
];

export default function ControlPanel() {
  const swordsman = useFightStore((s) => s.swordsman);
  const mage = useFightStore((s) => s.mage);
  const isFighting = useFightStore((s) => s.isFighting);
  const setSwordsmanStats = useFightStore((s) => s.setSwordsmanStats);
  const setMageStats = useFightStore((s) => s.setMageStats);
  const startFight = useFightStore((s) => s.startFight);

  const containerStyle: React.CSSProperties = {
    height: 200,
    background: '#1E1E1E',
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    boxSizing: 'border-box',
  };

  const columnStyle = (accentColor: string): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    position: 'relative',
    padding: 10,
    borderRadius: 8,
    border: `1px solid ${accentColor}33`,
  });

  const titleStyle = (color: string): React.CSSProperties => ({
    color,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  });

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const labelStyle: React.CSSProperties = {
    color: '#AAA',
    fontSize: 13,
    minWidth: 48,
  };

  const valueStyle: React.CSSProperties = {
    color: '#FFFFFF',
    fontSize: 14,
    minWidth: 32,
    textAlign: 'right',
  };

  const bgIconStyle: React.CSSProperties = {
    position: 'absolute',
    fontSize: 64,
    opacity: 0.06,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    userSelect: 'none',
    lineHeight: 1,
    width: 32,
    height: 32,
    overflow: 'hidden',
  };

  const sliderStyle = (accentColor: string): React.CSSProperties => ({
    flex: 1,
    accentColor,
    cursor: isFighting ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
  });

  const selectStyle = (accentColor: string): React.CSSProperties = {
    background: '#333',
    border: '1px solid #555',
    color: '#FFF',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 13,
    cursor: isFighting ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  };

  const startBtnStyle: React.CSSProperties = {
    width: 120,
    height: 44,
    borderRadius: 8,
    background: isFighting
      ? '#555'
      : 'linear-gradient(to bottom, #4CAF50, #388E3C)',
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    border: 'none',
    cursor: isFighting ? 'not-allowed' : 'pointer',
    opacity: isFighting ? 0.6 : 1,
    transition: 'all 0.2s ease',
    flexShrink: 0,
  };

  const handleSliderMouseEnter = (
    e: React.MouseEvent<HTMLInputElement>,
    accentColor: string,
  ) => {
    if (isFighting) return;
    e.currentTarget.style.boxShadow = `0 0 8px ${accentColor}`;
  };

  const handleSliderMouseLeave = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  };

  const handleSelectMouseEnter = (
    e: React.MouseEvent<HTMLSelectElement>,
    accentColor: string,
  ) => {
    if (isFighting) return;
    e.currentTarget.style.borderColor = accentColor;
    e.currentTarget.style.boxShadow = `0 0 8px ${accentColor}`;
  };

  const handleSelectMouseLeave = (e: React.MouseEvent<HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#555';
    e.currentTarget.style.boxShadow = 'none';
  };

  const handleBtnMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isFighting) return;
    e.currentTarget.style.filter = 'brightness(1.2)';
  };

  const handleBtnMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.filter = 'none';
  };

  const handleBtnMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isFighting) return;
    e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.4)';
  };

  const handleBtnMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={containerStyle}>
      <div style={columnStyle('#00BFFF')}>
        <div style={bgIconStyle}>⚔</div>
        <div style={titleStyle('#00BFFF')}>⚔ 剑士</div>
        <div style={rowStyle}>
          <span style={labelStyle}>生命值</span>
          <input
            type="range"
            min={100}
            max={300}
            value={swordsman.maxHp}
            disabled={isFighting}
            style={sliderStyle('#00BFFF')}
            onChange={(e) =>
              setSwordsmanStats({ maxHp: Number(e.target.value) })
            }
            onMouseEnter={(e) => handleSliderMouseEnter(e, '#00BFFF')}
            onMouseLeave={handleSliderMouseLeave}
          />
          <span style={valueStyle}>{swordsman.maxHp}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>攻击力</span>
          <input
            type="range"
            min={10}
            max={50}
            value={swordsman.attack}
            disabled={isFighting}
            style={sliderStyle('#00BFFF')}
            onChange={(e) =>
              setSwordsmanStats({ attack: Number(e.target.value) })
            }
            onMouseEnter={(e) => handleSliderMouseEnter(e, '#00BFFF')}
            onMouseLeave={handleSliderMouseLeave}
          />
          <span style={valueStyle}>{swordsman.attack}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>技能</span>
          <select
            value={swordsman.skill}
            disabled={isFighting}
            style={selectStyle('#00BFFF')}
            onChange={(e) =>
              setSwordsmanStats({ skill: e.target.value as SwordsmanSkill })
            }
            onMouseEnter={(e) => handleSelectMouseEnter(e, '#00BFFF')}
            onMouseLeave={handleSelectMouseLeave}
          >
            {swordsmanSkills.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        style={startBtnStyle}
        disabled={isFighting}
        onClick={startFight}
        onMouseEnter={handleBtnMouseEnter}
        onMouseLeave={handleBtnMouseLeave}
        onMouseDown={handleBtnMouseDown}
        onMouseUp={handleBtnMouseUp}
      >
        {isFighting ? '战斗中...' : 'START'}
      </button>

      <div style={columnStyle('#FF4080')}>
        <div style={bgIconStyle}>🔮</div>
        <div style={titleStyle('#FF4080')}>🔮 法师</div>
        <div style={rowStyle}>
          <span style={labelStyle}>生命值</span>
          <input
            type="range"
            min={80}
            max={200}
            value={mage.maxHp}
            disabled={isFighting}
            style={sliderStyle('#FF4080')}
            onChange={(e) => setMageStats({ maxHp: Number(e.target.value) })}
            onMouseEnter={(e) => handleSliderMouseEnter(e, '#FF4080')}
            onMouseLeave={handleSliderMouseLeave}
          />
          <span style={valueStyle}>{mage.maxHp}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>攻击力</span>
          <input
            type="range"
            min={20}
            max={60}
            value={mage.attack}
            disabled={isFighting}
            style={sliderStyle('#FF4080')}
            onChange={(e) => setMageStats({ attack: Number(e.target.value) })}
            onMouseEnter={(e) => handleSliderMouseEnter(e, '#FF4080')}
            onMouseLeave={handleSliderMouseLeave}
          />
          <span style={valueStyle}>{mage.attack}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>技能</span>
          <select
            value={mage.skill}
            disabled={isFighting}
            style={selectStyle('#FF4080')}
            onChange={(e) =>
              setMageStats({ skill: e.target.value as MageSkill })
            }
            onMouseEnter={(e) => handleSelectMouseEnter(e, '#FF4080')}
            onMouseLeave={handleSelectMouseLeave}
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
