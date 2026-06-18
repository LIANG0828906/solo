import { motion, AnimatePresence } from 'framer-motion';
import { GameState, Drone, DroneStatus, ORE_NAMES, ORE_COLORS } from './store';

interface DronePanelProps {
  state: GameState;
  onRecallDrone: (droneId: string) => void;
}

const STATUS_LABELS: Record<DroneStatus, string> = {
  idle: '空闲',
  flying: '飞往目标',
  mining: '采集中',
  returning: '返航中',
  crashed: '已坠毁',
};

const STATUS_COLORS: Record<DroneStatus, string> = {
  idle: '#9E9E9E',
  flying: '#FFD600',
  mining: '#2979FF',
  returning: '#FF1744',
  crashed: '#616161',
};

function fuelGradient(percent: number): string {
  const p = Math.max(0, Math.min(100, percent));
  if (p >= 60) return `linear-gradient(90deg, #00C853, #69F0AE)`;
  if (p >= 30) return `linear-gradient(90deg, #FFD600, #FFEA00)`;
  return `linear-gradient(90deg, #FF1744, #FF5252)`;
}

function DroneCard({
  drone,
  onRecall,
}: {
  drone: Drone;
  onRecall: () => void;
}) {
  const fuelPercent = (drone.fuel / drone.maxFuel) * 100;
  const isCrashed = drone.status === 'crashed';

  return (
    <motion.div
      key={drone.id + '-' + drone.status}
      initial={isCrashed ? { opacity: 1, scale: 1 } : { opacity: 0, y: 10, scale: 0.95 }}
      animate={
        isCrashed
          ? { opacity: 0, scale: 0.7, height: 0, marginBottom: 0 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      exit={{ opacity: 0, scale: 0.8, height: 0 }}
      transition={{ duration: isCrashed ? 0.5 : 0.3 }}
      style={{
        width: '240px',
        height: '100px',
        background: '#0B0B1A',
        borderRadius: '8px',
        padding: '10px',
        marginBottom: '12px',
        boxSizing: 'border-box',
        border: '1px solid rgba(0, 229, 255, 0.15)',
        opacity: isCrashed ? 0.4 : 1,
        filter: isCrashed ? 'grayscale(100%)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontWeight: 'bold',
                fontSize: '13px',
                color: '#FFFFFF',
                fontFamily: '"Courier New", monospace',
              }}
            >
              无人机 #{String(drone.number).padStart(2, '0')}
            </span>
            {drone.cargoType && drone.cargoAmount > 0 && (
              <div
                title={`${ORE_NAMES[drone.cargoType]}: ${drone.cargoAmount}`}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: ORE_COLORS[drone.cargoType],
                  boxShadow: `0 0 6px ${ORE_COLORS[drone.cargoType]}`,
                  flexShrink: 0,
                }}
              />
            )}
          </div>

          <div
            style={{
              fontSize: '10px',
              color: '#8888AA',
              fontFamily: '"Courier New", monospace',
              marginBottom: '6px',
              letterSpacing: '0.5px',
            }}
          >
            X:{Math.round(drone.x).toString().padStart(4, ' ')} Y:
            {Math.round(drone.y).toString().padStart(4, ' ')}
          </div>

          <div style={{ marginBottom: '6px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '3px',
              }}
            >
              <span style={{ fontSize: '9px', color: '#8888AA', letterSpacing: '0.5px' }}>
                燃料
              </span>
              <span
                style={{
                  fontSize: '9px',
                  color: fuelPercent < 30 ? '#FF5252' : fuelPercent < 60 ? '#FFD600' : '#69F0AE',
                  fontFamily: '"Courier New", monospace',
                  fontWeight: 'bold',
                }}
              >
                {Math.round(fuelPercent)}%
              </span>
            </div>
            <div
              style={{
                height: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={false}
                animate={{ width: `${fuelPercent}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: fuelGradient(fuelPercent),
                  borderRadius: '3px',
                  boxShadow:
                    fuelPercent < 30
                      ? '0 0 8px rgba(255, 23, 68, 0.5)'
                      : fuelPercent < 60
                      ? '0 0 6px rgba(255, 214, 0, 0.4)'
                      : '0 0 6px rgba(0, 200, 83, 0.4)',
                }}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: STATUS_COLORS[drone.status],
              fontFamily: '"Segoe UI", sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: STATUS_COLORS[drone.status],
                boxShadow: `0 0 4px ${STATUS_COLORS[drone.status]}`,
              }}
            />
            {STATUS_LABELS[drone.status]}
            {drone.status === 'mining' && drone.cargoType && (
              <span style={{ fontSize: '10px', color: '#AAAAAA' }}>
                · {ORE_NAMES[drone.cargoType]}
              </span>
            )}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 23, 68, 0.25)' }}
          transition={{ duration: 0.2 }}
          onClick={onRecall}
          disabled={drone.status === 'idle' || drone.status === 'crashed'}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '5px',
            border: 'none',
            background:
              drone.status === 'idle' || drone.status === 'crashed'
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(255, 255, 255, 0.06)',
            color:
              drone.status === 'idle' || drone.status === 'crashed'
                ? '#555555'
                : '#FFFFFF',
            cursor:
              drone.status === 'idle' || drone.status === 'crashed'
                ? 'not-allowed'
                : 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginLeft: '8px',
            padding: 0,
          }}
          title="强制返航"
        >
          ×
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function DronePanel({ state, onRecallDrone }: DronePanelProps) {
  const activeDrones = state.drones;

  return (
    <div
      style={{
        width: '280px',
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '12px',
        padding: '16px',
        boxSizing: 'border-box',
        border: '1px solid rgba(0, 229, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(0, 229, 255, 0.12)',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '700',
            color: '#00E5FF',
            letterSpacing: '1px',
            fontFamily: '"Segoe UI", sans-serif',
            textTransform: 'uppercase',
          }}
        >
          无人机舰队
        </h3>
        <span
          style={{
            fontSize: '11px',
            color: '#8888AA',
            fontFamily: '"Courier New", monospace',
            background: 'rgba(0, 229, 255, 0.08)',
            padding: '2px 8px',
            borderRadius: '4px',
          }}
        >
          {state.drones.filter((d) => d.status !== 'crashed').length}/
          {state.drones.length} 在线
        </span>
      </div>

      <AnimatePresence>
        {activeDrones.map((drone) => (
          <DroneCard
            key={drone.id}
            drone={drone}
            onRecall={() => onRecallDrone(drone.id)}
          />
        ))}
      </AnimatePresence>

      {state.drones.every((d) => d.status === 'crashed') && (
        <div
          style={{
            padding: '12px',
            textAlign: 'center',
            color: '#FF5252',
            fontSize: '12px',
            border: '1px dashed rgba(255, 23, 68, 0.3)',
            borderRadius: '8px',
            background: 'rgba(255, 23, 68, 0.05)',
          }}
        >
          所有无人机已坠毁
        </div>
      )}
    </div>
  );
}
