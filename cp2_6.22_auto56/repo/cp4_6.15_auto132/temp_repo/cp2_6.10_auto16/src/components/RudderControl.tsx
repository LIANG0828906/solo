import { useCallback } from 'react';
import { motion } from 'framer-motion';

interface RudderControlProps {
  rudderAngle: number;
  onRudderChange: (angle: number) => void;
  onIncrement: (delta: number) => void;
  disabled?: boolean;
}

export function RudderControl({
  rudderAngle,
  onRudderChange,
  onIncrement,
  disabled = false
}: RudderControlProps) {
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onRudderChange(value);
  }, [onRudderChange]);

  const handleLeft = useCallback(() => {
    onIncrement(-2);
  }, [onIncrement]);

  const handleRight = useCallback(() => {
    onIncrement(2);
  }, [onIncrement]);

  const handleCenter = useCallback(() => {
    onRudderChange(0);
  }, [onRudderChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        padding: '16px',
        backgroundColor: 'var(--color-canvas)',
        border: '3px solid var(--color-copper-gold)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div
        style={{
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'var(--color-deep-wood)',
          marginBottom: '12px',
          fontFamily: 'serif'
        }}
      >
        舵角控制
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLeft}
          disabled={disabled}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '2px solid var(--color-copper-gold)',
            backgroundColor: 'var(--color-teak)',
            color: 'var(--color-ivory)',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-copper-gold), var(--color-bronze), var(--color-copper-gold))';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = 'var(--color-teak)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
            }
          }}
        >
          ◀
        </motion.button>

        <div
          style={{
            flex: 1,
            textAlign: 'center'
          }}
        >
          <motion.div
            key={rudderAngle}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: rudderAngle !== 0 ? 'var(--color-warning-red)' : 'var(--color-deep-wood)',
              fontFamily: 'monospace'
            }}
          >
            {rudderAngle > 0 ? '+' : ''}{rudderAngle}°
          </motion.div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-deep-wood)',
              opacity: 0.7
            }}
          >
            {rudderAngle < 0 ? '左舵' : rudderAngle > 0 ? '右舵' : '正舵'}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRight}
          disabled={disabled}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '2px solid var(--color-copper-gold)',
            backgroundColor: 'var(--color-teak)',
            color: 'var(--color-ivory)',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-copper-gold), var(--color-bronze), var(--color-copper-gold))';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = 'var(--color-teak)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
            }
          }}
        >
          ▶
        </motion.button>
      </div>

      <div
        style={{
          marginBottom: '12px'
        }}
      >
        <input
          type="range"
          min="-30"
          max="30"
          step="2"
          value={rudderAngle}
          onChange={handleSliderChange}
          disabled={disabled}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            background: `linear-gradient(to right, 
              var(--color-copper-gold) 0%, 
              var(--color-copper-gold) ${((rudderAngle + 30) / 60) * 100}%, 
              rgba(42, 26, 10, 0.3) ${((rudderAngle + 30) / 60) * 100}%, 
              rgba(42, 26, 10, 0.3) 100%)`,
            outline: 'none',
            appearance: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'var(--color-deep-wood)',
            opacity: 0.7,
            marginTop: '4px'
          }}
        >
          <span>-30°</span>
          <span>0°</span>
          <span>+30°</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCenter}
        disabled={disabled || rudderAngle === 0}
        style={{
          width: '100%',
          padding: '10px',
          border: '2px solid var(--color-copper-gold)',
          borderRadius: '6px',
          backgroundColor: (disabled || rudderAngle === 0) ? 'rgba(42, 26, 10, 0.2)' : 'var(--color-teak)',
          color: 'var(--color-ivory)',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: (disabled || rudderAngle === 0) ? 'not-allowed' : 'pointer',
          opacity: (disabled || rudderAngle === 0) ? 0.5 : 1,
          fontFamily: 'serif',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!disabled && rudderAngle !== 0) {
            e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-copper-gold), var(--color-bronze), var(--color-copper-gold))';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && rudderAngle !== 0) {
            e.currentTarget.style.background = 'var(--color-teak)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        回正舵
      </motion.button>

      <div
        style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: 'rgba(42, 26, 10, 0.1)',
          borderRadius: '4px',
          fontSize: '11px',
          color: 'var(--color-deep-wood)',
          textAlign: 'center'
        }}
      >
        键盘操作：← 左舵 2° | → 右舵 2° | ↑ 回正舵
      </div>
    </motion.div>
  );
}
