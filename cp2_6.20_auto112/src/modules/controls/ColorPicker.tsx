import { ColorMode, COLOR_SCHEMES } from '@/utils/colors';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  value: ColorMode;
  onChange: (value: ColorMode) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const modes = Object.keys(COLOR_SCHEMES) as ColorMode[];

  return (
    <div className={styles.colorPicker}>
      <div className={styles.colorGrid}>
        {modes.map((mode) => {
          const scheme = COLOR_SCHEMES[mode];
          const isSelected = value === mode;
          const gradient = `linear-gradient(90deg, ${scheme.stops.join(', ')})`;

          return (
            <div
              key={mode}
              className={`${styles.colorCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => onChange(mode)}
            >
              <div
                className={styles.colorGradient}
                style={{ background: gradient }}
              />
              <span className={styles.colorLabel}>{scheme.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ColorPicker;
