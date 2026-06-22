import React from 'react';
import { motion } from 'framer-motion';
import type { Plant, AdviceItem } from '@types/index';
import { useSymbiosisAdvice } from '@hooks/useSymbiosisAdvice';
import { PLANT_SPECIES, getSpeciesById } from '@data/plants';
import { FiLightbulb, FiArrowRight } from 'react-icons/fi';

interface PlanningAdviceProps {
  plants: Plant[];
}

function getSpeciesColorByName(name: string): string {
  const sp = PLANT_SPECIES.find((s) => s.name === name);
  return sp ? sp.color : '#888888';
}

const PlanningAdvice: React.FC<PlanningAdviceProps> = ({ plants }) => {
  const advices = useSymbiosisAdvice(plants);

  return (
    <div
      style={{
        padding: 16,
        backgroundColor: 'var(--color-card)',
        borderTop: '1px solid var(--color-card-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            backgroundColor: '#FFF3E0',
            color: '#F57C00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FiLightbulb size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>种植规划建议</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            基于作物共生关系为您推荐
          </div>
        </div>
      </div>

      {advices.length === 0 ? (
        <div
          style={{
            padding: 18,
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 13,
            backgroundColor: '#FBF8F0',
            borderRadius: 10,
            border: '1px dashed var(--color-card-border)',
          }}
        >
          {plants.length === 0
            ? '创建植物后，这里会为您推荐最佳搭配方案 🌱'
            : '当前花园品种组合已很丰富，继续尝试更多组合吧！'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 10,
            maxHeight: 260,
            overflowY: 'auto',
            padding: 2,
          }}
        >
          {advices.slice(0, 12).map((advice, idx) => {
            const colorA = getSpeciesColorByName(advice.speciesA);
            const colorB = getSpeciesColorByName(advice.speciesB);
            return (
              <motion.div
                key={advice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                style={{
                  backgroundColor: 'var(--color-advice-bg)',
                  border: '1px solid var(--color-advice-border)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  display: 'flex',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 5,
                    background: `linear-gradient(180deg, ${colorA}, ${colorB})`,
                    flexShrink: 0,
                  }}
                />
                <div style={{ padding: '10px 12px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      className="chip"
                      style={{
                        backgroundColor: colorA + '20',
                        color: colorA,
                        border: `1px solid ${colorA}40`,
                      }}
                    >
                      {advice.speciesA}
                    </span>
                    <FiArrowRight size={13} color="var(--color-primary)" />
                    <span
                      className="chip"
                      style={{
                        backgroundColor: colorB + '20',
                        color: colorB,
                        border: `1px solid ${colorB}40`,
                      }}
                    >
                      {advice.speciesB}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--color-primary)' }}>
                    推荐在{advice.speciesA}旁种植{advice.speciesB}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {advice.reason}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanningAdvice;
