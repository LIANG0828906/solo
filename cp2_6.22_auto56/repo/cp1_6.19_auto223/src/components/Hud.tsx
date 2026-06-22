import { motion } from 'framer-motion';
import { useGameStore } from '../store';
import {
  RUNE_TEMPLATES,
  RuneType,
  MAX_ENERGY,
  RUNE_ENERGY_COST,
  DRAW_AREA_X,
  DRAW_AREA_Y,
  DRAW_AREA_WIDTH,
  CANVAS_WIDTH,
} from '../types';

const RuneIcon = ({ type, color, selected }: { type: RuneType; color: string; selected: boolean }) => {
  const size = 40;
  const padding = 4;
  const center = size / 2;
  const radius = size / 2 - padding;

  const getPath = () => {
    switch (type) {
      case RuneType.CIRCLE:
        return (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
        );
      case RuneType.TRIANGLE: {
        const points = [
          { x: center, y: padding },
          { x: size - padding, y: size - padding },
          { x: padding, y: size - padding },
        ];
        return (
          <polygon
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
        );
      }
      case RuneType.LIGHTNING: {
        const points = [
          { x: center + 2, y: padding },
          { x: center - 6, y: center - 4 },
          { x: center + 2, y: center - 4 },
          { x: center - 2, y: size - padding },
          { x: center + 6, y: center + 4 },
          { x: center - 2, y: center + 4 },
        ];
        return (
          <polyline
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      }
      case RuneType.SPIRAL: {
        const path: string[] = [];
        const turns = 2;
        const steps = 50;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const angle = t * Math.PI * 2 * turns;
          const r = t * radius;
          const x = center + Math.cos(angle) * r;
          const y = center + Math.sin(angle) * r;
          path.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
        }
        return (
          <path
            d={path.join(' ')}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        );
      }
      case RuneType.STAR: {
        const points: string[] = [];
        const spikes = 5;
        const outerR = radius;
        const innerR = radius * 0.4;
        for (let i = 0; i < spikes * 2; i++) {
          const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 === 0 ? outerR : innerR;
          const x = center + Math.cos(angle) * r;
          const y = center + Math.sin(angle) * r;
          points.push(`${x},${y}`);
        }
        return (
          <polygon
            points={points.join(' ')}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        );
      }
    }
  };

  return (
    <motion.svg
      width={size}
      height={size}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        border: selected ? `2px solid #FFD700` : '2px solid transparent',
        borderRadius: '4px',
        background: 'rgba(0, 0, 0, 0.3)',
      }}
    >
      {getPath()}
    </motion.svg>
  );
};

const Hud = () => {
  const { energy, score, combo, selectedRune } = useGameStore();

  const energyPercent = (energy / MAX_ENERGY) * 100;
  const canCast = energy >= RUNE_ENERGY_COST;

  const gradientId = 'energy-gradient';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: CANVAS_WIDTH,
        height: '100%',
        pointerEvents: 'none',
        fontFamily: "'Press Start 2P', cursive",
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            color: '#AAAAAA',
            marginBottom: '6px',
            textTransform: 'uppercase',
          }}
        >
          能量
        </div>
        <div
          style={{
            width: 180,
            height: 20,
            background: '#333333',
            borderRadius: '2px',
            overflow: 'hidden',
            border: '2px solid #555555',
          }}
        >
          <svg width="100%" height="100%" style={{ display: 'block' }}>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4A90D9" />
                <stop offset="100%" stopColor="#8E44AD" />
              </linearGradient>
            </defs>
            <motion.rect
              width={`${energyPercent}%`}
              height="100%"
              fill={`url(#${gradientId})`}
              initial={false}
              animate={{ width: `${energyPercent}%` }}
              transition={{ duration: 0.2 }}
            />
          </svg>
        </div>
        <div
          style={{
            fontSize: '10px',
            color: canCast ? '#4A90D9' : '#E74C3C',
            marginTop: '4px',
          }}
        >
          {energy} / {MAX_ENERGY}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          textAlign: 'right',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            color: '#FFFFFF',
            textShadow: '2px 2px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000',
            lineHeight: 1,
          }}
        >
          {score}
        </div>
        {combo >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: '28px',
              color: '#FFD700',
              textShadow: '2px 2px 0px #000000',
              marginTop: '8px',
            }}
          >
            {combo}x 连击!
          </motion.div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '20px',
          pointerEvents: 'auto',
        }}
      >
        {RUNE_TEMPLATES.map((rune) => (
          <motion.div
            key={rune.type}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RuneIcon
              type={rune.type}
              color={rune.color}
              selected={selectedRune === rune.type}
            />
            <span
              style={{
                fontSize: '8px',
                color: '#AAAAAA',
                textAlign: 'center',
              }}
            >
              {rune.name}
            </span>
          </motion.div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          top: DRAW_AREA_Y - 24,
          left: DRAW_AREA_X,
          width: DRAW_AREA_WIDTH,
          textAlign: 'center',
          fontSize: '10px',
          color: canCast ? '#888888' : '#E74C3C',
        }}
      >
        {canCast ? '在此区域绘制符文' : '能量不足'}
      </div>
    </div>
  );
};

export default Hud;
