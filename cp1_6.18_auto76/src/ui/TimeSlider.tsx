import { useAppStore } from '../store';
import { MIN_YEAR, MAX_YEAR } from '../types';
import styles from './TimeSlider.module.css';

export const TimeSlider = () => {
  const { year, setYear } = useAppStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYear(Number(e.target.value));
  };

  const percentage = (year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR);

  return (
    <div className={styles.container}>
      <span className={styles.yearLabel}>{MIN_YEAR}</span>
      <div className={styles.sliderWrapper}>
        <div className={styles.progress} style={{ width: `${percentage * 100}%` }} />
        <div className={styles.track} />
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={year}
          onChange={handleChange}
          className={styles.slider}
        />
        <div className={styles.thumb} style={{ left: `calc(${percentage * 100}% - 10px)` }}>
          <div className={styles.glow} />
        </div>
      </div>
      <span className={styles.yearLabel}>{MAX_YEAR}</span>
      <div className={styles.currentYear}>{year}年</div>
    </div>
  );
};

export default TimeSlider;
