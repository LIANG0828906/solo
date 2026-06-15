import { useState, useEffect } from 'react';
import type { Plant, LightRequirement, WateringFrequency } from '@/types/plant';
import styles from './PlantForm.module.css';

interface PlantFormProps {
  plant?: Plant | null;
  onSubmit: (data: {
    name: string;
    species?: string;
    wateringFrequency: WateringFrequency;
    customDays?: number;
    lightRequirement: LightRequirement;
    photoUrl?: string;
  }) => void;
  onCancel: () => void;
}

export function PlantForm({ plant, onSubmit, onCancel }: PlantFormProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [wateringFrequency, setWateringFrequency] = useState<WateringFrequency>('every2days');
  const [customDays, setCustomDays] = useState(7);
  const [lightRequirement, setLightRequirement] = useState<LightRequirement>('indirect');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  const isEditing = !!plant;

  useEffect(() => {
    if (plant) {
      setName(plant.name);
      setSpecies(plant.species || '');
      setWateringFrequency(plant.wateringFrequency);
      setCustomDays(plant.customDays || 7);
      setLightRequirement(plant.lightRequirement);
      setPhotoUrl(plant.photos[0]?.url);
    }
  }, [plant]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoUrl(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      species: species.trim() || undefined,
      wateringFrequency,
      customDays: wateringFrequency === 'custom' ? customDays : undefined,
      lightRequirement,
      photoUrl,
    });
  };

  const frequencyOptions: { value: WateringFrequency; label: string }[] = [
    { value: 'daily', label: '每天' },
    { value: 'every2days', label: '每2天' },
    { value: 'weekly', label: '每周' },
    { value: 'custom', label: '自定义' },
  ];

  const lightOptions: { value: LightRequirement; label: string; icon: string }[] = [
    { value: 'shade', label: '喜阴', icon: '🌙' },
    { value: 'indirect', label: '散射光', icon: '⛅' },
    { value: 'sunny', label: '喜阳', icon: '☀️' },
  ];

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.formCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {isEditing ? '编辑植物' : '添加植物'}
          </h2>
          <button className={styles.closeBtn} onClick={onCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                植物名称<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：多肉、绿萝..."
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>品种（可选）</label>
              <input
                type="text"
                className={styles.formInput}
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="例如：景天科、天南星科..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                浇水频率<span className={styles.required}>*</span>
              </label>
              <div className={styles.radioGroup}>
                {frequencyOptions.map((option) => (
                  <div key={option.value} className={styles.radioOption}>
                    <input
                      type="radio"
                      id={`freq-${option.value}`}
                      name="wateringFrequency"
                      value={option.value}
                      checked={wateringFrequency === option.value}
                      onChange={() => setWateringFrequency(option.value)}
                      className={styles.radioInput}
                    />
                    <label htmlFor={`freq-${option.value}`} className={styles.radioLabel}>
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              {wateringFrequency === 'custom' && (
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className={styles.formInput}
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                    placeholder="自定义天数"
                    style={{ width: '120px' }}
                  />
                  <span style={{ marginLeft: '8px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    天
                  </span>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                光照需求<span className={styles.required}>*</span>
              </label>
              <div className={styles.radioGroup}>
                {lightOptions.map((option) => (
                  <div key={option.value} className={styles.radioOption}>
                    <input
                      type="radio"
                      id={`light-${option.value}`}
                      name="lightRequirement"
                      value={option.value}
                      checked={lightRequirement === option.value}
                      onChange={() => setLightRequirement(option.value)}
                      className={styles.radioInput}
                    />
                    <label htmlFor={`light-${option.value}`} className={styles.radioLabel}>
                      {option.icon} {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>植物照片（可选）</label>
              {photoUrl ? (
                <div className={styles.photoPreview}>
                  <img src={photoUrl} alt="预览" />
                  <button
                    type="button"
                    className={styles.removePhoto}
                    onClick={handleRemovePhoto}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className={styles.photoUpload}>
                  <div className={styles.photoUploadIcon}>📷</div>
                  <div className={styles.photoUploadText}>点击上传照片</div>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
            </div>
          </div>

          <div className={styles.formFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onCancel}
            >
              取消
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!name.trim()}
            >
              {isEditing ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
