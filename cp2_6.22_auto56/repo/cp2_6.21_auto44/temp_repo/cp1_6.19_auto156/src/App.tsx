import React, { useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AppState, AppAction, Plant, GrowthLog, WaterRecord, Alert } from '@/types';
import {
  generateId,
  generateMockGrowthLogs,
  generateMockWaterRecords,
  detectPestAndDisease,
  generateWaterNotification,
  getCategories,
  calculateWaterStatus,
} from '@/utils/plantHelper';
import { Navbar } from '@/components/Navbar';
import { PlantCard } from '@/components/PlantCard';
import { PlantDetail } from '@/components/PlantDetail';
import { AlertPanel } from '@/components/AlertPanel';

const initialState: AppState = {
  plants: [],
  selectedPlantId: null,
  alerts: [],
  filterCategory: '全部',
  mobileMenuOpen: false,
  notificationIndex: 0,
};

const createMockPlants = (): Plant[] => {
  const categories = ['蔬菜', '花卉', '香草', '果树'];
  const names = [
    { name: '小番茄', variety: '圣女果', category: '蔬菜', emoji: '🍅' },
    { name: '薰衣草', variety: '英国薰衣草', category: '花卉', emoji: '💜' },
    { name: '罗勒', variety: '甜罗勒', category: '香草', emoji: '🌿' },
    { name: '草莓', variety: '红颜', category: '果树', emoji: '🍓' },
    { name: '黄瓜', variety: '水果黄瓜', category: '蔬菜', emoji: '🥒' },
    { name: '薄荷', variety: '留兰香', category: '香草', emoji: '🍃' },
  ];

  const plants: Plant[] = names.map((item, index) => {
    const plantDate = new Date();
    plantDate.setDate(plantDate.getDate() - (30 + Math.floor(Math.random() * 60)));

    const growthLogs = generateMockGrowthLogs(30);
    const waterRecords = generateMockWaterRecords(5);

    if (index === 3) {
      for (let i = growthLogs.length - 3; i < growthLogs.length; i++) {
        growthLogs[i].soilMoisture = Math.floor(Math.random() * 20) + 10;
      }
    }

    if (index === 1) {
      const lastLog = growthLogs[growthLogs.length - 1];
      if (lastLog) {
        lastLog.leafColor = 'yellow';
      }
    }

    if (index === 4) {
      const lastLog = growthLogs[growthLogs.length - 1];
      if (lastLog) {
        lastLog.markedAbnormal = true;
      }
    }

    const plant: Plant = {
      id: generateId(),
      name: item.name,
      variety: item.variety,
      plantDate: plantDate.toISOString().split('T')[0],
      location: `A-${index + 1}`,
      waterPreference: index % 3 === 0 ? 'low' : index % 3 === 1 ? 'medium' : 'high',
      category: item.category,
      growthLogs,
      waterRecords,
      alerts: [],
    };

    return plant;
  });

  return plants;
};

