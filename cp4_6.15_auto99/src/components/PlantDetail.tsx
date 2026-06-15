import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Plant, GrowthRecord, RecordType } from '@/types/plant';
import styles from './PlantDetail.module.css';

interface PlantDetailProps {
  plant: Plant;
  onBack: () => void;
  onWater: () => void;
  onEdit: () => void;
  onAddPhoto: (url: string, note?: string) => void;
  onAddRecord: (type: RecordType, note?: string) => void;
}

const recordIcons: Record<RecordType, string> = {
  water: '💧',
  repot: '🪴',
  fertilize: '🌱',
  photo: '📷',
};

const recordLabels: Record<RecordType, string> = {
  water: '浇水',
  repot: '换盆',
  fertilize: '施肥',
  photo: '照片',
};

const frequencyLabels: Record<Plant['wateringFrequency'], string> = {
  daily: '每天',
  every2days: '每2天',
  weekly: '每周',
  custom: '自定义',
};

const lightLabels: Record<Plant['lightRequirement'], string> = {
  sunny: '喜阳 ☀️',
  indirect: '散射光 ⛅',
  shade: '喜阴 🌙',
};

export function PlantDetail({
  plant,
  onBack,
  onWater,
  onEdit,
  onAddPhoto,
  onAddRecord,
}: PlantDetailProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showNoteInput, setShowNoteInput] = useState<RecordType | null>(null);
  const [noteText, setNoteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const firstPhoto = plant.photos[0];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (noteText) {
          onAddPhoto(url, noteText);
          setNoteText('');
        } else {
          onAddPhoto(url);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddRecord = (type: RecordType) => {
    if (showNoteInput === type) {
      if (noteText.trim()) {
        onAddRecord(type, noteText.trim());
        setNoteText('');
      }
      setShowNoteInput(null);
    } else {
      setShowNoteInput(type);
      setNoteText('');
    }
  };

  const confirmAddRecord = () => {
    if (showNoteInput && noteText.trim()) {
      onAddRecord(showNoteInput, noteText.trim());
      setNoteText('');
      setShowNoteInput(null);
    }
  };

  const waterRecords = plant.growthRecords.filter((r) => r.type === 'water');

  return (
    <div className={`${styles.container} page-transition`}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          ← 返回
        </button>
        
        <div className={styles.plantInfo}>
          <div className={styles.plantImage}>
            {firstPhoto ? (
              <img src={firstPhoto.url} alt={plant.name} />
            ) : (
              '🪴'
            )}
          </div>
          
          <div className={styles.plantMeta}>
            <h1 className={styles.plantName}>{plant.name}</h1>
            {plant.species && (
              <p className={styles.plantSpecies}>{plant.species}</p>
            )}
            <div className={styles.plantStats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>浇水频率</span>
                <span className={styles.statValue}>
                  {frequencyLabels[plant.wateringFrequency]}
                  {plant.wateringFrequency === 'custom' && plant.customDays
                    ? ` (${plant.customDays}天)`
                    : ''}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>光照需求</span>
                <span className={styles.statValue}>
                  {lightLabels[plant.lightRequirement]}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>浇水次数</span>
                <span className={styles.statValue}>{waterRecords.length}次</span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={`${styles.actionButton} ${styles.waterAction}`} onClick={onWater}>
              💧 浇水
            </button>
            <button className={`${styles.actionButton} ${styles.editAction}`} onClick={onEdit}>
              ✏️ 编辑
            </button>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📷 照片画廊</h2>
          <div className={styles.galleryGrid}>
            {plant.photos.map((photo) => (
              <div
                key={photo.id}
                className={styles.galleryItem}
                onClick={() => setSelectedPhoto(photo.url)}
              >
                <img src={photo.url} alt={photo.note || '植物照片'} />
              </div>
            ))}
            <label className={styles.galleryAdd}>
              <span style={{ fontSize: '24px' }}>+</span>
              <span>添加照片</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🌱 成长记录</h2>
          
          <div className={styles.timelineActions}>
            {(['water', 'fertilize', 'repot'] as RecordType[]).map((type) => (
              <button
                key={type}
                className={styles.timelineActionBtn}
                onClick={() => handleAddRecord(type)}
              >
                {recordIcons[type]} 添加{recordLabels[type]}记录
              </button>
            ))}
          </div>

          {showNoteInput && (
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="添加备注..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                }}
                onKeyPress={(e) => e.key === 'Enter' && confirmAddRecord()}
                autoFocus
              />
              <button
                onClick={confirmAddRecord}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                确认
              </button>
            </div>
          )}

          <div className={styles.timeline}>
            {plant.growthRecords.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px' }}>
                暂无成长记录
              </p>
            ) : (
              plant.growthRecords.map((record: GrowthRecord) => (
                <div key={record.id} className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>
                    {recordIcons[record.type]}
                  </div>
                  <div className={styles.timelineDate}>
                    {format(new Date(record.date), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
                  </div>
                  <div className={styles.timelineContent}>
                    {record.note || recordLabels[record.type]}
                  </div>
                  {record.photoUrl && (
                    <img
                      src={record.photoUrl}
                      alt="成长照片"
                      className={styles.timelinePhoto}
                      onClick={() => setSelectedPhoto(record.photoUrl!)}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {selectedPhoto && (
        <div className={styles.photoModal} onClick={() => setSelectedPhoto(null)}>
          <button className={styles.closeModal} onClick={() => setSelectedPhoto(null)}>
            ×
          </button>
          <img src={selectedPhoto} alt="放大照片" />
        </div>
      )}
    </div>
  );
}
