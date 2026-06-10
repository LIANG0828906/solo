import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { calculateCompassJitter } from '../utils/navigation';
import type { CompassJitter } from '../utils/navigation';

interface CompassProps {
  headingError: number;
  shipRoll: number;
  windSpeed: number;
  isStormMode: boolean;
  size?: number;
  onJitterUpdate?: (jitter: CompassJitter) => void;
}

const DIAMETER = 200;
const RADIUS = DIAMETER / 2;

export function Compass({
  headingError,
  shipRoll,
  windSpeed,
  isStormMode,
  size = DIAMETER,
  onJitterUpdate
}: CompassProps) {
  const jitter = useMemo(() => {
    const j = calculateCompassJitter(shipRoll, windSpeed, isStormMode);
    onJitterUpdate?.(j);
    return j;
  }, [shipRoll, windSpeed, isStormMode, onJitterUpdate]);

  const scale = size / DIAMETER;

  const needleSwing = Math.sin(Date.now() / 500) * 3;
  const totalRotation = headingError + jitter.rotation + needleSwing;

  const scaleMarks = useMemo(() => {
    const marks = [];
    for (let i = 0; i < 72; i++) {
      const angle = i * 5 - 90;
      const isMajor = i % 6 === 0;
      const innerRadius = isMajor ? RADIUS - 25 : RADIUS - 15;
      const outerRadius = RADIUS - 8;
      
      const x1 = RADIUS + Math.cos(angle * Math.PI / 180) * innerRadius;
      const y1 = RADIUS + Math.sin(angle * Math.PI / 180) * innerRadius;
      const x2 = RADIUS + Math.cos(angle * Math.PI / 180) * outerRadius;
      const y2 = RADIUS + Math.sin(angle * Math.PI / 180) * outerRadius;

      marks.push(
        <line
          key={`mark-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isMajor ? '#000000' : '#333333'}
          strokeWidth={isMajor ? 2 : 1}
        />
      );

      if (isMajor) {
        const textRadius = RADIUS - 35;
        const tx = RADIUS + Math.cos(angle * Math.PI / 180) * textRadius;
        const ty = RADIUS + Math.sin(angle * Math.PI / 180) * textRadius;
        const directions = ['子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'];
        const label = directions[i / 6];
        
        marks.push(
          <text
            key={`text-${i}`}
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#000000"
            fontSize="10"
            fontFamily="serif"
            fontWeight="bold"
          >
            {label}
          </text>
        );
      }
    }
    return marks;
  }, []);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative'
      }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${DIAMETER} ${DIAMETER}`}
        animate={{
          x: jitter.x * scale,
          y: jitter.y * scale
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))'
        }}
      >
        <defs>
          <radialGradient id="copperGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d4a574" />
            <stop offset="50%" stopColor="#b87333" />
            <stop offset="100%" stopColor="#8b4513" />
          </radialGradient>
          <radialGradient id="ivoryGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fffff0" />
          </radialGradient>
          <radialGradient id="needleRed" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff4444" />
            <stop offset="100%" stopColor="#cc0000" />
          </radialGradient>
          <radialGradient id="needleBlue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4444ff" />
            <stop offset="100%" stopColor="#0000cc" />
          </radialGradient>
        </defs>

        <circle
          cx={RADIUS}
          cy={RADIUS}
          r={RADIUS}
          fill="url(#copperGradient)"
          stroke="#8b4513"
          strokeWidth="4"
        />

        <circle
          cx={RADIUS}
          cy={RADIUS}
          r={RADIUS - 12}
          fill="url(#ivoryGradient)"
          stroke="#d4a76a"
          strokeWidth="2"
        />

        <g>{scaleMarks}</g>

        <g
          style={{
            transformOrigin: `${RADIUS}px ${RADIUS}px`,
            transform: `rotate(${totalRotation}deg)`
          }}
        >
          <polygon
            points={`${RADIUS},${RADIUS - 70} ${RADIUS - 8},${RADIUS} ${RADIUS + 8},${RADIUS}`}
            fill="url(#needleRed)"
            stroke="#990000"
            strokeWidth="1"
          />
          <polygon
            points={`${RADIUS},${RADIUS + 70} ${RADIUS - 8},${RADIUS} ${RADIUS + 8},${RADIUS}`}
            fill="url(#needleBlue)"
            stroke="#000099"
            strokeWidth="1"
          />

          <circle
            cx={RADIUS}
            cy={RADIUS - 70}
            r="5"
            fill="#ffd700"
            stroke="#b8860b"
            strokeWidth="1"
          />
        </g>

        <circle
          cx={RADIUS}
          cy={RADIUS}
          r="10"
          fill="url(#copperGradient)"
          stroke="#8b4513"
          strokeWidth="2"
        />

        <circle
          cx={RADIUS}
          cy={RADIUS}
          r="4"
          fill="#ffd700"
        />

        <polygon
          points={`${RADIUS},${12} ${RADIUS - 6},${24} ${RADIUS + 6},${24}`}
          fill="#ffd700"
          stroke="#b8860b"
          strokeWidth="1"
        />
      </motion.svg>
    </div>
  );
}
