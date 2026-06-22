import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Plant, GrowthStage, LogEntry } from '@types/index';
import { getSpeciesById } from '@data/plants';
import { GROWTH_STAGE_NAMES } from '@types/index';
import GrowthProgressBar from './GrowthProgressBar';
import TimelineLog from './TimelineLog';
import { FiX, FiTrash2, FiSun, FiClock, FiTag } from 'react-icons/fi';

interface PlantDetailPanelProps {
  plant: Plant | null;
  visible: boolean;
  onClose: () => void;
  onAddLog: (plantId: string, log: Omit<LogEntry, 'id'>) => void;
  onUpdateProgress: (plantId: string, stage: GrowthStage) => void;
  onDelete: (plantId: string) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const PlantDetailPanel: React.FC<PlantDetailPanelProps> = ({
  plant,
  visible,
  onClose,
  onAddLog,
  onUpdateProgress,
  onDelete,
}) => {
  const species = plant ? getSpeciesById(plant.speciesId) : null;

  return (
    <AnimatePresence>
      {visible && plant && species && (
        <>
          <div className="overlay" onClick={onClose} style={{ zIndex: 55 }} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(460px, 92vw)',
              backgroundColor: 'var(--color-card)',
              boxShadow: 'var(--shadow-panel-right)',
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              willChange: 'transform',
              borderRadius: 'var(--radius-panel-right)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: 20,
                background: `linear-gradient(135deg, ${species.color}20, ${species.color}08)`,
                borderBottom: '1px solid var(--color-card-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 18,
                      backgroundColor: species.color + '20',
                      border: `2px solid ${species.color}60`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 36,
                    }}
                  >
                    {species.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                      {plant.customName || species.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        className="chip"
                        style={{ backgroundColor: species.color, color: 'white' }}
                      >
                        {species.name}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--color-text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <FiClock size={11} />
                        {formatDate(plant.plantDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      if (confirm(`确定要移除「${plant.customName || species.name}」吗？`)) {
                        onDelete(plant.id);
                        onClose();
                      }
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-danger)',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(229,57,53,0.1)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
                    aria-label="删除"
                  >
                    <FiTrash2 size={16} />
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.06)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
                    aria-label="关闭"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.75)',
                    borderRadius: 10,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <FiSun size={11} />
                    光照需求
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{species.lightNeed}</div>
                </div>
                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.75)',
                    borderRadius: 10,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>生长周期</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{species.growthDays} 天</div>
                </div>
                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.75)',
                    borderRadius: 10,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <FiTag size={11} />
                    当前阶段
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                    {GROWTH_STAGE_NAMES[plant.stage]}
                  </div>
                </div>
              </div>

              {plant.notes && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255,255,255,0.65)',
                    borderRadius: 10,
                    fontSize: 13,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  📝 {plant.notes}
                </div>
              )}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  生长进度
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                    点击下方阶段可快速更新
                  </span>
                </div>
                <GrowthProgressBar
                  stage={plant.stage}
                  onChange={(s) => onUpdateProgress(plant.id, s)}
                />
              </div>

              <div>
                <TimelineLog
                  logs={plant.logs}
                  onAddLog={(log) => onAddLog(plant.id, log)}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PlantDetailPanel;
