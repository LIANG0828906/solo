import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Upload, Camera, X } from 'lucide-react';
import PhotoItem from '../components/PhotoItem';
import {
  usePlantStore,
  statusColors,
  statusLabels,
  type PlantStatus,
} from '../stores/plantStore';
import './PlantDetail.css';

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const plants = usePlantStore(s => s.plants);
  const photos = usePlantStore(s => s.photos);
  const fetchPhotos = usePlantStore(s => s.fetchPhotos);
  const addPhoto = usePlantStore(s => s.addPhoto);
  const updatePlant = usePlantStore(s => s.updatePlant);
  const deletePlant = usePlantStore(s => s.deletePlant);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [note, setNote] = useState('');

  const plant = plants.find(p => p.id === id);
  const plantPhotos = (id && photos[id]) || [];

  useEffect(() => {
    if (id) fetchPhotos(id);
  }, [id, fetchPhotos]);

  if (!plant) {
    return (
      <div className="detail-container">
        <button className="back-btn" onClick={() => navigate('/plants')}>
          <ArrowLeft size={18} /> 返回
        </button>
        <div className="empty-state">
          <p>未找到该植物</p>
        </div>
      </div>
    );
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    await addPhoto(id, file, note || undefined);
    setNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm('确定删除该植物及其所有记录吗？')) {
      await deletePlant(id);
      navigate('/plants');
    }
  };

  return (
    <div className="detail-container">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/plants')}>
          <ArrowLeft size={18} /> 返回
        </button>
        <div className="detail-actions">
          <button className="icon-btn" onClick={() => setShowEdit(true)} aria-label="编辑">
            <Edit3 size={18} />
          </button>
          <button className="icon-btn danger" onClick={handleDelete} aria-label="删除">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="detail-info-card">
        <div className="detail-info-top">
          <h1 className="detail-name">{plant.name}</h1>
          <span className="plant-status-tag" style={{ background: statusColors[plant.status] }}>
            {statusLabels[plant.status]}
          </span>
        </div>
        {plant.variety && <p className="detail-variety">{plant.variety}</p>}
        <div className="detail-info-grid">
          <div className="info-item">
            <span className="info-label">种植日期</span>
            <span className="info-value">{plant.plantDate}</span>
          </div>
          {plant.expectedBloomDate && (
            <div className="info-item">
              <span className="info-label">预计开花</span>
              <span className="info-value">{plant.expectedBloomDate}</span>
            </div>
          )}
          {plant.expectedHarvestDate && (
            <div className="info-item">
              <span className="info-label">预计收获</span>
              <span className="info-value">{plant.expectedHarvestDate}</span>
            </div>
          )}
        </div>
      </div>

      <div className="detail-section">
        <div className="section-header">
          <h2 className="section-title">生长日志</h2>
          <button className="add-btn small" onClick={() => fileInputRef.current?.click()}>
            <Camera size={16} />
            <span>上传照片</span>
          </button>
        </div>
        <div className="upload-note-wrap">
          <input
            type="text"
            placeholder="添加笔记（可选）..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="upload-note"
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhoto}
          />
        </div>
        {plantPhotos.length === 0 ? (
          <div className="empty-state small">
            <Upload size={36} color="#95A5A6" />
            <p>还没有照片记录</p>
          </div>
        ) : (
          <div className="photos-grid">
            {plantPhotos.map(p => <PhotoItem key={p.id} photo={p} />)}
          </div>
        )}
      </div>

      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>编辑植物</h2>
              <button className="modal-close" onClick={() => setShowEdit(false)}>
                <X size={20} />
              </button>
            </div>
            <EditForm
              plant={plant}
              onSaved={() => setShowEdit(false)}
              onUpdate={updatePlant}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EditForm({
  plant,
  onSaved,
  onUpdate,
}: {
  plant: { id: string; name: string; variety: string; plantDate: string; expectedBloomDate?: string; expectedHarvestDate?: string; status: PlantStatus };
  onSaved: () => void;
  onUpdate: (id: string, data: any) => Promise<any>;
}) {
  const [form, setForm] = useState({
    name: plant.name,
    variety: plant.variety,
    plantDate: plant.plantDate,
    expectedBloomDate: plant.expectedBloomDate || '',
    expectedHarvestDate: plant.expectedHarvestDate || '',
    status: plant.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onUpdate(plant.id, form);
    if (result) onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <label className="form-field">
        <span>名称 *</span>
        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </label>
      <label className="form-field">
        <span>品种</span>
        <input type="text" value={form.variety} onChange={e => setForm({ ...form, variety: e.target.value })} />
      </label>
      <label className="form-field">
        <span>种植日期 *</span>
        <input type="date" required value={form.plantDate} onChange={e => setForm({ ...form, plantDate: e.target.value })} />
      </label>
      <label className="form-field">
        <span>预计开花日期</span>
        <input type="date" value={form.expectedBloomDate} onChange={e => setForm({ ...form, expectedBloomDate: e.target.value })} />
      </label>
      <label className="form-field">
        <span>预计收获日期</span>
        <input type="date" value={form.expectedHarvestDate} onChange={e => setForm({ ...form, expectedHarvestDate: e.target.value })} />
      </label>
      <label className="form-field">
        <span>当前状态</span>
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as PlantStatus })}>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="primary-btn submit-btn">保存修改</button>
    </form>
  );
}
