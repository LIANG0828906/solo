import styles from '../../styles/ui.module.css';

export interface AngleSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label?: string;
}

export function AngleSlider({
  value,
  min = 0,
  max = 360,
  step = 1,
  onChange,
  label,
}: AngleSliderProps) {
  const ticks = [];
  for (let deg = 0; deg <= 360; deg += 30) {
    ticks.push(deg);
  }

  return (
    <div className={styles.angleSliderContainer}>
      <div className={styles.angleLabel}>
        <span>{label ?? '角度'}</span>
        <span className={styles.angleValue}>{value}°</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.sliderInput}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          padding: '0 4px',
        }}
      >
        {ticks.map((tick) => (
          <div
            key={tick}
            style={{
              width: 2,
              height: tick % 90 === 0 ? 6 : 3,
              background: tick % 90 === 0 ? 'var(--accent-gold)' : 'rgba(255,255,255,0.2)',
              borderRadius: 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default AngleSlider;
