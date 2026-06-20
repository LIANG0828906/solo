import { useState, useCallback } from 'react';
import type { Roadmap } from '@/types/index';
import { loadRoadmap, saveRoadmap, updateDailyRecord } from '@/utils/dataHelpers';
import SkillRoadmap from '@/components/SkillRoadmap';
import ProgressTracker from '@/components/ProgressTracker';
import './App.css';

type Page = 'roadmap' | 'progress';

function App() {
  const [roadmap, setRoadmapState] = useState<Roadmap | null>(() => loadRoadmap());
  const [currentPage, setCurrentPage] = useState<Page>('roadmap');

  const setRoadmap = useCallback((newRoadmap: Roadmap | null) => {
    setRoadmapState(newRoadmap);
    if (newRoadmap) {
      saveRoadmap(newRoadmap);
    } else {
      localStorage.removeItem('skill-roadmap-data');
    }
  }, []);

  const handleRoadmapChange = useCallback(
    (newRoadmap: Roadmap) => {
      if (roadmap && newRoadmap.stages) {
        const oldStages = roadmap.stages;
        const newStages = newRoadmap.stages;
        let minutesDiff = 0;
        oldStages.forEach((oldStage) => {
          const newStage = newStages.find((s) => s.id === oldStage.id);
          if (newStage) {
            oldStage.subTasks.forEach((oldTask) => {
              const newTask = newStage.subTasks.find((t) => t.id === oldTask.id);
              if (newTask && !oldTask.completed && newTask.completed) {
                minutesDiff += newTask.actualMinutes;
              }
            });
          }
        });
        if (minutesDiff > 0) {
          newRoadmap = {
            ...newRoadmap,
            dailyRecords: updateDailyRecord(newRoadmap, minutesDiff),
          };
        }
      }
      setRoadmap(newRoadmap);
    },
    [roadmap, setRoadmap]
  );

  const handleUpdateSkillScore = useCallback(
    (stageId: string, scoreId: string, score: number) => {
      if (!roadmap) return;
      const updated = {
        ...roadmap,
        stages: roadmap.stages.map((stage) => {
          if (stage.id !== stageId) return stage;
          return {
            ...stage,
            skillScores: stage.skillScores.map((ss) => (ss.id === scoreId ? { ...ss, score } : ss)),
          };
        }),
      };
      setRoadmap(updated);
    },
    [roadmap, setRoadmap]
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">学习路线规划</h1>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${currentPage === 'roadmap' ? 'active' : ''}`}
            onClick={() => setCurrentPage('roadmap')}
          >
            路线规划
          </button>
          <button
            className={`nav-btn ${currentPage === 'progress' ? 'active' : ''}`}
            onClick={() => setCurrentPage('progress')}
          >
            进度追踪
          </button>
        </nav>
      </header>

      <main className="app-main">
        {currentPage === 'roadmap' && (
          <SkillRoadmap roadmap={roadmap} onRoadmapChange={handleRoadmapChange} />
        )}
        {currentPage === 'progress' && (
          <ProgressTracker roadmap={roadmap} onUpdateSkillScore={handleUpdateSkillScore} />
        )}
      </main>
    </div>
  );
}

export default App;
