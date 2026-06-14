import { useState, useEffect, useCallback, useRef } from 'react';
import type { Cat, ShelterStats } from './types';
import { catAPI, statsAPI } from './services/api';
import ShelterMap from './components/ShelterMap';
import Dashboard from './pages/Dashboard';
import './styles/App.css';

function App() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [stats, setStats] = useState<ShelterStats | null>(null);
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draggingCat, setDraggingCat] = useState<Cat | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  const examTimersRef = useRef<Map<string, number>>(new Map());

  const fetchData = useCallback(async () => {
    try {
      const [catsData, statsData] = await Promise.all([
        catAPI.getAllCats(),
        statsAPI.getStats(),
      ]);
      setCats(catsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const receptionCats = cats.filter(c => c.area === 'reception');
      if (receptionCats.length < 3) {
        const count = Math.floor(Math.random() * 2) + 1;
        const toAdd = Math.min(count, 3 - receptionCats.length);
        if (toAdd > 0 && Math.random() < 0.3) {
          addRandomCat();
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [cats]);

  const addRandomCat = async () => {
    try {
      const newCat = await catAPI.generateRandomCat();
      setCats(prev => [...prev, newCat]);
      updateStats();
    } catch (error) {
      console.error('Failed to generate cat:', error);
    }
  };

  const updateStats = async () => {
    try {
      const statsData = await statsAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDragStart = (cat: Cat, e: React.MouseEvent | React.TouchEvent) => {
    setDraggingCat(cat);
    const pos = getEventPosition(e);
    setDragPosition(pos);
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingCat) return;
    const pos = getEventPosition(e);
    setDragPosition(pos);
  }, [draggingCat]);

  const handleDragEnd = useCallback(async (e: MouseEvent | TouchEvent) => {
    if (!draggingCat || !mapRef.current) {
      setDraggingCat(null);
      return;
    }

    const mapRect = mapRef.current.getBoundingClientRect();
    const pos = getEventPosition(e);
    const relX = (pos.x - mapRect.left) / mapRect.width;
    const relY = (pos.y - mapRect.top) / mapRect.height;

    if (relX > 0.35 && relX < 0.65 && relY > 0.1 && relY < 0.45) {
      try {
        const updatedCat = await catAPI.startExam(draggingCat.id);
        setCats(prev => prev.map(c => c.id === draggingCat.id ? updatedCat : c));
        startExamProgress(updatedCat.id);
      } catch (error) {
        console.error('Failed to start exam:', error);
      }
    }

    setDraggingCat(null);
  }, [draggingCat]);

  const startExamProgress = (catId: string) => {
    if (examTimersRef.current.has(catId)) return;

    let progress = 0;
    const duration = 5000;
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(100, (elapsed / duration) * 100);

      setCats(prev => prev.map(c => 
        c.id === catId ? { ...c, isExamining: true, examProgress: progress } : c
      ));

      if (progress < 100) {
        const timerId = requestAnimationFrame(updateProgress);
        examTimersRef.current.set(catId, timerId as unknown as number);
      } else {
        completeExam(catId);
        examTimersRef.current.delete(catId);
      }
    };

    const timerId = requestAnimationFrame(updateProgress);
    examTimersRef.current.set(catId, timerId as unknown as number);
  };

  const completeExam = async (catId: string) => {
    try {
      const updatedCat = await catAPI.completeExam(catId);
      setCats(prev => prev.map(c => c.id === catId ? updatedCat : c));
      updateStats();
    } catch (error) {
      console.error('Failed to complete exam:', error);
    }
  };

  useEffect(() => {
    if (draggingCat) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [draggingCat, handleDragMove, handleDragEnd]);

  const handleCatClick = (cat: Cat) => {
    if (!draggingCat) {
      setSelectedCat(cat);
    }
  };

  const handleUpdateCat = async (id: string, data: Partial<Cat>) => {
    try {
      const updatedCat = await catAPI.updateCat(id, data);
      setCats(prev => prev.map(c => c.id === id ? updatedCat : c));
      setSelectedCat(updatedCat);
      updateStats();
    } catch (error) {
      console.error('Failed to update cat:', error);
    }
  };

  const getEventPosition = (e: any) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">🐱</div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🐾 喵星救助站</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={addRandomCat}>
            接收新猫咪
          </button>
        </div>
      </header>

      <div className="app-content">
        <Dashboard stats={stats} cats={cats} />
        
        <div ref={mapRef} className="map-wrapper">
          <ShelterMap
            cats={cats}
            onCatClick={handleCatClick}
            onDragStart={handleDragStart}
          />
        </div>
      </div>

      {draggingCat && (
        <div
          className="dragging-cat"
          style={{
            left: dragPosition.x - 30,
            top: dragPosition.y - 30,
          }}
        >
          <div className="dragging-cat-avatar">
            {draggingCat.avatar}
          </div>
          <div className="dragging-cat-name">{draggingCat.name}</div>
        </div>
      )}

      {selectedCat && (
        <div className="cat-detail-overlay" onClick={() => setSelectedCat(null)}>
          <div className="cat-detail-card" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div className="detail-avatar">{selectedCat.avatar}</div>
              <div className="detail-info">
                <h2>{selectedCat.name}</h2>
                <p>{selectedCat.breed} · {selectedCat.color}</p>
                <span className={`health-badge health-${selectedCat.healthStatus}`}>
                  {selectedCat.healthStatus === 'healthy' ? '健康' : 
                   selectedCat.healthStatus === 'mild' ? '轻度伤病' : '严重伤病'}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedCat(null)}>×</button>
            </div>

            <div className="detail-body">
              <div className="detail-section">
                <h3>背景故事</h3>
                <p>{selectedCat.story}</p>
              </div>

              <div className="detail-section">
                <h3>体检报告</h3>
                <div className="radar-chart">
                  <RadarChart metrics={selectedCat.metrics} />
                </div>
                <div className="metrics-list">
                  <MetricItem label="食欲" value={selectedCat.metrics.appetite} />
                  <MetricItem label="活力" value={selectedCat.metrics.energy} />
                  <MetricItem label="友善度" value={selectedCat.metrics.friendliness} />
                  <MetricItem label="整洁度" value={selectedCat.metrics.cleanliness} />
                  <MetricItem label="健康状况" value={selectedCat.metrics.health} />
                </div>
              </div>

              <div className="detail-section">
                <h3>行为记录</h3>
                <ul className="behavior-list">
                  {selectedCat.behaviorRecords.map((record, index) => (
                    <li key={index}>• {record}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-section">
                <h3>入站日期</h3>
                <p>{new Date(selectedCat.arrivalDate).toLocaleDateString('zh-CN')}</p>
              </div>
            </div>

            <div className="detail-footer">
              <button 
                className="btn-primary"
                onClick={() => handleUpdateCat(selectedCat.id, { area: 'adoption' })}
              >
                安排领养
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RadarChart({ metrics }: { metrics: Cat['metrics'] }) {
  const size = 200;
  const center = size / 2;
  const maxRadius = 70;
  
  const labels = [
    { key: 'appetite', label: '食欲', angle: -90 },
    { key: 'energy', label: '活力', angle: -18 },
    { key: 'friendliness', label: '友善度', angle: 54 },
    { key: 'cleanliness', label: '整洁度', angle: 126 },
    { key: 'health', label: '健康', angle: 198 },
  ];

  const points = labels.map(({ key, angle }) => {
    const value = metrics[key as keyof typeof metrics] / 100;
    const radian = (angle * Math.PI) / 180;
    const x = center + maxRadius * value * Math.cos(radian);
    const y = center + maxRadius * value * Math.sin(radian);
    return { x, y, label, angle };
  });

  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map(scale => (
        <polygon
          key={scale}
          points={labels.map(({ angle }) => {
            const radian = (angle * Math.PI) / 180;
            const x = center + maxRadius * scale * Math.cos(radian);
            const y = center + maxRadius * scale * Math.sin(radian);
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="#E8D5C4"
          strokeWidth="1"
        />
      ))}
      
      {labels.map(({ angle }, i) => {
        const radian = (angle * Math.PI) / 180;
        const x2 = center + maxRadius * Math.cos(radian);
        const y2 = center + maxRadius * Math.sin(radian);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x2}
            y2={y2}
            stroke="#E8D5C4"
            strokeWidth="1"
          />
        );
      })}

      <path
        d={pathData}
        fill="rgba(255, 140, 90, 0.3)"
        stroke="#FF8C5A"
        strokeWidth="2"
      />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#FF8C5A" />
      ))}

      {labels.map(({ label, angle }, i) => {
        const radian = (angle * Math.PI) / 180;
        const labelRadius = maxRadius + 20;
        const x = center + labelRadius * Math.cos(radian);
        const y = center + labelRadius * Math.sin(radian) + 5;
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize="12"
            fill="#8B7355"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function MetricItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-item">
      <span className="metric-label">{label}</span>
      <div className="metric-bar">
        <div 
          className="metric-fill" 
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="metric-value">{value}</span>
    </div>
  );
}

export default App;