const loadFromStorage = (): Partial<AppState> => {
  try {
    const saved = localStorage.getItem('gardenAppState');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return {};
};

const saveToStorage = (state: AppState) => {
  try {
    const { plants, alerts, filterCategory } = state;
    localStorage.setItem('gardenAppState', JSON.stringify({ plants, alerts, filterCategory }));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOAD_STATE': {
      const savedState = action.payload;
      let plants = savedState.plants || [];
      if (plants.length === 0) {
        plants = createMockPlants();
      }
      return {
        ...state,
        plants,
        alerts: savedState.alerts || [],
        filterCategory: savedState.filterCategory || '全部',
      };
    }
    case 'ADD_PLANT': {
      const newPlants = [...state.plants, action.payload];
      const newAlerts = detectPestAndDisease(action.payload);
      return {
        ...state,
        plants: newPlants,
        alerts: [...state.alerts, ...newAlerts],
      };
    }
    case 'UPDATE_PLANT': {
      const newPlants = state.plants.map((p) =>
        p.id === action.payload.id ? action.payload : p
      );
      return { ...state, plants: newPlants };
    }
    case 'DELETE_PLANT': {
      return {
        ...state,
        plants: state.plants.filter((p) => p.id !== action.payload),
        selectedPlantId: state.selectedPlantId === action.payload ? null : state.selectedPlantId,
        alerts: state.alerts.filter((a) => a.plantId !== action.payload),
      };
    }
    case 'SELECT_PLANT': {
      return { ...state, selectedPlantId: action.payload };
    }
    case 'ADD_GROWTH_LOG': {
      const newPlants = state.plants.map((p) => {
        if (p.id === action.payload.plantId) {
          const updatedPlant = {
            ...p,
            growthLogs: [...p.growthLogs, action.payload.log],
          };
          return updatedPlant;
        }
        return p;
      });

      const targetPlant = newPlants.find((p) => p.id === action.payload.plantId);
      const newAlerts = targetPlant ? detectPestAndDisease(targetPlant) : [];

      return {
        ...state,
        plants: newPlants,
        alerts: [...state.alerts, ...newAlerts],
      };
    }
    case 'ADD_WATER_RECORD': {
      const newPlants = state.plants.map((p) => {
        if (p.id === action.payload.plantId) {
          const updatedRecords = [action.payload.record, ...p.waterRecords].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          return { ...p, waterRecords: updatedRecords };
        }
        return p;
      });
      return { ...state, plants: newPlants };
    }
    case 'SET_FILTER': {
      return { ...state, filterCategory: action.payload };
    }
    case 'TOGGLE_MOBILE_MENU': {
      return { ...state, mobileMenuOpen: !state.mobileMenuOpen };
    }
    case 'RESOLVE_ALERT': {
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.payload ? { ...a, resolved: true } : a
        ),
      };
    }
    case 'ADD_ALERT': {
      return { ...state, alerts: [...state.alerts, action.payload] };
    }
    case 'NEXT_NOTIFICATION': {
      return { ...state, notificationIndex: state.notificationIndex + 1 };
    }
    default:
      return state;
  }
};

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const [newPlant, setNewPlant] = useState({
    name: '',
    variety: '',
    plantDate: new Date().toISOString().split('T')[0],
    location: '',
    waterPreference: 'medium' as Plant['waterPreference'],
    category: '蔬菜',
  });

  useEffect(() => {
    const savedState = loadFromStorage();
    dispatch({ type: 'LOAD_STATE', payload: savedState });
  }, []);

  useEffect(() => {
    if (state.plants.length > 0) {
      saveToStorage(state);
    }
  }, [state.plants, state.alerts, state.filterCategory]);

  const notifications = useMemo(() => {
    const notes: string[] = [];
    state.plants.forEach((plant) => {
      const note = generateWaterNotification(plant);
      if (note) {
        notes.push(note);
      }
    });
    return notes;
  }, [state.plants]);

  useEffect(() => {
    if (notifications.length === 0) return;

    const interval = setInterval(() => {
      setFadeClass('fade-out');
      setTimeout(() => {
        dispatch({ type: 'NEXT_NOTIFICATION' });
        setFadeClass('fade-in');
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [notifications.length]);

  const currentNotification = useMemo(() => {
    if (notifications.length === 0) return '';
    return notifications[state.notificationIndex % notifications.length];
  }, [notifications, state.notificationIndex]);

  const selectedPlant = useMemo(
    () => state.plants.find((p) => p.id === state.selectedPlantId),
    [state.plants, state.selectedPlantId]
  );

  const filteredPlants = useMemo(() => {
    if (state.filterCategory === '全部') return state.plants;
    return state.plants.filter((p) => p.category === state.filterCategory);
  }, [state.plants, state.filterCategory]);

  const plantsWithAlertStatus = useMemo(() => {
    return state.plants.map((plant) => {
      const plantAlerts = state.alerts.filter(
        (a) => a.plantId === plant.id && !a.resolved
      );
      return { ...plant, alerts: plantAlerts };
    });
  }, [state.plants, state.alerts]);

  const handleAddPlant = useCallback(() => {
    if (!newPlant.name || !newPlant.variety || !newPlant.location) {
      alert('请填写完整信息');
      return;
    }

    const plant: Plant = {
      id: generateId(),
      ...newPlant,
      growthLogs: [],
      waterRecords: [],
      alerts: [],
    };

    dispatch({ type: 'ADD_PLANT', payload: plant });
    setShowAddModal(false);
    setNewPlant({
      name: '',
      variety: '',
      plantDate: new Date().toISOString().split('T')[0],
      location: '',
      waterPreference: 'medium',
      category: '蔬菜',
    });
  }, [newPlant]);

  const handleUpdatePlant = useCallback((plant: Plant) => {
    dispatch({ type: 'UPDATE_PLANT', payload: plant });
  }, []);

  const handleDeletePlant = useCallback((plantId: string) => {
    dispatch({ type: 'DELETE_PLANT', payload: plantId });
  }, []);

  const handleAddGrowthLog = useCallback((plantId: string, log: GrowthLog) => {
    dispatch({ type: 'ADD_GROWTH_LOG', payload: { plantId, log } });
  }, []);

  const handleAddWaterRecord = useCallback((plantId: string, record: WaterRecord) => {
    dispatch({ type: 'ADD_WATER_RECORD', payload: { plantId, record } });
  }, []);

  const handleResolveAlert = useCallback((alertId: string) => {
    dispatch({ type: 'RESOLVE_ALERT', payload: alertId });
  }, []);

  const categories = getCategories();

  return (
    <div className="app-container">
      <Navbar
        mobileMenuOpen={state.mobileMenuOpen}
        onToggleMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
      />

      {notifications.length > 0 && (
        <div className={`notification-bar ${fadeClass}`} key={state.notificationIndex}>
          🌿 {currentNotification}
        </div>
      )}

      <div className="main-layout">
        {(state.mobileMenuOpen || window.innerWidth >= 768) && (
          <motion.div
            className="left-sidebar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="glass-panel">
              <h3 className="section-title">🌿 植物分类</h3>
              {categories.map((cat) => (
                <div
                  key={cat}
                  className={`filter-item ${state.filterCategory === cat ? 'active' : ''}`}
                  onClick={() => dispatch({ type: 'SET_FILTER', payload: cat })}
                >
                  {cat}
                </div>
              ))}
            </div>

            <AlertPanel
              alerts={state.alerts}
              plants={state.plants}
              onResolve={handleResolveAlert}
            />
          </motion.div>
        )}

        <div className="main-content">
          {filteredPlants.length > 0 ? (
            <div className="plant-grid">
              {filteredPlants.map((plant, index) => {
                const plantWithAlerts = plantsWithAlertStatus.find((p) => p.id === plant.id)!;
                return (
                  <PlantCard
                    key={plant.id}
                    plant={plantWithAlerts}
                    isSelected={state.selectedPlantId === plant.id}
                    onClick={() => dispatch({ type: 'SELECT_PLANT', payload: plant.id })}
                    index={index}
                  />
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🌱</div>
              <div>暂无植物，点击右下角按钮添加第一株植物吧！</div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedPlant && (
            <PlantDetail
              key={selectedPlant.id}
              plant={selectedPlant}
              onUpdatePlant={handleUpdatePlant}
              onAddGrowthLog={handleAddGrowthLog}
              onAddWaterRecord={handleAddWaterRecord}
              onDeletePlant={handleDeletePlant}
            />
          )}
        </AnimatePresence>
      </div>

      <button className="add-plant-btn" onClick={() => setShowAddModal(true)}>
        +
      </button>

      <AnimatePresence>
        {showAddModal && (
          <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
            <motion.div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <h2 className="modal-title">🌱 添加新植物</h2>
              <div className="form-group">
                <label className="form-label">名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPlant.name}
                  onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
                  placeholder="例如：小番茄"
                />
              </div>
              <div className="form-group">
                <label className="form-label">品种</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPlant.variety}
                  onChange={(e) => setNewPlant({ ...newPlant, variety: e.target.value })}
                  placeholder="例如：圣女果"
                />
              </div>
              <div className="form-group">
                <label className="form-label">种植日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={newPlant.plantDate}
                  onChange={(e) => setNewPlant({ ...newPlant, plantDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">位置编号</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPlant.location}
                  onChange={(e) => setNewPlant({ ...newPlant, location: e.target.value })}
                  placeholder="例如：A-1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">分类</label>
                <select
                  className="form-select"
                  value={newPlant.category}
                  onChange={(e) => setNewPlant({ ...newPlant, category: e.target.value })}
                >
                  <option value="蔬菜">蔬菜</option>
                  <option value="花卉">花卉</option>
                  <option value="香草">香草</option>
                  <option value="果树">果树</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">浇水偏好</label>
                <select
                  className="form-select"
                  value={newPlant.waterPreference}
                  onChange={(e) =>
                    setNewPlant({ ...newPlant, waterPreference: e.target.value as Plant['waterPreference'] })
                  }
                >
                  <option value="low">低水分（耐旱）</option>
                  <option value="medium">中等水分</option>
                  <option value="high">高水分（喜湿）</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleAddPlant}>
                  添加
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
