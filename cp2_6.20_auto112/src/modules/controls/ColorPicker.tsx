import { ColorMode, COLOR_SCHEMES } from '@/utils/colors';
import { Info } from 'lucide-react';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  value: ColorMode;
  onChange: (value: ColorMode) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const modes = Object.keys(COLOR_SCHEMES) as ColorMode[];
  const currentScheme = COLOR_SCHEMES[value];
  const previewGradient = `linear-gradient(90deg, ${currentScheme.stops.join(', ')})`;

  return (
    <div className={styles.colorPicker}>
      <div className={styles.previewRow}>
        <div className={styles.previewInfo}>
          <Info size={14} className={styles.previewIcon} />
          <span className={styles.previewLabel}>当前颜色映射</span>
        </div>
        <div
          className={styles.previewBar}
          style={{ background: previewGradient }}
          title={`${currentScheme.name} 渐变预览`}
        />
      </div>

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
