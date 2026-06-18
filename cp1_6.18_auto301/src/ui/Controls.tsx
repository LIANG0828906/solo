import { useEffect, useRef, useState } from 'react';
import styles from './styles/Controls.module.css';
import { useSolarSystemStore } from '../store/useSolarSystemStore';
import { PLANETS } from '../data/planets';

export function Controls() {
  const timeSpeed = useSolarSystemStore((s) => s.timeSpeed);
  const selectedPlanetId = useSolarSystemStore((s) => s.selectedPlanetId);
  const setTimeSpeed = useSolarSystemStore((s) => s.setTimeSpeed);
  const setSelectedPlanet = useSolarSystemStore((s) => s.setSelectedPlanet);
  const reset = useSolarSystemStore((s) => s.reset);

  const [displaySpeed, setDisplaySpeed] = useState(timeSpeed);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
    }

    const start = displaySpeed;
    const end = timeSpeed;
    const duration = 200;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const current = start + (end - start) * eased;
      setDisplaySpeed(current);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [timeSpeed]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeSpeed(parseFloat(e.target.value));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedPlanet(value || null);
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.title}>太阳系计时器</div>

      <div className={styles.speedRow}>
        <span className={styles.speedLabel}>时间流速</span>
        <span className={styles.speedValue}>{displaySpeed.toFixed(1)}x</span>
      </div>

      <div className={styles.sliderContainer}>
        <input
          type="range"
          className={styles.slider}
          min="0.1"
          max="10"
          step="0.1"
          value={timeSpeed}
          onChange={handleSliderChange}
        />
      </div>

      <div className={styles.selectRow}>
        <label className={styles.selectLabel}>选择行星</label>
        <select
          className={styles.select}
          value={selectedPlanetId || ''}
          onChange={handleSelectChange}
        >
          <option value="">-- 未选择 --</option>
          {PLANETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nameCN} ({p.name})
            </option>
          ))}
        </select>
      </div>

      <button className={styles.resetBtn} onClick={handleReset}>
        重置视角
      </button>
    </div>
  );
}
