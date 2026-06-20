import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateCoverage } from './MilkParticle';
import type { Particle } from './MilkParticle';

interface ScoringPanelProps {
  particles: Particle[];
  dragTrajectory: { x: number; y: number; angle: number }[];
  cupCenter: { x: number; y: number };
  cupRadius: number;
  isDragging: boolean;
  onFinalScore: (score: number) => void;
}

interface Scores {
  flowUniformity: number;
  symmetry: number;
  centerOffset: number;
  coverage: number;
  total: number;
}

const WaveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
  </svg>
);

const SymmetryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20" />
    <path d="M8 2h8v20H8z" />
    <circle cx="8" cy="8" r="2" fill="currentColor" />
    <circle cx="16" cy="8" r="2" fill="currentColor" />
    <circle cx="8" cy="14" r="1.5" fill="currentColor" />
    <circle cx="16" cy="14" r="1.5" fill="currentColor" />
  </svg>
);

const TargetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const CoverageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" opacity="0.5" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="60" height="60" viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="50%" stopColor="#FFA500" />
        <stop offset="100%" stopColor="#FF8C00" />
      </linearGradient>
    </defs>
    <path
      d="M20 8h24v4c0 8-6 12-12 14-6-2-12-6-12-14V8zM10 10h4v6c0 5 3 9 8 11v7h-6v4h16v-4h-6v-7c5-2 8-6 8-11v-6h4v6c0 6-4 11-10 14h2v4h4v4H14v-4h4v-4h2c-6-3-10-8-10-14v-6z"
      fill="url(#goldGrad)"
      stroke="#8B4513"
      strokeWidth="1.5"
    />
    <ellipse cx="32" cy="10" rx="10" ry="2" fill="#FFE4B5" opacity="0.6" />
  </svg>
);

function calculateScores(
  particles: Particle[],
  dragTrajectory: { x: number; y: number; angle: number }[],
  cupCenter: { x: number; y: number },
  cupRadius: number
): Scores {
  const settledParticles = particles.filter((p) => p.isSettled && p.opacity > 0.1);

  let flowUniformity = 50;
  if (dragTrajectory.length > 10) {
    const angles = dragTrajectory.map((t) => t.angle);
    const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
    const variance = angles.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / angles.length;
    const stdDev = Math.sqrt(variance);
    flowUniformity = Math.max(0, Math.min(100, 100 - stdDev * 1.5));
  }

  let symmetry = 50;
  if (settledParticles.length > 10) {
    const localCupCenter = { x: cupRadius, y: cupRadius };
    let leftCount = 0;
    let rightCount = 0;
    let leftArea = 0;
    let rightArea = 0;

    settledParticles.forEach((p) => {
      const localX = p.x - (cupCenter.x - cupRadius);
      if (localX < localCupCenter.x) {
        leftCount++;
        leftArea += Math.PI * p.settledRadius * p.settledRadius;
      } else {
        rightCount++;
        rightArea += Math.PI * p.settledRadius * p.settledRadius;
      }
    });

    const countSymmetry = 1 - Math.abs(leftCount - rightCount) / (leftCount + rightCount);
    const areaSymmetry = 1 - Math.abs(leftArea - rightArea) / (leftArea + rightArea);
    symmetry = Math.max(0, Math.min(100, (countSymmetry * 0.5 + areaSymmetry * 0.5) * 100));
  }

  let centerOffset = 50;
  if (settledParticles.length > 5) {
    let totalArea = 0;
    let weightedX = 0;
    let weightedY = 0;

    settledParticles.forEach((p) => {
      const area = Math.PI * p.settledRadius * p.settledRadius;
      weightedX += p.x * area;
      weightedY += p.y * area;
      totalArea += area;
    });

    const centerX = weightedX / totalArea;
    const centerY = weightedY / totalArea;
    const offsetDistance = Math.sqrt(
      Math.pow(centerX - cupCenter.x, 2) + Math.pow(centerY - cupCenter.y, 2)
    );
    const maxOffset = cupRadius * 0.8;
    centerOffset = Math.max(0, Math.min(100, 100 - (offsetDistance / maxOffset) * 100));
  }

  const coverageRatio = calculateCoverage(particles, cupCenter, cupRadius);
  const coverage = Math.max(
    0,
    Math.min(100, 100 - Math.abs(coverageRatio - 0.35) * 200)
  );

  const total =
    flowUniformity * 0.25 + symmetry * 0.25 + centerOffset * 0.3 + coverage * 0.2;

  return {
    flowUniformity: Math.round(flowUniformity),
    symmetry: Math.round(symmetry),
    centerOffset: Math.round(centerOffset),
    coverage: Math.round(coverage),
    total: Math.round(total)
  };
}

