import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import type { Fleet, MissionType, MissionLog } from '../types';

const MISSION_CONFIG: Record<MissionType, { label: string; color: string; icon: string }> = {
  patrol: { label: '巡逻', color: '#2ECC71', icon: '🛡️' },
  expedition: { label: '远征', color: '#E67E22', icon: '⚔️' },
  defense: { label: '防御', color: '#3498DB', icon: '🏰' },
};

interface FleetCardProps {
  fleet: Fleet;
  onDelete: (id: string) => void;
  onExecuteMission: (fleetId: string, type: MissionType) => void;
  logs: MissionLog[];
}

function FleetCard({ fleet, onDelete, onExecuteMission, logs }: FleetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [executingMission, setExecutingMission] = useState<MissionType | null>(null);

  const handleMissionClick = (type: MissionType) => {
    if (executingMission) return;
    setExecutingMission(type);
    setTimeout(() => {
      onExecuteMission(fleet.id, type);
      setExecutingMission(null);
    }, 2000);
  };

  const fleetLogs = logs.filter((log) => log.fleetName === fleet.name).slice(0, 5);

  return (
    <motion.div
      layout
      style={{
        backgroundColor: '#2A2E35',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: '80px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: '#E6EDF3',
              fontSize: '15px',
              fontWeight: 600,
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fleet.name}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: '#A0B0C0', fontSize: '12px' }}>
              战舰: {fleet.ships.length}艘
            </span>
            <span
              style={{
                color: '#C9A96E',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              战力: {fleet.powerRating}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onDelete(fleet.id)}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: 'rgba(231, 76, 60, 0.2)',
              color: '#E74C3C',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              width: '0',
              height: '0',
              borderLeft: '10px solid #8E44AD',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              background: 'none',
              padding: 0,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 16px 12px',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  color: '#A0B0C0',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                选择任务
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {(Object.keys(MISSION_CONFIG) as MissionType[]).map((type) => {
                  const config = MISSION_CONFIG[type];
                  const isExecuting = executingMission === type;

                  return (
                    <motion.button
                      key={type}
                      whileHover={!isExecuting ? { scale: 1.05 } : {}}
                      whileTap={!isExecuting ? { scale: 0.95 } : {}}
                      onClick={() => handleMissionClick(type)}
                      disabled={isExecuting}
                      style={{
                        width: '80px',
                        height: '36px',
                        borderRadius: '6px',
                        backgroundColor: config.color,
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        opacity: isExecuting ? 0.7 : 1,
                        cursor: isExecuting ? 'wait' : 'pointer',
                      }}
                    >
                      {isExecuting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                          style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff',
                            borderRadius: '50%',
                          }}
                        />
                      ) : (
                        <>
                          <span style={{ fontSize: '12px' }}>{config.icon}</span>
                          {config.label}
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div
                style={{
                  backgroundColor: '#1A1C20',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  minHeight: '80px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6B7B8D',
                    marginBottom: '6px',
                    fontWeight: 500,
                  }}
                >
                  战斗日志
                </div>
                <AnimatePresence initial={false}>
                  {fleetLogs.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        fontSize: '12px',
                        color: '#4A4A4A',
                        textAlign: 'center',
                        padding: '16px 0',
                      }}
                    >
                      暂无任务记录
                    </motion.div>
                  ) : (
                    fleetLogs.map((log) => (
                      <LogEntry key={log.id} log={log} />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LogEntry({ log }: { log: MissionLog }) {
  const config = MISSION_CONFIG[log.missionType];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      layout
      style={{
        fontSize: '12px',
        color: '#A0B0C0',
        padding: '4px 0',
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span style={{ fontSize: '20px', color: '#888', width: '20px' }}>
        {log.missionType === 'expedition' ? '⚔' : '🛡'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: config.color, fontWeight: 500 }}>
          {config.label}任务
        </div>
        <div
          style={{
            color: log.success ? '#2ECC71' : '#E74C3C',
            fontSize: '11px',
          }}
        >
          {log.success ? '成功 ✓' : '失败 ✗'}
        </div>
      </div>
    </motion.div>
  );
}

function FleetMission() {
  const { fleets, deleteFleet, executeMission, missionLogs } = useGameStore();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1F2428',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #2A2E35',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#E6EDF3',
          }}
        >
          舰队列表
        </span>
        <span
          style={{
            fontSize: '12px',
            color: '#6B7B8D',
          }}
        >
          {fleets.length}/6
        </span>
      </div>

      <div
        style={{
          flex: 1,
          padding: '12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <AnimatePresence initial={false}>
          {fleets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#4A4A4A',
                fontSize: '13px',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚀</div>
              暂无舰队
              <div style={{ fontSize: '11px', marginTop: '6px', color: '#3A3A3A' }}>
                组装战舰后保存到舰队
              </div>
            </motion.div>
          ) : (
            fleets.map((fleet) => (
              <FleetCard
                key={fleet.id}
                fleet={fleet}
                onDelete={deleteFleet}
                onExecuteMission={executeMission}
                logs={missionLogs}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default FleetMission;
