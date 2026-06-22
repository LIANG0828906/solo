import { useCallback } from 'react';
import styles from './HueSlider.module.css';

interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
}

export default function HueSlider({ hue, onChange }: HueSliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.track} />
      <input
        type="range"
        min={0}
        max={360}
        value={hue}
        onChange={handleChange}
        className={styles.slider}
        aria-label="色相选择"
      />
      <div className={styles.value}>{hue}°</div>
    </div>
  );
}
