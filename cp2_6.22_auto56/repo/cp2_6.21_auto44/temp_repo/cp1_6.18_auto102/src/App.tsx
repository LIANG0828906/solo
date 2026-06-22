import EquipmentPanel from '@/components/EquipmentPanel';
import PackingZone from '@/components/PackingZone';
import WeightDashboard from '@/components/WeightDashboard';
import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>装备打包大师</h1>
        <span className={styles.tagline}>可视化装备管理 · 智能重量分析</span>
      </header>
      <main className={styles.main}>
        <EquipmentPanel />
        <PackingZone />
        <WeightDashboard />
      </main>
    </div>
  );
}
