import React, { useEffect, useState } from 'react';
import { usePlantStore } from '../store/plantStore';
import { PlantCard } from '../components/PlantCard';
import { AddPlantModal } from '../components/AddPlantModal';
import { EmptyGardenIcon } from '../components/Icons';

export const PlantListPage: React.FC = () => {
  const { plants, loading, fetchPlants, fetchTodayReminders, todayReminder } =
    usePlantStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReminderDetail, setShowReminderDetail] = useState(false);

  useEffect(() => {
    void fetchPlants();
    void fetchTodayReminders();

    const interval = setInterval(() => {
      void fetchTodayReminders();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchPlants, fetchTodayReminders]);

  return (
    <div className="page-enter">
      {todayReminder && todayReminder.count > 0 && (
        <div className="reminder-banner">
          <span className="reminder-text">
            今日待办：有 {todayReminder.count} 棵植物需要浇水
          </span>
          <span
            className="reminder-link"
            onClick={() => setShowReminderDetail(!showReminderDetail)}
          >
            {showReminderDetail ? '收起详情' : '查看详情'}
          </span>
        </div>
      )}

      {showReminderDetail && todayReminder && todayReminder.count > 0 && (
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <h4
            style={{
              marginBottom: 12,
              color: '#2E7D32',
              fontSize: 16,
            }}
          >
            需要浇水的植物：
          </h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {todayReminder.plants.map((p) => (
              <li
                key={p.id}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#333' }}>
                  🌱 {p.name}（{p.category}）
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">我的植物</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + 添加植物
        </button>
      </div>

      {loading && plants.length === 0 ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : plants.length === 0 ? (
        <div className="empty-state">
          <EmptyGardenIcon />
          <p className="empty-text">花园里还没有植物</p>
          <p className="empty-hint">点击右上角「添加植物」开始记录吧</p>
        </div>
      ) : (
        <div className="plant-grid">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}

      <AddPlantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default PlantListPage;
