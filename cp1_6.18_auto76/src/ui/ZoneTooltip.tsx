import { useAppStore } from '../store';
import { ZONE_INFO } from '../types';
import { getBuildingsByZone } from '../scene/DataParser';
import styles from './ZoneTooltip.module.css';

export const ZoneTooltip = () => {
  const { hoveredZone, year } = useAppStore();

  if (!hoveredZone) return null;

  const zoneInfo = ZONE_INFO[hoveredZone];
  const buildingCount = getBuildingsByZone(hoveredZone, year).length;

  return (
    <div className={styles.tooltip}>
      <div className={styles.zoneName}>{zoneInfo.name}</div>
      <div className={styles.buildingCount}>建筑数量：{buildingCount}</div>
    </div>
  );
};

export default ZoneTooltip;
