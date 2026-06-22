import { useAppStore } from '../store';
import { getAllBuildings } from '../scene/DataParser';
import { STYLE_NAMES, STYLE_COLORS } from '../types';
import styles from './InfoPanel.module.css';

export const InfoPanel = () => {
  const { selectedBuilding, selectBuilding } = useAppStore();

  const building = selectedBuilding
    ? getAllBuildings().find((b) => b.id === selectedBuilding)
    : null;

  if (!building) return null;

  const styleColor = STYLE_COLORS[building.style];

  return (
    <div className={styles.panel}>
      <button
        className={styles.closeButton}
        onClick={() => selectBuilding(null)}
      >
        ×
      </button>
      <h3 className={styles.title}>{building.name}</h3>
      <div className={styles.infoRow}>
        <span className={styles.label}>高度</span>
        <span className={styles.value}>{building.height} 米</span>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.label}>建造年代</span>
        <span className={styles.value}>{building.year}年</span>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.label}>风格</span>
        <span
          className={styles.styleTag}
          style={{ backgroundColor: styleColor }}
        >
          {STYLE_NAMES[building.style]}
        </span>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.label}>区域</span>
        <span className={styles.value}>
          {building.zone === 'cbd'
            ? '中心商务区'
            : building.zone === 'oldtown'
            ? '老城区'
            : building.zone === 'waterfront'
            ? '滨水区'
            : '新兴开发区'}
        </span>
      </div>
    </div>
  );
};

export default InfoPanel;
