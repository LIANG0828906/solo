import React, { useMemo, useRef, useEffect } from 'react';
import { useCharacterStore } from '../characterModule/CharacterStore';
import { calculateCombatStats } from '../skillModule/SkillEngine';
import { Attributes } from '../shared/types';
import { eventBus } from '../shared/eventBus';

const CombatPreview: React.FC = () => {
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const race = useCharacterStore((s) => s.race);
  const attributes = useCharacterStore((s) => s.attributes);
  const activatedSkills = useCharacterStore((s) => s.activatedSkills);
  const level = useCharacterStore((s) => s.level);
  const skillPoints = useCharacterStore((s) => s.skillPoints);
  const getTotalAttributes = useCharacterStore((s) => s.getTotalAttributes);

  const [totalAttrs, setTotalAttrs] = React.useState<Attributes>(() => getTotalAttributes());

  useEffect(() => {
    const updateAttrs = () => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      const throttledUpdate = () => {
        setTotalAttrs(getTotalAttributes());
        lastUpdateRef.current = Date.now();
      };

      if (timeSinceLastUpdate >= 50) {
        throttledUpdate();
      } else {
        if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = setTimeout(throttledUpdate, 50 - timeSinceLastUpdate);
      }
    };

    updateAttrs();

    const unsub1 = eventBus.on('character:raceChanged', updateAttrs);
    const unsub2 = eventBus.on('character:attributesChanged', updateAttrs);

    return () => {
      unsub1();
      unsub2();
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
    };
  }, [race, attributes, getTotalAttributes]);

  const combatStats = useMemo(
    () => calculateCombatStats(totalAttrs, activatedSkills),
    [totalAttrs, activatedSkills]
  );

  const statCards = [
    { label: 'DPS', value: combatStats.dps.toFixed(1), unit: '/s' },
    { label: '命中率', value: combatStats.hitRate.toFixed(1), unit: '%' },
    { label: '暴击率', value: combatStats.critRate.toFixed(1), unit: '%' },
    { label: '等级', value: level.toString(), unit: 'Lv' },
  ];

  return (
    <div style={styles.panel}>
      <h3 style={styles.sectionTitle}>战斗参数</h3>

      <div style={styles.cardGrid}>
        {statCards.map((card) => (
          <div key={card.label} className="stat-card" style={styles.statCard}>
            <div style={styles.statLabel}>{card.label}</div>
            <div style={styles.statRow}>
              <span style={styles.statValue}>{card.value}</span>
              <span style={styles.statUnit}>{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ ...styles.sectionTitle, marginTop: '20px' }}>技能序列</h3>
      <div style={styles.skillList}>
        {combatStats.skillSequence.length === 0 && (
          <div style={styles.emptyText}>尚未激活任何技能</div>
        )}
        {combatStats.skillSequence.map((skill) => (
          <div key={skill.id} className="skill-item" style={styles.skillItem}>
            <span style={styles.skillIcon}>{skill.icon}</span>
            <span style={styles.skillName}>{skill.name}</span>
            <span style={styles.skillCooldown}>{skill.cooldown}s</span>
          </div>
        ))}
      </div>

      <div style={styles.infoSection}>
        <h3 style={styles.sectionTitle}>属性总览</h3>
        <div style={styles.attrSummary}>
          <div className="attr-line" style={styles.attrLine}>
            <span style={styles.attrLabel}>力量</span>
            <span style={styles.attrVal}>{totalAttrs.strength}</span>
          </div>
          <div className="attr-line" style={styles.attrLine}>
            <span style={styles.attrLabel}>敏捷</span>
            <span style={styles.attrVal}>{totalAttrs.agility}</span>
          </div>
          <div className="attr-line" style={styles.attrLine}>
            <span style={styles.attrLabel}>智力</span>
            <span style={styles.attrVal}>{totalAttrs.intelligence}</span>
          </div>
          <div className="attr-line" style={styles.attrLine}>
            <span style={styles.attrLabel}>体质</span>
            <span style={styles.attrVal}>{totalAttrs.constitution}</span>
          </div>
          <div className="attr-line" style={styles.attrLine}>
            <span style={styles.attrLabel}>精神</span>
            <span style={styles.attrVal}>{totalAttrs.spirit}</span>
          </div>
        </div>
        <div style={styles.skillPtInfo}>
          可用技能点: <span style={styles.skillPtVal}>{skillPoints}</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: '16px',
    overflowY: 'auto',
    height: '100%',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  statCard: {
    width: '140px',
    height: '80px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
  },
  statLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 500,
  },
  statRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#facc15',
    lineHeight: 1,
  },
  statUnit: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  skillList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  emptyText: {
    fontSize: '13px',
    color: '#64748b',
    textAlign: 'center',
    padding: '16px 0',
  },
  skillItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#0f172a',
    borderRadius: '6px',
    padding: '8px 12px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
  },
  skillIcon: {
    fontSize: '16px',
  },
  skillName: {
    flex: 1,
    fontSize: '13px',
    color: '#f8fafc',
  },
  skillCooldown: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: 500,
  },
  infoSection: {
    marginTop: '20px',
  },
  attrSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  attrLine: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#0f172a',
  },
  attrLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  attrVal: {
    fontSize: '13px',
    color: '#f8fafc',
    fontWeight: 600,
  },
  skillPtInfo: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#94a3b8',
    textAlign: 'center',
  },
  skillPtVal: {
    color: '#3b82f6',
    fontWeight: 700,
  },
};

export default CombatPreview;
