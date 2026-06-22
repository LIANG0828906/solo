import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePlantStore } from '../store/plantStore';
import { LeafIcon, ChevronLeftIcon } from '../components/Icons';
import { formatDate, formatCountdown } from '../utils/dateUtils';

export const PlantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { plants, addGrowthRecord, loading } = usePlantStore();
  const [recordContent, setRecordContent] = useState('');
  const [submitError, setSubmitError] = useState('');

  const plant = plants.find((p) => p.id === id);

  const handleAddRecord = async () => {
    if (!recordContent.trim() || !plant) return;

    setSubmitError('');
    const success = await addGrowthRecord(plant.id, recordContent.trim());

    if (success) {
      setRecordContent('');
    } else {
      const error = usePlantStore.getState().error;
      setSubmitError(error || '添加记录失败');
    }
  };

  const canAddRecordToday = (): boolean => {
    if (!plant || plant.growthRecords.length === 0) return true;
    const lastRecord = plant.growthRecords[0];
    const today = new Date().toISOString().split('T')[0];
    const lastRecordDate = new Date(lastRecord.date).toISOString().split('T')[0];
    return today !== lastRecordDate;
  };

  if (loading && !plant) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="page-enter">
        <Link to="/" className="back-link">
          <ChevronLeftIcon />
          返回列表
        </Link>
        <div className="empty-state">
          <p className="empty-text">植物不存在或已被删除</p>
        </div>
      </div>
    );
  }

  const { text: countdownText, isOverdue } = formatCountdown(
    plant.lastWateredDate,
    plant.waterFrequency
  );

  return (
    <div className="page-enter detail-container">
      <Link to="/" className="back-link">
        <ChevronLeftIcon />
        返回列表
      </Link>

      <div className="photo-container">
        {plant.photo ? (
          <img src={plant.photo} alt={plant.name} />
        ) : (
          <div className="leaf-placeholder">
            <LeafIcon />
          </div>
        )}
      </div>

      <div className="detail-info">
        <h1 className="detail-name">{plant.name}</h1>
        <p className="detail-category">{plant.category}</p>
        <div className="detail-meta">
          <span>💧 浇水频率：每 {plant.waterFrequency} 天</span>
          <span className={isOverdue ? 'countdown-text overdue' : ''}>
            ⏰ {countdownText}
          </span>
        </div>
      </div>

      <div className="timeline-section">
        <h2 className="timeline-title">生长记录</h2>

        {plant.growthRecords.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#999',
            }}
          >
            <p style={{ fontSize: 14 }}>还没有生长记录</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              在下方添加第一条记录吧～
            </p>
          </div>
        ) : (
          <div className="timeline">
            {plant.growthRecords.map((record) => (
              <div key={record.id} className="timeline-item">
                <div className="timeline-date">
                  {formatDate(record.date)}
                </div>
                <div className="timeline-content">{record.content}</div>
              </div>
            ))}
          </div>
        )}

        <div className="add-record-form">
          <div className="record-input-wrapper">
            <textarea
              className="record-input"
              value={recordContent}
              onChange={(e) => {
                setRecordContent(e.target.value);
                if (submitError) setSubmitError('');
              }}
              placeholder={
                canAddRecordToday()
                  ? '记录今天植物的状态变化、生长情况...'
                  : '今天已经添加过记录了，明天再来吧~'
              }
              disabled={!canAddRecordToday()}
              rows={2}
            />
            <button
              className="btn-secondary"
              onClick={handleAddRecord}
              disabled={
                !recordContent.trim() || !canAddRecordToday() || loading
              }
              style={{ alignSelf: 'flex-start' }}
            >
              添加记录
            </button>
          </div>
          {submitError && (
            <div className="form-error" style={{ marginTop: 8 }}>
              {submitError}
            </div>
          )}
          {!canAddRecordToday() && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: '#FF5722',
              }}
            >
              提示：每 24 小时只能添加一条生长记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantDetailPage;
