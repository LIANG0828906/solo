import React from 'react';
import { useCharacterStore, BASE_ATTRIBUTE, TOTAL_FREE_POINTS, MAX_ATTRIBUTE, EXP_PER_LEVEL } from '../characterModule/CharacterStore';
import { RACE_DATA, CLASS_DATA } from '../characterModule/data';
import { Race, CharacterClass, AttributeKey, Attributes } from '../shared/types';

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  strength: '力量',
  agility: '敏捷',
  intelligence: '智力',
  constitution: '体质',
  spirit: '精神',
};

const ATTRIBUTE_ICONS: Record<AttributeKey, string> = {
  strength: '💪',
  agility: '🏃',
  intelligence: '🧠',
  constitution: '❤️',
  spirit: '✨',
};

const CharacterPanel: React.FC = () => {
  const race = useCharacterStore((s) => s.race);
  const characterClass = useCharacterStore((s) => s.characterClass);
  const attributes = useCharacterStore((s) => s.attributes);
  const allocatedPoints = useCharacterStore((s) => s.allocatedPoints);
  const level = useCharacterStore((s) => s.level);
  const experience = useCharacterStore((s) => s.experience);
  const skillPoints = useCharacterStore((s) => s.skillPoints);

  const setRace = useCharacterStore((s) => s.setRace);
  const setClass = useCharacterStore((s) => s.setClass);
  const allocatePoints = useCharacterStore((s) => s.allocatePoints);
  const addExperience = useCharacterStore((s) => s.addExperience);
  const reset = useCharacterStore((s) => s.reset);
  const getTotalAttributes = useCharacterStore((s) => s.getTotalAttributes);
  const getFreePoints = useCharacterStore((s) => s.getFreePoints);

  const freePoints = getFreePoints();
  const totalAttrs = getTotalAttributes();
  const raceData = RACE_DATA.find((r) => r.id === race);
  const bonuses = raceData ? raceData.bonuses : {};
  const expNeeded = level * EXP_PER_LEVEL;
  const expPercent = (experience / expNeeded) * 100;

  const totalAttrSum = Object.values(totalAttrs).reduce((a, b) => a + b, 0);

  return (
    <div style={styles.panel}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>种族选择</h3>
        <div style={styles.grid2}>
          {RACE_DATA.map((r) => (
            <button
              key={r.id}
              onClick={() => setRace(r.id as Race)}
              style={{
                ...styles.selectCard,
                ...(race === r.id ? styles.selectedCard : {}),
              }}
            >
              <div style={styles.cardName}>{r.name}</div>
              <div style={styles.cardDesc}>{r.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>职业选择</h3>
        <div style={styles.grid3}>
          {CLASS_DATA.map((c) => (
            <button
              key={c.id}
              onClick={() => setClass(c.id as CharacterClass)}
              style={{
                ...styles.selectCard,
                ...(characterClass === c.id ? styles.selectedCard : {}),
              }}
            >
              <div style={styles.cardName}>{c.name}</div>
              <div style={styles.cardDescSmall}>{c.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          属性分配 <span style={styles.freePoints}>剩余: {freePoints}点</span>
        </h3>
        {(Object.keys(attributes) as AttributeKey[]).map((attr) => {
          const baseVal = attributes[attr];
          const bonus = (bonuses as Partial<Attributes>)[attr] || 0;
          const totalVal = baseVal + bonus;
          const percent = totalAttrSum > 0 ? (totalVal / totalAttrSum) * 100 : 0;

          return (
            <div key={attr} style={styles.attrRow}>
              <div style={styles.attrLabel}>
                <span>{ATTRIBUTE_ICONS[attr]}</span>
                <span>{ATTRIBUTE_LABELS[attr]}</span>
              </div>
              <button
                style={styles.adjBtn}
                onClick={() => allocatePoints(attr, -1)}
                disabled={baseVal <= BASE_ATTRIBUTE}
              >
                -
              </button>
              <div style={styles.attrValueContainer}>
                <span style={styles.attrValue}>{totalVal}</span>
                {bonus !== 0 && (
                  <span style={{ ...styles.bonusText, color: bonus > 0 ? '#22c55e' : '#ef4444' }}>
                    {bonus > 0 ? `+${bonus}` : `${bonus}`}
                  </span>
                )}
              </div>
              <button
                style={styles.adjBtn}
                onClick={() => allocatePoints(attr, 1)}
                disabled={baseVal >= MAX_ATTRIBUTE || freePoints <= 0}
              >
                +
              </button>
              <div style={styles.progressContainer}>
                <div style={{ ...styles.progressFill, width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          等级 <span style={styles.levelText}>Lv.{level}</span>
          <span style={styles.skillPts}>技能点: {skillPoints}</span>
        </h3>
        <div
          style={styles.expBarContainer}
          onClick={() => addExperience(25)}
          title="点击获取经验"
        >
          <div style={{ ...styles.expBarFill, width: `${expPercent}%` }} />
          <span style={styles.expText}>
            {experience} / {expNeeded}
          </span>
        </div>
      </div>

      <button style={styles.resetBtn} onClick={reset}>
        重置角色
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: '16px',
    overflowY: 'auto',
    height: '100%',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  selectCard: {
    backgroundColor: '#0f172a',
    border: '2px solid #334155',
    borderRadius: '8px',
    padding: '10px 8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    color: '#f8fafc',
  },
  selectedCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a5f',
  },
  cardName: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  cardDesc: {
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.3',
  },
  cardDescSmall: {
    fontSize: '10px',
    color: '#94a3b8',
    lineHeight: '1.2',
  },
  attrRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  attrLabel: {
    width: '56px',
    fontSize: '12px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  adjBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease, transform 0.2s ease',
    flexShrink: 0,
  },
  attrValueContainer: {
    width: '40px',
    textAlign: 'center',
    position: 'relative',
  },
  attrValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#f8fafc',
  },
  bonusText: {
    fontSize: '10px',
    fontWeight: 600,
  },
  progressContainer: {
    flex: 1,
    height: '8px',
    backgroundColor: '#475569',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: '4px',
    transition: 'width 0.2s ease',
  },
  freePoints: {
    fontSize: '12px',
    color: '#22c55e',
    fontWeight: 400,
  },
  levelText: {
    fontSize: '16px',
    color: '#facc15',
    fontWeight: 700,
  },
  skillPts: {
    fontSize: '12px',
    color: '#3b82f6',
    fontWeight: 400,
    marginLeft: 'auto',
  },
  expBarContainer: {
    height: '24px',
    backgroundColor: '#475569',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
    transition: 'transform 0.2s ease',
  },
  expBarFill: {
    height: '100%',
    backgroundColor: '#facc15',
    borderRadius: '12px',
    transition: 'width 0.2s ease',
  },
  expText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '11px',
    color: '#f8fafc',
    fontWeight: 600,
  },
  resetBtn: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ef4444',
    backgroundColor: 'transparent',
    color: '#ef4444',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default CharacterPanel;
