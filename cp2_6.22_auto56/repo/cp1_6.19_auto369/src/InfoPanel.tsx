import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCelestialStore } from './store';

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  const [flash, setFlash] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 100);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <motion.div
      className={`info-item ${flash ? 'flash' : ''}`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </motion.div>
  );
}

export default function InfoPanel() {
  const earthOrbitSpeed = useCelestialStore((state) => state.earthOrbitSpeed);
  const moonOrbitSpeed = useCelestialStore((state) => state.moonOrbitSpeed);
  const earthRotation = useCelestialStore((state) => state.earthRotation);
  const sunEarthDistance = useCelestialStore((state) => state.sunEarthDistance);

  return (
    <motion.div
      className="info-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
    >
      <InfoItem
        label="地球公转角速度"
        value={`${earthOrbitSpeed.toFixed(1)}°/s`}
      />
      <InfoItem
        label="月球公转角速度"
        value={`${moonOrbitSpeed.toFixed(1)}°/s`}
      />
      <InfoItem
        label="地球自转角度"
        value={`${earthRotation.toFixed(1)}°`}
      />
      <InfoItem
        label="日地距离"
        value={`${sunEarthDistance.toFixed(2)} 单位`}
      />
    </motion.div>
  );
}
