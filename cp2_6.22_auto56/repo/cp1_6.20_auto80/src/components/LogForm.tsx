import { useState, useEffect } from 'react';
import type { Log } from '../types';

interface LogFormProps {
  lat: number;
  lng: number;
  existingLog?: Log | null;
  onSubmit: (data: { name: string; date: string; description: string; photos: string[]; lat: number; lng: number }) => void;
  onCancel: () => void;
}

export default function LogForm({ lat, lng, existingLog, onSubmit, onCancel }: LogFormProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>(['', '', '']);

  useEffect(() => {
    if (existingLog) {
      setName(existingLog.name);
      setDate(existingLog.date);
      setDescription(existingLog.description);
      const p = [...existingLog.photos];
      while (p.length < 3) p.push('');
      setPhotos(p);
    }
  }, [existingLog]);

  const handlePhotoChange = (index: number, value: string) => {
    const newPhotos = [...photos];
    newPhotos[index] = value;
    setPhotos(newPhotos);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validPhotos = photos.filter(p => p.trim() !== '');
    onSubmit({
      name: name.trim(),
      date,
      description: description.trim(),
      photos: validPhotos,
      lat,
      lng,
    });
  };

  return (
    <form className="log-form" onSubmit={handleSubmit}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
        {existingLog ? '编辑旅行日志' : '新建旅行日志'}
      </h2>

      <div className="form-group">
        <label className="form-label">地点名称</label>
        <input
          type="text"
          className="form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例如：故宫博物院"
          required
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label className="form-label">旅行日期</label>
        <input
          type="date"
          className="form-input"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">文字描述</label>
        <textarea
          className="form-input form-textarea"
          value={description}
          onChange={e => setDescription(e.target.value.slice(0, 500))}
          placeholder="记录这段旅行的美好回忆..."
          maxLength={500}
        />
        <div className="char-count">{description.length}/500</div>
      </div>

      {[0, 1, 2].map(i => (
        <div className="form-group" key={i}>
          <label className="form-label">照片 {i + 1} URL（可选）</label>
          <input
            type="url"
            className="form-input"
            value={photos[i]}
            onChange={e => handlePhotoChange(i, e.target.value)}
            placeholder="https://..."
          />
        </div>
      ))}

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          {existingLog ? '保存修改' : '创建日志'}
        </button>
      </div>
    </form>
  );
}
