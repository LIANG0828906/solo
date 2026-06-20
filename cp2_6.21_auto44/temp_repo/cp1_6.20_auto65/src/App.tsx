import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Plant, Reminder, SPECIES_LIST } from './types';
import { plantApi } from './api';
import PlantCard from './components/PlantCard';
import PlantForm from './components/PlantForm';
import CareTimeline from './components/CareTimeline';
import CareReminder from './components/CareReminder';
import { Plus } from './components/icons';

function HomePage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<string>('全部');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [plantsData, remindersData] = await Promise.all([
        plantApi.getAllPlants(),
        plantApi.getReminders()
      ]);
      setPlants(plantsData);
      setReminders(remindersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPlants = filter === '全部' 
    ? plants 
    : plants.filter(p => p.species === filter);

  return (
    <div className="page">
      <div className="header">
        <h1>🌿 我的花园</h1>
      </div>

      {reminders.length > 0 && (
        <div className="reminder-section">
          <h2>⏰ 待办提醒</h2>
          <div className="reminder-list">
            {reminders.map((reminder, index) => (
              <CareReminder 
                key={`${reminder.plantId}-${reminder.careType}`}
                reminder={reminder}
                style={{ animationDelay: `${index * 0.05}s` }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === '全部' ? 'active' : ''}`}
          onClick={() => setFilter('全部')}
        >
          全部
        </button>
        {SPECIES_LIST.map(species => (
          <button
            key={species}
            className={`filter-btn ${filter === species ? 'active' : ''}`}
            onClick={() => setFilter(species)}
          >
            {species}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <div className="empty-state-text">加载中...</div>
        </div>
      ) : filteredPlants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌵</div>
          <div className="empty-state-text">还没有植物，快来添加一盆吧！</div>
          <button className="btn btn-primary" onClick={() => navigate('/add')}>
            添加植物
          </button>
        </div>
      ) : (
        <div className="garden-grid">
          {filteredPlants.map((plant, index) => (
            <PlantCard 
              key={plant.id} 
              plant={plant} 
              onClick={() => navigate(`/plant/${plant.id}`)}
              style={{ animationDelay: `${index * 0.08}s` }}
            />
          ))}
        </div>
      )}

      <button 
        className="add-plant-fab"
        onClick={() => navigate('/add')}
        title="添加植物"
      >
        <Plus />
      </button>
    </div>
  );
}

function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPlant = useCallback(async () => {
    if (!id) return;
    try {
      const data = await plantApi.getPlant(id);
      setPlant(data);
    } catch (error) {
      console.error('Failed to fetch plant:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlant();
  }, [fetchPlant]);

  const handlePlantUpdate = (updatedPlant: Plant) => {
    setPlant(updatedPlant);
  };

  if (isLoading) {
    return (
      <div className="page detail-page">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <div className="empty-state-text">加载中...</div>
        </div>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="page detail-page">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <div className="empty-state">
          <div className="empty-state-icon">❓</div>
          <div className="empty-state-text">植物不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← 返回花园
      </button>

      <div className="plant-detail-header">
        <div className="plant-detail-image">
          {plant.image ? (
            <img src={plant.image} alt={plant.name} />
          ) : (
            <span className="plant-icon">🪴</span>
          )}
        </div>
        <div className="plant-detail-info">
          <div>
            <h1 className="plant-detail-name">{plant.name}</h1>
            <div className="plant-detail-tags">
              <span className="plant-detail-tag">🌿 {plant.species}</span>
              <span className="plant-detail-tag">📍 {plant.location}</span>
            </div>
          </div>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(`/edit/${plant.id}`)}
          >
            编辑
          </button>
        </div>
      </div>

      <div className="next-care-section card">
        <div style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>📅 下次照料</h3>
          <div className="next-care-items">
            <div className="next-care-item">
              <div className="next-care-icon">💧</div>
              <div className="next-care-text">
                <div className="next-care-label">浇水</div>
                <div className="next-care-date">
                  {plant.nextWaterDate 
                    ? new Date(plant.nextWaterDate).toLocaleDateString('zh-CN') 
                    : '未设置'}
                </div>
              </div>
            </div>
            <div className="next-care-item">
              <div className="next-care-icon">🌱</div>
              <div className="next-care-text">
                <div className="next-care-label">施肥</div>
                <div className="next-care-date">
                  {plant.nextFertilizeDate 
                    ? new Date(plant.nextFertilizeDate).toLocaleDateString('zh-CN') 
                    : '未设置'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-record-section card">
        <div style={{ padding: '20px' }}>
          <h3>✏️ 快速记录</h3>
          <div className="quick-record-buttons">
            {(['water', 'fertilize', 'repot', 'prune'] as const).map((type, index) => (
              <QuickRecordButton 
                key={type} 
                type={type}
                plantId={plant.id}
                onRecord={handlePlantUpdate}
                style={{ animationDelay: `${index * 0.05}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="timeline-section card">
        <div style={{ padding: '20px' }}>
          <h3>📜 照料记录</h3>
          <CareTimeline 
            events={plant.events || []} 
            plantId={plant.id}
            onEventDeleted={handlePlantUpdate}
          />
        </div>
      </div>
    </div>
  );
}

function QuickRecordButton({ 
  type, 
  plantId, 
  onRecord,
  style 
}: { 
  type: 'water' | 'fertilize' | 'repot' | 'prune';
  plantId: string;
  onRecord: (plant: Plant) => void;
  style?: React.CSSProperties;
}) {
  const typeLabels: Record<string, string> = {
    water: '浇水',
    fertilize: '施肥',
    repot: '换盆',
    prune: '修剪'
  };

  const typeIcons: Record<string, string> = {
    water: '💧',
    fertilize: '🌱',
    repot: '🪴',
    prune: '✂️'
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    try {
      const result = await plantApi.addEvent(plantId, {
        type,
        date: new Date().toISOString(),
        note: ''
      });
      onRecord(result.plant);
    } catch (error) {
      console.error('Failed to record event:', error);
    }
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <button 
      className="quick-record-btn"
      onClick={handleClick}
      style={style}
    >
      <div className="btn-icon">
        <span style={{ fontSize: '18px' }}>{typeIcons[type]}</span>
      </div>
      <span className="btn-label">{typeLabels[type]}</span>
    </button>
  );
}

function AddPlantPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data: Omit<Plant, 'id' | 'events' | 'nextWaterDate' | 'nextFertilizeDate'>) => {
    try {
      await plantApi.createPlant(data);
      navigate('/');
    } catch (error) {
      console.error('Failed to create plant:', error);
    }
  };

  return (
    <div className="page form-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      <h1 className="form-title">🌿 添加新植物</h1>
      <div className="card form-card">
        <PlantForm onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
      </div>
    </div>
  );
}

function EditPlantPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchPlant = async () => {
      try {
        const data = await plantApi.getPlant(id);
        setPlant(data);
      } catch (error) {
        console.error('Failed to fetch plant:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlant();
  }, [id]);

  const handleSubmit = async (data: Omit<Plant, 'id' | 'events' | 'nextWaterDate' | 'nextFertilizeDate'>) => {
    if (!id) return;
    try {
      await plantApi.updatePlant(id, data);
      navigate(`/plant/${id}`);
    } catch (error) {
      console.error('Failed to update plant:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="page form-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <div className="empty-state-text">加载中...</div>
        </div>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="page form-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <div className="empty-state">
          <div className="empty-state-icon">❓</div>
          <div className="empty-state-text">植物不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page form-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      <h1 className="form-title">✏️ 编辑植物</h1>
      <div className="card form-card">
        <PlantForm 
          plant={plant} 
          onSubmit={handleSubmit} 
          onCancel={() => navigate(-1)} 
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/plant/:id" element={<PlantDetailPage />} />
          <Route path="/add" element={<AddPlantPage />} />
          <Route path="/edit/:id" element={<EditPlantPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
