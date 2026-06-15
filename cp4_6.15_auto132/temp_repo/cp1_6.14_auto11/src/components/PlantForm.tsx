import { useState, useEffect } from 'react';
import PhotoUpload from './PhotoUpload';
import type { Plant, PlantStatus, CareRules } from '../types';
import { rulesApi } from '../api';

interface PlantFormProps {
  plant?: Plant;
  onSubmit: (data: any, photoBlob?: Blob) => void;
  onCancel: () => void;
}

const statusOptions: { value: PlantStatus; label: string }[] = [
  { value: 'seedling', label: '幼苗期' },
  { value: 'growing', label: '生长期' },
  { value: 'flowering', label: '开花期' },
  { value: 'dormant', label: '休眠期' },
];

const lightOptions = ['全日照', '半日照', '散射光', '耐阴'];

const defaultRules: CareRules = {
  waterFrequency: 3,
  fertilizeFrequency: 14,
  lightRequirement: '散射光',
  temperatureMin: 10,
  temperatureMax: 30,
};

export default function PlantForm({ plant, onSubmit, onCancel }: PlantFormProps) {
  const [name, setName] = useState(plant?.name || '');
  const [species, setSpecies] = useState(plant?.species || '');
  const [plantDate, setPlantDate] = useState(
    plant
      ? new Date(plant.plantDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<PlantStatus>(plant?.status || 'growing');
  const [careRules, setCareRules] = useState<CareRules>(
    plant?.careRules || defaultRules
  );
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  useEffect(() => {
    if (species && !plant) {
      setLoadingDefaults(true);
      rulesApi
        .getDefaults(species, status)
        .then((rules) => setCareRules(rules))
        .catch(() => {})
        .finally(() => setLoadingDefaults(false));
    }
  }, [species, status, plant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !species.trim()) {
      alert('请填写植物名称和品种');
      return;
    }
    const data = {
      name: name.trim(),
      species: species.trim(),
      plantDate: new Date(plantDate).getTime(),
      status,
      careRules,
    };
    onSubmit(data, photoBlob || undefined);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="modal-title">
        {plant ? '编辑植物' : '添加新植物'}
      </h2>

      <div className="form-group">
        <label className="form-label">植物名称</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：小绿"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">品种</label>
        <input
          className="form-input"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          placeholder="例如：绿萝"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">种植日期</label>
        <input
          type="date"
          className="form-input"
          value={plantDate}
          onChange={(e) => setPlantDate(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">当前状态</label>
        <select
          className="form-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as PlantStatus)}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">植物照片</label>
        <PhotoUpload
          currentPhotoUrl={plant?.photo?.url}
          onPhotoReady={setPhotoBlob}
          onRemove={() => setPhotoBlob(null)}
        />
      </div>

      <h3 style={{ fontSize: '1rem', color: 'var(--primary-green-dark)', marginTop: 24, marginBottom: 16 }}>
        养护规则{loadingDefaults && '（加载中...）'}
      </h3>

      <div className="rules-grid">
        <div className="form-group">
          <label className="form-label">浇水频率（天）</label>
          <input
            type="number"
            className="form-input"
            value={careRules.waterFrequency}
            onChange={(e) =>
              setCareRules((r) => ({
                ...r,
                waterFrequency: Math.max(1, parseInt(e.target.value) || 1),
              }))
            }
            min="1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">施肥周期（天）</label>
          <input
            type="number"
            className="form-input"
            value={careRules.fertilizeFrequency}
            onChange={(e) =>
              setCareRules((r) => ({
                ...r,
                fertilizeFrequency: Math.max(1, parseInt(e.target.value) || 1),
              }))
            }
            min="1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">光照需求</label>
          <select
            className="form-select"
            value={careRules.lightRequirement}
            onChange={(e) =>
              setCareRules((r) => ({ ...r, lightRequirement: e.target.value }))
            }
          >
            {lightOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            温度范围（{careRules.temperatureMin}°C ~ {careRules.temperatureMax}°C）
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              className="form-input"
              value={careRules.temperatureMin}
              onChange={(e) =>
                setCareRules((r) => ({
                  ...r,
                  temperatureMin: parseInt(e.target.value) || 0,
                }))
              }
            />
            <span>~</span>
            <input
              type="number"
              className="form-input"
              value={careRules.temperatureMax}
              onChange={(e) =>
                setCareRules((r) => ({
                  ...r,
                  temperatureMax: parseInt(e.target.value) || 30,
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          {plant ? '保存' : '添加'}
        </button>
      </div>
    </form>
  );
}
