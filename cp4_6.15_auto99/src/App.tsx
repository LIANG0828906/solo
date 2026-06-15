import { useState, useEffect, useCallback } from 'react';
import { PlantCard } from './components/PlantCard';
import { PlantDetail } from './components/PlantDetail';
import { PlantForm } from './components/PlantForm';
import { usePlantStore } from './store/usePlantStore';
import { getWeather, getWateringCoefficient, getWateringSuitability } from './services/weatherService';
import { 
  startReminderPolling, 
  stopReminderPolling, 
  getWateringProgress 
} from './services/reminderService';
import type { WeatherData, WateringReminder, RecordType, WateringFrequency, LightRequirement } from './types/plant';
import styles from './App.module.css';

function App() {
  const {
    plants,
    currentView,
    selectedPlantId,
    showAddForm,
    editingPlant,
    wateringReminders,
    addPlant,
    updatePlant,
    waterPlant,
    addGrowthRecord,
    addPhoto,
    setCurrentView,
    setShowAddForm,
    setEditingPlant,
    addWateringReminder,
    removeWateringReminder,
    loadFromStorage,
  } = usePlantStore();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherCoefficient, setWeatherCoefficient] = useState(1.0);
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; icon: string }[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const selectedPlant = plants.find((p) => p.id === selectedPlantId) || null;

  const showToast = useCallback((type: 'success' | 'error' | 'info', icon: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  useEffect(() => {
    loadFromStorage();
    setIsLoaded(true);
  }, [loadFromStorage]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const weatherData = await getWeather('北京');
        setWeather(weatherData);
        setWeatherCoefficient(getWateringCoefficient(weatherData));
      } catch {
        console.error('Failed to fetch weather');
      }
    };

    if (isLoaded) {
      fetchWeather();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded && plants.length > 0) {
      startReminderPolling(plants, weatherCoefficient, (reminders: WateringReminder[]) => {
        reminders.forEach((reminder) => {
          addWateringReminder(reminder);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('植物浇水提醒', {
              body: `${reminder.plantName} 需要浇水了！`,
              icon: '💧',
            });
          }
        });
      });
    }

    return () => {
      stopReminderPolling();
    };
  }, [isLoaded, plants, weatherCoefficient, addWateringReminder]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleAddPlant = (data: {
    name: string;
    species?: string;
    wateringFrequency: WateringFrequency;
    customDays?: number;
    lightRequirement: LightRequirement;
    photoUrl?: string;
  }) => {
    addPlant(data);
    showToast('success', '✅');
  };

  const handleUpdatePlant = (data: {
    name: string;
    species?: string;
    wateringFrequency: WateringFrequency;
    customDays?: number;
    lightRequirement: LightRequirement;
    photoUrl?: string;
  }) => {
    if (editingPlant) {
      updatePlant(editingPlant.id, data);
      showToast('success', '✅');
    }
  };

  const handleWaterPlant = useCallback(
    (plantId: string) => {
      waterPlant(plantId);
      removeWateringReminder(plantId);
      showToast('success', '💧');
    },
    [waterPlant, removeWateringReminder, showToast]
  );

  const handleReminderClick = (reminder: WateringReminder) => {
    handleWaterPlant(reminder.plantId);
  };

  const handleAddRecord = (plantId: string, type: RecordType, note?: string) => {
    addGrowthRecord(plantId, { type, note });
    showToast('success', '✅');
  };

  const handleAddPhoto = (plantId: string, url: string, note?: string) => {
    addPhoto(plantId, { url, note });
    showToast('success', '📷');
  };

  const pendingWaterCount = plants.filter(
    (p) => getWateringProgress(p, weatherCoefficient) >= 100
  ).length;

  const weatherIcon = weather
    ? { sunny: '☀️', cloudy: '⛅', rainy: '🌧️', snowy: '❄️' }[weather.condition]
    : '☀️';

  const suitability = weather ? getWateringSuitability(weather) : 'moderate';
  const suitabilityFace = { good: '😊', moderate: '😐', bad: '😟' }[suitability];
  const suitabilityText = { good: '适宜浇水', moderate: '一般', bad: '需勤浇水' }[suitability];

  if (!isLoaded) {
    return <div className={styles.app}>加载中...</div>;
  }

  return (
    <div className={styles.app}>
      {currentView === 'home' ? (
        <div className="page-transition">
          <div className={styles.banner}>
            <div className={styles.bannerContent}>
              <div className={styles.weatherSection}>
                <span className={styles.weatherIcon}>{weatherIcon}</span>
                <div className={styles.weatherInfo}>
                  <span className={styles.weatherCity}>{weather?.city || '北京'}</span>
                  <span className={styles.weatherTemp}>
                    {weather ? `${weather.temperature}°C` : '--°C'}
                  </span>
                </div>
                <div className={styles.suitability}>
                  <span className={styles.suitabilityFace}>{suitabilityFace}</span>
                  <span className={styles.suitabilityText}>{suitabilityText}</span>
                </div>
              </div>

              <div className={styles.statsSection}>
                <div className={styles.statItem}>
                  <div className={styles.statNumber}>{plants.length}</div>
                  <div className={styles.statLabel}>总植物</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statNumber}>{pendingWaterCount}</div>
                  <div className={styles.statLabel}>待浇水</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.mainContent}>
            <h2 className={styles.sectionTitle}>我的植物</h2>

            {plants.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🌱</div>
                <div className={styles.emptyText}>还没有添加植物</div>
                <div className={styles.emptyHint}>点击右下角按钮添加你的第一株植物</div>
              </div>
            ) : (
              <div className={styles.plantGrid}>
                {plants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    weatherCoefficient={weatherCoefficient}
                    onClick={() => setCurrentView('detail', plant.id)}
                    onWater={() => handleWaterPlant(plant.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            className={styles.fab}
            onClick={() => setShowAddForm(true)}
            aria-label="添加植物"
          >
            +
          </button>
        </div>
      ) : (
        selectedPlant && (
          <PlantDetail
            key={selectedPlant.id}
            plant={selectedPlant}
            onBack={() => setCurrentView('home')}
            onWater={() => handleWaterPlant(selectedPlant.id)}
            onEdit={() => setEditingPlant(selectedPlant)}
            onAddPhoto={(url, note) => handleAddPhoto(selectedPlant.id, url, note)}
            onAddRecord={(type, note) => handleAddRecord(selectedPlant.id, type, note)}
          />
        )
      )}

      {showAddForm && (
        <PlantForm
          plant={editingPlant}
          onSubmit={editingPlant ? handleUpdatePlant : handleAddPlant}
          onCancel={() => {
            setShowAddForm(false);
            setEditingPlant(null);
          }}
        />
      )}

      {wateringReminders.length > 0 && (
        <div 
          className={styles.reminderBubble}
          onClick={() => handleReminderClick(wateringReminders[0])}
        >
          <div className={styles.reminderTitle}>
            💧 浇水提醒
          </div>
          <div className={styles.reminderText}>
            {wateringReminders[0].plantName} 需要浇水了
            {wateringReminders.length > 1 && ` （还有${wateringReminders.length - 1}株）`}
          </div>
          <div className={styles.reminderAction}>点击标记已浇水</div>
        </div>
      )}

      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles.toastSuccess}`}
          >
            {toast.icon}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
