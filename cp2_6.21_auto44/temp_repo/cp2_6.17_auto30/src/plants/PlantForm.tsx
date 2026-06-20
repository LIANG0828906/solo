import { useState, useEffect } from 'react';
import { SPECIES_PRESETS } from '../types';
import type { Plant, LightPreference } from '../types';
import './PlantForm.css';

interface PlantFormProps {
  plant?: Plant;
  onSubmit: (data: Omit<Plant, 'id' | 'isFavorite'>) => void;
  onCancel?: () => void;
}

export function PlantForm({ plant, onSubmit, onCancel }: PlantFormProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState(SPECIES_PRESETS[0].name);
  const [photoUrl, setPhotoUrl] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [location, setLocation] = useState('');
  const [lightPreference, setLightPreference] = useState<LightPreference>('喜阳');
  const [wateringInterval, setWateringInterval] = useState(SPECIES_PRESETS[0].wateringInterval);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (plant) {
      setName(plant.name);
      setSpecies(plant.species);
      setPhotoUrl(plant.photoUrl);
      setPurchaseDate(plant.purchaseDate);
      setLocation(plant.location);
      setLightPreference(plant.lightPreference);
      setWateringInterval(plant.wateringInterval);
    } else {
      setPurchaseDate(new Date().toISOString().split('T')[0]);
    }
  }, [plant]);

  const handleSpeciesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const speciesName = e.target.value;
    setSpecies(speciesName);
    const preset = SPECIES_PRESETS.find(p => p.name === speciesName);
    if (preset) {
      setWateringInterval(preset.wateringInterval);
      setLightPreference(preset.lightPreference);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    onSubmit({
      name: name.trim(),
      species,
      photoUrl: photoUrl.trim(),
      purchaseDate,
      location: location.trim(),
      lightPreference,
      wateringInterval
    });
    setIsSaving(false);
  };

  return (
    <form className="plant-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="form-label">
          植物名称
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入植物名称"
            required
          />
        </label>
      </div>

      <div className="form-row">
        <label className="form-label">
          品种
          <select
            className="form-select"
            value={species}
            onChange={handleSpeciesChange}
          >
            {SPECIES_PRESETS.map(preset => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row two-col">
        <label className="form-label">
          照片URL
          <input
            type="url"
            className="form-input"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="图片链接（可选）"
          />
        </label>
        <label className="form-label">
          购买日期
          <input
            type="date"
            className="form-input"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="form-row two-col">
        <label className="form-label">
          摆放位置
          <input
            type="text"
            className="form-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="如：阳台、客厅、露台"
          />
        </label>
        <label className="form-label">
          浇水间隔（天）
          <input
            type="number"
            min="1"
            max="60"
            className="form-input"
            value={wateringInterval}
            onChange={(e) => setWateringInterval(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="form-row">
        <label className="form-label">
          光照偏好
          <div className="radio-group">
            {(['喜阳', '半阴', '喜阴'] as LightPreference[]).map(opt => (
              <label key={opt} className="radio-label">
                <input
                  type="radio"
                  name="lightPreference"
                  value={opt}
                  checked={lightPreference === opt}
                  onChange={(e) => setLightPreference(e.target.value as LightPreference)}
                />
                {opt}
              </label>
            ))}
          </div>
        </label>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : (plant ? '保存修改' : '添加植物')}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
        )}
      </div>
    </form>
  );
}
