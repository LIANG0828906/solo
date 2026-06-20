import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoPanelProps {
  cityName: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

export const InfoPanel = ({ cityName, temperature, humidity, windSpeed, feelsLike }: InfoPanelProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [displayTemp, setDisplayTemp] = useState(temperature);

  useEffect(() => {
    const startTemp = displayTemp;
    const endTemp = temperature;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startTemp + (endTemp - startTemp) * eased;
      setDisplayTemp(Math.round(current * 10) / 10);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [temperature]);

  const tempStr = displayTemp.toFixed(1);
  const tempParts = useMemo(() => {
    const parts: { value: string; isDigit: boolean }[] = [];
    for (const char of tempStr) {
      parts.push({ value: char, isDigit: /\d/.test(char) });
    }
    return parts;
  }, [tempStr]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        position: 'absolute',
        top: 40,
        right: 40,
        padding: '24px 32px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8,
        color: '#fff',
        minWidth: 200,
        backdropFilter: 'blur(10px)',
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontSize: 20,
          marginBottom: 16,
          opacity: 0.9,
          letterSpacing: 2,
        }}
      >
        {cityName}
      </div>

      <div
        style={{ position: 'relative', display: 'inline-block' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'flex-start',
            cursor: 'default',
          }}
        >
          <div style={{ display: 'flex', lineHeight: 1 }}>
            {tempParts.map((part, i) => (
              part.isDigit ? (
                <DigitRoller key={i} digit={part.value} />
              ) : (
                <span key={i} style={{ display: 'inline-block' }}>{part.value}</span>
              )
            ))}
          </div>
          <span style={{ fontSize: 24, marginLeft: 4, marginTop: 4 }}>°C</span>
        </div>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 8,
                padding: '8px 16px',
                background: '#fff',
                color: '#333',
                borderRadius: 30,
                fontSize: 14,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              }}
            >
              体感温度 {feelsLike}°C
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ marginTop: 20, fontSize: 14, lineHeight: 2, opacity: 0.85 }}>
        <div>
          湿度：<span style={{ fontWeight: 500 }}>{humidity}%</span>
        </div>
        <div>
          风速：<span style={{ fontWeight: 500 }}>{windSpeed.toFixed(1)} m/s</span>
        </div>
      </div>
    </motion.div>
  );
};

const DigitRoller = ({ digit }: { digit: string }) => {
  return (
    <span style={{
      display: 'inline-block',
      position: 'relative',
      width: '0.6em',
      height: '1em',
      overflow: 'hidden',
      verticalAlign: 'top',
    }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={digit}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
