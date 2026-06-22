import { useEffect, useState } from 'react';
import { RoutePlannerPanel } from './modules/ui/RoutePlannerPanel';
import { JournalPanel } from './modules/ui/JournalPanel';
import { TimelineView } from './modules/ui/TimelineView';
import { TripDataManager } from './modules/data/TripDataManager';

function App() {
  const [selectedDate, setSelectedDate] = useState(() => TripDataManager.getToday());
  const [totalSpent, setTotalSpent] = useState(() => TripDataManager.getTotalSpent());
  const [totalBudget, setTotalBudget] = useState(() => TripDataManager.getTotalBudget());

  useEffect(() => {
    return TripDataManager.subscribe(() => {
      setTotalSpent(TripDataManager.getTotalSpent());
      setTotalBudget(TripDataManager.getTotalBudget());
    });
  }, []);

  const spentRatio = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const progressColor =
    spentRatio < 0.5
      ? '#8B5CF6'
      : spentRatio < 0.8
      ? '#F59E0B'
      : '#EF4444';

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    const element = document.getElementById('journal-panel');
    if (element) {
      element.scrollTop = 0;
    }
  };

  return (
    <div style={styles.app}>
      <nav style={styles.navBar}>
        <div style={styles.navLeft}>
          <span style={styles.logoIcon}>✈️</span>
          <h1 style={styles.appName}>Travel Planner</h1>
        </div>
        <div style={styles.navRight}>
          <div style={styles.budgetContainer}>
            <div style={styles.budgetLabel}>
              <span style={styles.budgetLabelText}>预算概览</span>
              <span style={styles.budgetAmount}>
                ¥{totalSpent.toFixed(0)} / ¥{totalBudget.toFixed(0)}
              </span>
            </div>
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${Math.min(spentRatio * 100, 100)}%`,
                  backgroundColor: progressColor,
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      <div style={styles.mainContent}>
        <RoutePlannerPanel />
        <div id="journal-panel" style={styles.journalWrapper}>
          <JournalPanel selectedDate={selectedDate} />
        </div>
      </div>

      <TimelineView selectedDate={selectedDate} onDateSelect={handleDateSelect} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    backgroundColor: '#F9FAFB',
  },
  navBar: {
    height: 60,
    background: 'linear-gradient(135deg, #1E3A5F 0%, #3B82F6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    fontSize: 24,
  },
  appName: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
  },
  budgetContainer: {
    minWidth: 240,
  },
  budgetLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  budgetLabelText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  budgetAmount: {
    fontSize: 13,
    fontWeight: 600,
    color: '#FFFFFF',
  },
  progressTrack: {
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 7,
    transition: 'width 0.3s ease, background-color 0.3s ease',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  journalWrapper: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
};

export default App;
