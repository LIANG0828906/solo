import { useState, useCallback, useTransition } from 'react';
import { useRiskStore } from '@/store/useRiskStore';
import type { Risk, ViewMode } from '@/types';
import { VIEW_MODE_LABELS } from '@/types';
import Header from './Header';
import BoardView from './BoardView';
import WaterfallView from './WaterfallView';
import GanttView from './GanttView';
import AddRiskForm from './AddRiskForm';
import RiskDetailPanel from './RiskDetailPanel';
import styles from './RiskBoard.module.css';

const RiskBoard = () => {
  const risks = useRiskStore((state) => state.risks);
  const viewMode = useRiskStore((state) => state.viewMode);
  const setViewMode = useRiskStore((state) => state.setViewMode);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newRiskId, setNewRiskId] = useState<string | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<'out' | 'in' | 'stable'>('stable');
  const [isPending, startTransition] = useTransition();

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    if (mode === viewMode) return;

    setTransitionPhase('out');
    startTransition(() => {
      setTimeout(() => {
        setViewMode(mode);
        setTransitionPhase('in');
        setTimeout(() => {
          setTransitionPhase('stable');
        }, 300);
      }, 300);
    });
  }, [viewMode, setViewMode]);

  const handleViewDetail = useCallback((risk: Risk) => {
    setSelectedRisk(risk);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setSelectedRisk(null);
    }, 300);
  }, []);

  const handleAddRiskClick = useCallback(() => {
    setIsFormOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    if (risks.length > 0) {
      setNewRiskId(risks[0].id);
      setTimeout(() => setNewRiskId(null), 500);
    }
  }, [risks]);

  const viewModes: ViewMode[] = ['board', 'waterfall', 'gantt'];

  const renderView = () => {
    if (viewMode === 'board') {
      return (
        <BoardView
          risks={risks}
          newRiskId={newRiskId}
          transitionPhase={transitionPhase}
          onViewDetail={handleViewDetail}
        />
      );
    }
    if (viewMode === 'waterfall') {
      return (
        <WaterfallView
          risks={risks}
          newRiskId={newRiskId}
          transitionPhase={transitionPhase}
          onViewDetail={handleViewDetail}
        />
      );
    }
    return <GanttView risks={risks} onViewDetail={handleViewDetail} />;
  };

  return (
    <div className={styles.boardWrapper}>
      <Header />

      <div className={styles.toolbar}>
        <div className={styles.viewTabs}>
          {viewModes.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${styles.tabButton} ${viewMode === mode ? styles.tabActive : ''}`}
              onClick={() => handleViewModeChange(mode)}
              disabled={isPending}
            >
              {VIEW_MODE_LABELS[mode]}
            </button>
          ))}
          <div
            className={styles.tabIndicator}
            style={{
              transform: `translateX(${viewModes.indexOf(viewMode) * 100}%)`,
            }}
          />
        </div>

        <button
          type="button"
          className={styles.addButton}
          onClick={handleAddRiskClick}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          添加风险
        </button>
      </div>

      <div className={styles.boardContainer} id="risk-board-container">
        {renderView()}
      </div>

      <AddRiskForm isOpen={isFormOpen} onClose={handleFormClose} />
      <RiskDetailPanel
        risk={selectedRisk}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default RiskBoard;
