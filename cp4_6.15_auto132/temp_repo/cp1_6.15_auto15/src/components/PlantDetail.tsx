import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../App';
import PhotoTimeline from './PhotoTimeline';
import FloatingButton from './FloatingButton';
import UploadModal from './UploadModal';
import { formatDate, getTodayString } from '../utils/dateUtils';
import { compressImage } from '../utils/storage';
import type { Photo } from '../types';
import './PlantDetail.css';

interface PlantDetailProps {
  plantId: string;
}

const healthColors: Record<string, string> = {
  healthy: 'var(--color-healthy)',
  normal: 'var(--color-normal)',
  attention: 'var(--color-attention)'
};

const healthLabels: Record<string, string> = {
  healthy: '健康',
  normal: '一般',
  attention: '需关注'
};

const PlantDetail: React.FC<PlantDetailProps> = ({ plantId }) => {
  const { plants, getPlantPhotos, getPlantAge, navigate, addPhoto } = useAppContext();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const plant = plants.find(p => p.id === plantId);
  const photos = getPlantPhotos(plantId);

  useEffect(() => {
    if (timelineRef.current && photos.length > 0) {
      setTimeout(() => {
        timelineRef.current?.scrollTo({
          left: timelineRef.current.scrollWidth,
          behavior: 'smooth'
        });
      }, 300);
    }
  }, [photos.length]);

  const handleAddPhoto = useCallback(async () => {
    setShowUploadModal(true);
  }, []);

  const handleUpload = useCallback(async (file: File, note: string, mood: string) => {
    setUploadProgress(0);
    setShowCheckmark(false);
    
    try {
      for (let i = 0; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(i);
      }
      
      const imageUrl = await compressImage(file);
      
      setUploadProgress(100);
      setShowCheckmark(true);
      
      const newPhoto: Omit<Photo, 'id' | 'createdAt'> = {
        plantId,
        imageUrl,
        date: new Date().toISOString(),
        note,
        mood
      };
      
      addPhoto(newPhoto);
      
      setTimeout(() => {
        setUploadProgress(null);
        setShowCheckmark(false);
        setShowUploadModal(false);
      }, 1500);
      
    } catch (error) {
      console.error('上传失败:', error);
      setUploadProgress(null);
      alert('上传失败，请重试');
    }
  }, [plantId, addPhoto]);

  if (!plant) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🌿</div>
          <p className="empty-text">找不到该植物</p>
          <button 
            className="pill-btn pill-btn-primary"
            onClick={() => navigate('home')}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container detail-page">
      <header className="detail-header">
        <button 
          className="back-btn"
          onClick={() => navigate('home')}
        >
          ← 返回
        </button>
        {plant.isFavorite && <span className="detail-favorite">⭐</span>}
      </header>

      <div className="plant-info glass-card">
        <div className="info-main">
          <h1 className="plant-title handwriting">{plant.name}</h1>
          <p className="plant-subtitle">{plant.variety}</p>
        </div>
        <div className="info-stats">
          <div className="stat-item">
            <span className="stat-label">种植时长</span>
            <span className="stat-value">{getPlantAge(plant.plantDate)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">照片记录</span>
            <span className="stat-value">{photos.length} 张</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">健康状态</span>
            <span 
              className="stat-value"
              style={{ color: healthColors[plant.healthStatus] }}
            >
              {healthLabels[plant.healthStatus]}
            </span>
          </div>
        </div>
      </div>

      <div className="timeline-section">
        <div className="timeline-header">
          <h2 className="section-title handwriting">📸 成长记录</h2>
          <span className="timeline-date">{formatDate(getTodayString())}</span>
        </div>
        <PhotoTimeline ref={timelineRef} photos={photos} />
      </div>

      {photos.length === 0 && (
        <div className="empty-photos">
          <div className="empty-icon">📷</div>
          <p className="empty-text">还没有照片记录，点击右下角按钮添加第一张吧~</p>
        </div>
      )}

      <FloatingButton onClick={handleAddPhoto} />

      {showUploadModal && (
        <UploadModal
          onClose={() => {
            if (uploadProgress === null) {
              setShowUploadModal(false);
            }
          }}
          onUpload={handleUpload}
          uploadProgress={uploadProgress}
          showCheckmark={showCheckmark}
        />
      )}
    </div>
  );
};

export default PlantDetail;
