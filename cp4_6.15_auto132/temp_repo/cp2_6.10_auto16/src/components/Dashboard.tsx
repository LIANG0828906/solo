import { motion, AnimatePresence } from 'framer-motion';
import { getBeaufortScale } from '../utils/navigation';

interface DashboardProps {
  windSpeed: number;
  headingError: number;
  sailingTime: number;
  yawCount: number;
  stableDuration: number;
  isStormMode: boolean;
}

export function Dashboard({
  windSpeed,
  headingError,
  sailingTime,
  yawCount,
  stableDuration,
  isStormMode
}: DashboardProps) {
  const beaufort = getBeaufortScale(windSpeed);
  const isErrorWarning = Math.abs(headingError) > 10;
  const isErrorCritical = Math.abs(headingError) > 15;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stableProgress = Math.min(100, (stableDuration / 60) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        padding: '16px',
        backgroundColor: 'var(--color-canvas)',
        border: '3px solid var(--color-copper-gold)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div
        style={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          padding: '8px',
          borderBottom: '2px solid var(--color-copper-gold)',
          marginBottom: '4px'
        }}
      >
        <span
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--color-deep-wood)',
            fontFamily: 'serif'
          }}
        >
          航海仪表
        </span>
        {isStormMode && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              marginLeft: '12px',
              padding: '2px 8px',
              backgroundColor: 'var(--color-warning-red)',
              color: 'var(--color-ivory)',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            风暴模式
          </motion.span>
        )}
      </div>

      <div
        style={{
          padding: '12px',
          backgroundColor: 'rgba(42, 26, 10, 0.1)',
          borderRadius: '6px',
          border: '1px solid var(--color-copper-gold)'
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-deep-wood)',
            marginBottom: '4px',
            fontFamily: 'serif'
          }}
        >
          蒲福风级
        </div>
        <motion.div
          key={beaufort}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'var(--color-gold)',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
          }}
        >
          {beaufort}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--color-deep-wood)',
            opacity: 0.7
          }}
        >
          {(windSpeed * 5).toFixed(1)} km/h
        </div>
      </div>

      <motion.div
        animate={isErrorWarning ? {
          backgroundColor: ['rgba(139, 0, 0, 0.1)', 'rgba(139, 0, 0, 0.3)', 'rgba(139, 0, 0, 0.1)']
        } : {}}
        transition={isErrorWarning ? {
          duration: 0.5,
          repeat: Infinity
        } : {}}
        style={{
          padding: '12px',
          backgroundColor: isErrorCritical ? 'rgba(139, 0, 0, 0.2)' : 'rgba(42, 26, 10, 0.1)',
          borderRadius: '6px',
          border: `2px solid ${isErrorCritical ? 'var(--color-warning-red)' : 'var(--color-copper-gold)'}`
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-deep-wood)',
            marginBottom: '4px',
            fontFamily: 'serif'
          }}
        >
          航向误差
        </div>
        <motion.div
          key={headingError.toFixed(1)}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: isErrorCritical ? 'var(--color-warning-red)' : isErrorWarning ? '#b8860b' : 'var(--color-deep-wood)'
          }}
        >
          {headingError > 0 ? '+' : ''}{headingError.toFixed(1)}°
        </div>
        <div
          style={{
            fontSize: '11px',
            color: isErrorCritical ? 'var(--color-warning-red)' : 'var(--color-deep-wood)',
            opacity: 0.7
          }}
        >
          {isErrorCritical ? '警告：严重偏航！' : Math.abs(headingError) < 5 ? '航线稳定' : '注意修正'}
        </div>
      </div>

      <div
        style={{
          padding: '12px',
          backgroundColor: 'rgba(42, 26, 10, 0.1)',
          borderRadius: '6px',
          border: '1px solid var(--color-copper-gold)'
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-deep-wood)',
            marginBottom: '4px',
            fontFamily: 'serif'
          }}
        >
          航行时间
        </div>
        <motion.div
          key={Math.floor(sailingTime)}
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: 'var(--color-deep-wood)',
            fontFamily: 'monospace'
          }}
        >
          {formatTime(sailingTime)}
        </div>
      </div>

      <div
        style={{
          padding: '12px',
          backgroundColor: 'rgba(42, 26, 10, 0.1)',
          borderRadius: '6px',
          border: '1px solid var(--color-copper-gold)'
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-deep-wood)',
            marginBottom: '4px',
            fontFamily: 'serif'
          }}
        >
          偏航次数
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={yawCount}
            initial={{ scale: 1.3, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.7, rotate: 10 }}
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: yawCount > 0 ? 'var(--color-warning-red)' : 'var(--color-deep-wood)'
            }}
          >
            {yawCount} / 5
          </motion.div>
        </AnimatePresence>
        <div
          style={{
            height: '6px',
            backgroundColor: 'rgba(42, 26, 10, 0.3)',
            borderRadius: '3px',
            marginTop: '6px',
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={false}
            animate={{ width: `${(yawCount / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              backgroundColor: yawCount >= 3 ? 'var(--color-warning-red)' : 'var(--color-copper-gold)',
              borderRadius: '3px'
            }}
          />
        </div>
      </div>

      <div
        style={{
          gridColumn: '1 / -1',
          padding: '12px',
          backgroundColor: 'rgba(42, 26, 10, 0.1)',
          borderRadius: '6px',
          border: '1px solid var(--color-copper-gold)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-deep-wood)',
              fontFamily: 'serif'
            }}
          >
            太平航海进度
          </span>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-gold)',
              fontWeight: 'bold'
            }}
          >
            {Math.floor(stableDuration)}s / 60s
          </span>
        </div>
        <div
          style={{
            height: '10px',
            backgroundColor: 'rgba(42, 26, 10, 0.3)',
            borderRadius: '5px',
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={false}
            animate={{ width: `${stableProgress}%` }}
            transition={{ duration: 0.2 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--color-copper-gold), var(--color-gold), var(--color-copper-gold))',
              backgroundSize: '200% 100%',
              animation: 'metalShine 2s linear infinite',
              borderRadius: '5px'
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
