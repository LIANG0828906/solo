import StatusPanel from './components/StatusPanel';
import Farm from './components/Farm';
import Dungeon from './components/Dungeon';
import { useGameStore } from './store/useGameStore';
import styles from './App.module.css';

export default function App() {
  const currentView = useGameStore((state) => state.currentView);
  const setCurrentView = useGameStore((state) => state.setCurrentView);

  return (
    <div className={styles.app}>
      <StatusPanel />
      <main className={styles.mainContent}>
        {currentView === 'farm' && (
          <div className={styles.farmView}>
            <h1 className={styles.viewTitle}>农场</h1>
            <Farm />
            <button
              className={styles.entranceButton}
              onClick={() => setCurrentView('dungeon')}
            >
              进入地牢
            </button>
          </div>
        )}

        {(currentView === 'dungeon' || currentView === 'battle') && (
          <div className={styles.dungeonView}>
            <h1 className={styles.viewTitle}>地牢</h1>
            <Dungeon />
          </div>
        )}
      </main>
    </div>
  );
}
