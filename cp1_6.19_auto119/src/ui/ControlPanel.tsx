import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { eventBus, type FormationType } from '../eventBus';

interface ControlPanelProps {
  currentFormation: FormationType;
  showRange: boolean;
  selectedTargetId: string | null;
  enemyCount: number;
}

const FORMATIONS: { value: FormationType; label: string }[] = [
  { value: 'wedge', label: '楔形阵型' },
  { value: 'cylinder', label: '圆筒阵型' },
  { value: 'diamond', label: '菱形阵型' },
  { value: 'line', label: '横列阵型' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentFormation,
  showRange,
  selectedTargetId,
  enemyCount,
}) => {
  const [activeTab, setActiveTab] = useState<'formation' | 'combat'>('formation');

  const handleFormationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    eventBus.emit('formation:change', e.target.value as FormationType);
  };

  const handleRangeToggle = () => {
    eventBus.emit('range:toggle', !showRange);
  };

  const handleFocusFire = () => {
    if (selectedTargetId) {
      eventBus.emit('fire:focus', selectedTargetId);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(11, 12, 16, 0.85)',
        border: '1px solid #45A29E',
        borderRadius: '8px',
        padding: '16px',
        color: '#C5C6C7',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', color: '#66FCF1', fontSize: '16px', fontWeight: 600 }}>
        控制台
      </h3>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['formation', 'combat'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid',
              borderColor: activeTab === tab ? '#45A29E' : '#1F2833',
              borderRadius: '4px',
              background: activeTab === tab ? 'rgba(69, 162, 158, 0.2)' : 'transparent',
              color: activeTab === tab ? '#66FCF1' : '#C5C6C7',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.borderColor = '#45A29E';
                e.currentTarget.style.color = '#66FCF1';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.borderColor = '#1F2833';
                e.currentTarget.style.color = '#C5C6C7';
              }
            }}
          >
            {tab === 'formation' ? '阵型' : '战斗'}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'formation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  color: '#C5C6C7',
                }}
              >
                阵型选择
              </label>
              <select
                value={currentFormation}
                onChange={handleFormationChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1F2833',
                  border: '1px solid #45A29E',
                  borderRadius: '4px',
                  color: '#C5C6C7',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {FORMATIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <input
                  type="checkbox"
                  checked={showRange}
                  onChange={handleRangeToggle}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#45A29E',
                    cursor: 'pointer',
                  }}
                />
                显示武器射程
              </label>
            </div>

            <div
              style={{
                padding: '12px',
                background: 'rgba(69, 162, 158, 0.1)',
                borderRadius: '4px',
                fontSize: '12px',
                lineHeight: '1.6',
              }}
            >
              <div style={{ color: '#66FCF1', marginBottom: '6px' }}>操作提示</div>
              <div style={{ color: '#C5C6C7' }}>• 点击舰船可选中查看</div>
              <div style={{ color: '#C5C6C7' }}>• 点击敌方舰船设为目标</div>
              <div style={{ color: '#C5C6C7' }}>• 目标进入多射程时呈橙色</div>
            </div>
          </div>
        )}

        {activeTab === 'combat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  color: '#C5C6C7',
                }}
              >
                当前目标
              </label>
              <div
                style={{
                  padding: '10px 12px',
                  background: '#1F2833',
                  border: '1px solid #45A29E',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: selectedTargetId ? '#66FCF1' : '#666',
                }}
              >
                {selectedTargetId ? selectedTargetId : '未选择目标'}
              </div>
            </div>

            <motion.button
              onClick={handleFocusFire}
              disabled={!selectedTargetId}
              whileHover={selectedTargetId ? { scale: 1.02 } : {}}
              whileTap={selectedTargetId ? { scale: 0.98 } : {}}
              transition={{ duration: 0.1 }}
              style={{
                width: '100%',
                padding: '12px',
                background: selectedTargetId ? '#45A29E' : '#333',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: selectedTargetId ? 'pointer' : 'not-allowed',
                letterSpacing: '1px',
              }}
            >
              ⚡ 集火攻击
            </motion.button>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
                padding: '8px',
                background: 'rgba(231, 76, 60, 0.1)',
                borderRadius: '4px',
              }}
            >
              {Array.from({ length: enemyCount }, (_, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1',
                    background: 'rgba(231, 76, 60, 0.3)',
                    border: '1px solid rgba(231, 76, 60, 0.5)',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#E74C3C',
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