export function ScoringPanel({
  particles,
  dragTrajectory,
  cupCenter,
  cupRadius,
  isDragging,
  onFinalScore
}: ScoringPanelProps) {
  const [showTrophy, setShowTrophy] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const trophyTimeoutRef = useRef<number>();

  const scores = useMemo(
    () => calculateScores(particles, dragTrajectory, cupCenter, cupRadius),
    [particles, dragTrajectory, cupCenter, cupRadius]
  );

  useEffect(() => {
    if (!isDragging && particles.length > 0 && !hasReported) {
      setHasReported(true);
      onFinalScore(scores.total);

      if (scores.total >= 80) {
        setShowTrophy(true);
        trophyTimeoutRef.current = window.setTimeout(() => {
          setShowTrophy(false);
        }, 2500);
      }
    }

    if (isDragging) {
      setHasReported(false);
    }
  }, [isDragging, particles.length, scores.total, onFinalScore, hasReported]);

  useEffect(() => {
    return () => {
      if (trophyTimeoutRef.current) {
        clearTimeout(trophyTimeoutRef.current);
      }
    };
  }, []);

  const scoreDimensions = [
    {
      name: '流速均匀度',
      value: scores.flowUniformity,
      icon: <WaveIcon />,
      color: '#6F4E37'
    },
    {
      name: '图案对称性',
      value: scores.symmetry,
      icon: <SymmetryIcon />,
      color: '#8D6E63'
    },
    {
      name: '中心偏移度',
      value: scores.centerOffset,
      icon: <TargetIcon />,
      color: '#A1887F'
    },
    {
      name: '奶泡覆盖率',
      value: scores.coverage,
      icon: <CoverageIcon />,
      color: '#BCAAA4'
    }
  ];

  const getScoreColor = (value: number) => {
    if (value >= 80) return '#4CAF50';
    if (value >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <>
      <div
        className="scoring-panel"
        style={{
          position: 'relative',
          backgroundColor: 'rgba(245, 240, 225, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(62, 39, 35, 0.15)',
          border: '1px solid rgba(62, 39, 35, 0.1)',
          minWidth: '240px'
        }}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            color: '#3E2723',
            fontSize: '18px',
            fontWeight: 600,
            textAlign: 'center'
          }}
        >
          技巧评分
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {scoreDimensions.map((dim) => (
            <div key={dim.name}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  color: '#3E2723'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: dim.color }}>{dim.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{dim.name}</span>
                </div>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: getScoreColor(dim.value)
                  }}
                >
                  {dim.value}
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  backgroundColor: 'rgba(62, 39, 35, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.value}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    backgroundColor: getScoreColor(dim.value),
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '2px solid rgba(62, 39, 35, 0.1)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '12px', color: '#6F4E37', marginBottom: '4px' }}>
            综合评分
          </div>
          <motion.div
            key={scores.total}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: getScoreColor(scores.total)
            }}
          >
            {scores.total}
            <span style={{ fontSize: '18px' }}>/100</span>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showTrophy && (
          <motion.div
            initial={{ y: 200, opacity: 0, scale: 0.5, rotate: -180 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: 360 }}
            exit={{ y: -200, opacity: 0, scale: 0.5, rotate: 180 }}
            transition={{
              duration: 1.5,
              ease: [0.34, 1.56, 0.64, 1],
              times: [0, 0.6, 0.8, 1]
            }}
            style={{
              position: 'fixed',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <TrophyIcon />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  marginTop: '12px',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#FF8C00',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                优秀！
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{
                  fontSize: '16px',
                  color: '#6F4E37',
                  marginTop: '4px'
                }}
              >
                得分: {scores.total}
              </motion.div>
            </div>

            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i * 30 * Math.PI) / 180) * 100,
                  y: Math.sin((i * 30 * Math.PI) / 180) * 100,
                  opacity: 0
                }}
                transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: i % 2 === 0 ? '#FFD700' : '#FFA500'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
