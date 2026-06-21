import { useState, useEffect, useCallback } from 'react';
import type { MoodEntry, FilterOptions, StatResult, CorrelationResult, MoodType, DietLabel } from '../types';
import MoodEntryCard from './components/MoodEntryCard';
import BehaviorFilter from './components/BehaviorFilter';
import type { FilterState } from './components/BehaviorFilter';
import StatisticsPanel from './components/StatisticsPanel';
import MoodChart from './components/MoodChart';
import CorrelationPanel from './components/CorrelationPanel';

const API_BASE = 'http://localhost:3001/api';

export default function App() {
  const [allMoods, setAllMoods] = useState<MoodEntry[]>([]);
  const [filteredMoods, setFilteredMoods] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<StatResult>({
    filteredAvg: 0,
    filteredStd: 0,
    overallAvg: 0,
    overallStd: 0,
    filteredCount: 0,
    totalCount: 0,
  });
  const [correlation, setCorrelation] = useState<CorrelationResult>({
    sleepHours: 0,
    exerciseMinutes: 0,
    waterCups: 0,
  });
  const [correlationCount, setCorrelationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMoods = useCallback(async (filters?: FilterOptions) => {
    try {
      const params = new URLSearchParams();
      if (filters && Object.values(filters).some((v) => v)) {
        params.set('filters', JSON.stringify(filters));
      }
      const res = await fetch(`${API_BASE}/moods?${params.toString()}`);
      const data = await res.json();
      setFilteredMoods(data.moods);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch moods:', err);
    }
  }, []);

  const fetchAllMoods = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/moods?days=7`);
      const data = await res.json();
      setAllMoods(data.moods);
    } catch (err) {
      console.error('Failed to fetch all moods:', err);
    }
  }, []);

  const fetchCorrelation = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/analysis/correlation`);
      const data = await res.json();
      setCorrelation(data.correlation);
      setCorrelationCount(data.count);
    } catch (err) {
      console.error('Failed to fetch correlation:', err);
    }
  }, []);

  const loadAll = useCallback(async (filters?: FilterOptions) => {
    setLoading(true);
    await Promise.all([fetchMoods(filters), fetchAllMoods(), fetchCorrelation()]);
    setLoading(false);
  }, [fetchMoods, fetchAllMoods, fetchCorrelation]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSubmit = async (data: {
    mood: MoodType;
    intensity: number;
    sleepHours: number;
    exerciseMinutes: number;
    waterCups: number;
    dietLabels: DietLabel[];
  }) => {
    const res = await fetch(`${API_BASE}/moods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit');
    await loadAll();
  };

  const handleFilterChange = (filters: FilterState) => {
    fetchMoods(filters as FilterOptions);
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE}/export?days=30`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = res.headers.get('Content-Disposition');
      const match = contentDisposition?.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] || '情绪报告.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>
          <span className="material-icons" style={{ fontSize: '32px' }}>
            mood
          </span>
          情绪追踪器
        </h1>
        <p>记录每日情绪，发现行为与情绪的关联模式</p>
      </header>

      <div className="main-grid">
        <div className="left-panel">
          <BehaviorFilter onFilterChange={handleFilterChange} />
          <div style={{ marginTop: '16px' }}>
            <StatisticsPanel stats={stats} />
          </div>
        </div>

        <div className="center-panel">
          <MoodEntryCard onSubmit={handleSubmit} />
        </div>

        <div className="right-panel">
          <MoodChart moods={allMoods} />
        </div>
      </div>

      <div className="bottom-section">
        <CorrelationPanel correlation={correlation} dataCount={correlationCount} />
      </div>

      <div className="export-section">
        <button className="btn btn-primary export-btn" onClick={handleExport}>
          <span className="material-icons">file_download</span>
          导出30天报告（CSV）
        </button>
      </div>
    </div>
  );
}
