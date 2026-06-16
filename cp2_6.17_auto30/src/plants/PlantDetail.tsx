import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useStore } from '../store';
import { PlantForm } from './PlantForm';
import { CARE_TYPE_LABELS, CARE_TYPE_COLORS } from '../types';
import type { CareType, Plant } from '../types';
import { isSameDay, formatDate } from '../utils/dateUtils';
import './PlantDetail.css';

export function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const plants = useStore(state => state.plants);
  const careRecords = useStore(state => state.careRecords);
  const updatePlant = useStore(state => state.updatePlant);
  const deletePlant = useStore(state => state.deletePlant);
  const addCareRecord = useStore(state => state.addCareRecord);
  const refreshWeather = useStore(state => state.refreshWeather);

  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const plant = useMemo(() => plants.find(p => p.id === id), [plants, id]);
  const plantRecords = useMemo(
    () => careRecords.filter(r => r.plantId === id),
    [careRecords, id]
  );

  if (!plant) {
    return (
      <div className="detail-not-found">
        <p>未找到该植物</p>
        <button onClick={() => navigate('/plants')}>返回列表</button>
      </div>
    );
  }

  const tileContent = ({ date }: { date: Date }) => {
    const dayRecords = plantRecords.filter(r => isSameDay(r.date, date));
    if (dayRecords.length === 0) return null;
    return (
      <div className="calendar-dots">
        {dayRecords.map((r, idx) => (
          <span
            key={idx}
            className="care-dot"
            style={{ backgroundColor: CARE_TYPE_COLORS[r.type] }}
            title={CARE_TYPE_LABELS[r.type]}
          />
        ))}
      </div>
    );
  };

  const handleDateChange = (value: unknown) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  const selectedRecords = selectedDate
    ? plantRecords.filter(r => isSameDay(r.date, selectedDate))
    : [];

  const handleAddCare = async (type: CareType) => {
    addCareRecord(plant.id, type);
    refreshWeather();
  };

  const handleUpdatePlant = (data: Omit<Plant, 'id' | 'isFavorite'>) => {
    updatePlant(plant.id, data);
    setShowEditForm(false);
  };

  const handleDelete = () => {
    if (confirm('确定删除这株植物吗？')) {
      deletePlant(plant.id);
      navigate('/plants');
    }
  };

  return (
    <div className="plant-detail-page">
      <button className="back-btn" onClick={() => navigate('/plants')}>
        ← 返回列表
      </button>

      <div className="detail-header">
        <div className="detail-photo">
          {plant.photoUrl ? (
            <img src={plant.photoUrl} alt={plant.name} />
          ) : (
            <div className="no-photo-large">
              <span>🌵</span>
              <p>无图片</p>
            </div>
          )}
        </div>
        <div className="detail-info">
          <div className="detail-title-row">
            <h1 className="detail-name">
              {plant.name}
              {plant.isFavorite && <span className="fav-star">⭐</span>}
            </h1>
            <div className="detail-actions">
              <button className="action-btn edit-btn" onClick={() => setShowEditForm(!showEditForm)}>
                {showEditForm ? '取消编辑' : '✏️ 编辑'}
              </button>
              <button className="action-btn delete-btn" onClick={handleDelete}>
                🗑️ 删除
              </button>
            </div>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">品种</span>
              <span className="info-value">{plant.species}</span>
            </div>
            <div className="info-item">
              <span className="info-label">位置</span>
              <span className="info-value">{plant.location || '未设置'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">购买日期</span>
              <span className="info-value">{plant.purchaseDate}</span>
            </div>
            <div className="info-item">
              <span className="info-label">光照偏好</span>
              <span className="info-value">{plant.lightPreference}</span>
            </div>
            <div className="info-item">
              <span className="info-label">浇水间隔</span>
              <span className="info-value">{plant.wateringInterval} 天</span>
            </div>
            <div className="info-item">
              <span className="info-label">上次浇水</span>
              <span className="info-value">{plant.lastWateringDate || '暂无记录'}</span>
            </div>
          </div>
        </div>
      </div>

      {showEditForm && (
        <div className="edit-form-section">
          <PlantForm
            plant={plant}
            onSubmit={handleUpdatePlant}
            onCancel={() => setShowEditForm(false)}
          />
        </div>
      )}

      <div className="detail-section">
        <h2 className="section-title">📋 快捷养护操作</h2>
        <div className="care-actions">
          <button className="care-btn watering" onClick={() => handleAddCare('watering')}>
            💧 记录浇水
          </button>
          <button className="care-btn fertilizing" onClick={() => handleAddCare('fertilizing')}>
            🌱 记录施肥
          </button>
          <button className="care-btn repotting" onClick={() => handleAddCare('repotting')}>
            🪴 记录换盆
          </button>
          <button className="care-btn soilLoosening" onClick={() => handleAddCare('soilLoosening')}>
            🪨 记录翻土
          </button>
        </div>
      </div>

      <div className="detail-section two-col">
        <div>
          <h2 className="section-title">📅 养护日历</h2>
          <Calendar
            onChange={handleDateChange}
            value={selectedDate || new Date()}
            tileContent={tileContent}
            className="plant-calendar"
          />
        </div>
        <div>
          <h2 className="section-title">
            📝 当日记录
            {selectedDate && <span className="date-subtitle"> {formatDate(selectedDate)}</span>}
          </h2>
          <div className="records-list">
            {selectedRecords.length === 0 ? (
              <p className="no-records">当日暂无养护记录</p>
            ) : (
              selectedRecords.map(record => (
                <div
                  key={record.id}
                  className="record-item"
                  style={{ borderLeftColor: CARE_TYPE_COLORS[record.type] }}
                >
                  <span
                    className="record-type-badge"
                    style={{ backgroundColor: CARE_TYPE_COLORS[record.type] }}
                  >
                    {CARE_TYPE_LABELS[record.type]}
                  </span>
                  <span className="record-date">{record.date}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
