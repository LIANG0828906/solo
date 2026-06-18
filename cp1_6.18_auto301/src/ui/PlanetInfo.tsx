import styles from './styles/PlanetInfo.module.css';
import { useSolarSystemStore } from '../store/useSolarSystemStore';
import { getPlanetById } from '../data/planets';

function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + ' × 10⁹';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + ' × 10⁶';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + ' × 10³';
  return num.toString();
}

export function PlanetInfo() {
  const selectedPlanetId = useSolarSystemStore((s) => s.selectedPlanetId);

  if (!selectedPlanetId) return null;

  const planet = getPlanetById(selectedPlanetId);
  if (!planet) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.title}>
        <span
          className={styles.colorDot}
          style={{ backgroundColor: planet.color, color: planet.color }}
        />
        {planet.nameCN}
        <span style={{ fontWeight: 400, fontSize: 14, color: '#A0A0B0' }}>
          {planet.name}
        </span>
      </div>

      <div className={styles.infoList}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>平均轨道半径</span>
          <span className={styles.infoValue}>{formatNumber(planet.realOrbitRadius)} km</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>公转周期</span>
          <span className={styles.infoValue}>{planet.realOrbitPeriod} 地球年</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>卫星数量</span>
          <span className={styles.infoValue}>{planet.satelliteCount} 颗</span>
        </div>
      </div>
    </div>
  );
}
