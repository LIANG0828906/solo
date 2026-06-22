import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlantStore } from './store';
import { Timeline } from './Timeline';
import { compressImage, RECORD_META, getDaysAlive, formatDateLabel } from './utils';
import type { RecordType } from './types';
import { format } from 'date-fns';

const RECORD_TYPES: RecordType[] = ['water', 'fertilize', 'prune', 'repot', 'photo'];

const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplay(0);
    startRef.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="animated-number">{display}</span>;
};

export const PlantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const plant = usePlantStore(s => s.plants.find(p => p.id === id));
  const records = usePlantStore(s => s.getRecordsByPlantId(id || ''));
  const addRecord = usePlantStore(s => s.addRecord);
  const deleteRecord = usePlantStore(s => s.deleteRecord);
  const deletePlant = usePlantStore(s => s.deletePlant);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [recordType, setRecordType] = useState<RecordType>('water');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const stats = useMemo(() => {
    if (!plant) return { waterCount: 0, lastFertilize: '', daysAlive: 0 };
    const waterRecords = records.filter(r => r.type === 'water');
    const fertilizeRecords = records.filter(r => r.type === 'fertilize').sort((a, b) => b.date - a.date);
    return {
      waterCount: waterRecords.length,
      lastFertilize: fertilizeRecords[0] ? formatDateLabel(fertilizeRecords[0].date) : '尚无记录',
      daysAlive: getDaysAlive(plant.createdAt),
    };
  }, [plant, records]);

  useEffect(() => {
    if (showModal) {
      setRecordType('water');
      setNote('');
      setPhoto(undefined);
    }
  }, [showModal]);

  if (!plant) {
    return (
      <div className="page-fade empty-page">
        <p>植物不存在</p>
        <button className="submit-btn ripple" onClick={() => navigate('/')}>返回首页</button>
      </div>
    );
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.8);
      setPhoto(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRecord = async () => {
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      await addRecord(id, { type: recordType, note: note.trim(), photo });
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlant = async () => {
    if (!id) return;
    await deletePlant(id);
    navigate('/', { replace: true });
  };

  return (
    <div className="page-fade plant-detail">
      <div className="detail-hero">
        <img src={plant.avatar} alt={plant.name} className="detail-hero-img" />
        <div className="detail-hero-overlay">
          <button className="back-btn back-btn-light" onClick={() => navigate(-1)}>← 返回</button>
          <button
            className="back-btn back-btn-light"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ marginLeft: 'auto' }}
          >
            🗑
          </button>
        </div>
      </div>

      <div className="detail-stats">
        <div className="stat-card">
          <div className="stat-value"><AnimatedNumber value={stats.waterCount} /></div>
          <div className="stat-label">💧 总浇水</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-text">{stats.lastFertilize}</div>
          <div className="stat-label">🌱 最近施肥</div>
        </div>
        <div className="stat-card">
          <div className="stat-value"><AnimatedNumber value={stats.daysAlive} /></div>
          <div className="stat-label">📅 已存活天</div>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-header">
          <h1 className="detail-name">{plant.name}</h1>
          <div className="detail-meta-tags">
            <span className="detail-tag">{plant.category}</span>
            <span className="detail-tag">☀️ {plant.light}</span>
            <span className="detail-tag">📍 {plant.location}</span>
            <span className="detail-tag">💧 每{plant.waterFrequency}天</span>
            <span className="detail-tag">加入于 {format(plant.createdAt, 'yyyy年M月d日')}</span>
          </div>
        </div>

        <Timeline records={records} onDelete={(rid) => id && deleteRecord(id, rid)} />
      </div>

      <button className="fab ripple" onClick={() => setShowModal(true)}>+</button>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-sheet slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 className="modal-title">添加记录</h3>

            <div className="modal-types">
              {RECORD_TYPES.map(t => {
                const meta = RECORD_META[t];
                const active = recordType === t;
                return (
                  <button
                    key={t}
                    className={`modal-type-btn ${active ? 'modal-type-active' : ''}`}
                    style={active ? { background: meta.color, borderColor: meta.color } : undefined}
                    onClick={() => setRecordType(t)}
                  >
                    <span className="modal-type-icon">{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="form-group">
              <label>备注</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="写点什么..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>照片（可选）</label>
              <div className="photo-upload-row">
                {photo ? (
                  <div className="photo-preview" onClick={() => setPhoto(undefined)}>
                    <img src={photo} alt="预览" />
                    <span className="photo-remove">×</span>
                  </div>
                ) : (
                  <button type="button" className="photo-upload-btn ripple" onClick={() => fileInputRef.current?.click()}>
                    📷 添加照片
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary ripple" onClick={() => setShowModal(false)}>取消</button>
              <button className="submit-btn ripple" disabled={submitting} onClick={handleSaveRecord}>
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-dialog fade-in" onClick={e => e.stopPropagation()}>
            <h3>确认删除？</h3>
            <p>「{plant.name}」的所有记录将一并删除，此操作无法恢复。</p>
            <div className="modal-actions">
              <button className="btn-secondary ripple" onClick={() => setShowDeleteConfirm(false)}>取消</button>
              <button className="btn-danger ripple" onClick={handleDeletePlant}>删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
