import { useState, useEffect } from 'react';
import type { Tea, TeaVariety, Season } from '@/types';
import RegionSelect from './RegionSelect';
import PhotoUpload from './PhotoUpload';

interface Props {
  initial?: Tea | null;
  onSubmit: (data: Omit<Tea, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

const VARIETIES: TeaVariety[] = [
  '绿茶', '红茶', '乌龙茶', '白茶', '黄茶', '黑茶', '普洱', '再加工茶',
];
const SEASONS: Season[] = ['春', '夏', '秋', '冬'];

export default function TeaForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [variety, setVariety] = useState<TeaVariety | ''>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [season, setSeason] = useState<Season>('春');
  const [processType, setProcessType] = useState('');
  const [appearance, setAppearance] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setProvince(initial.province);
      setCity(initial.city);
      setRegion(initial.region);
      setVariety(initial.variety);
      setYear(initial.year);
      setSeason(initial.season);
      setProcessType(initial.processType);
      setAppearance(initial.appearance);
      setPhotos(initial.photos);
      setDescription(initial.description);
    }
  }, [initial]);

  const handleRegionChange = (p: string, c: string, r: string) => {
    setProvince(p);
    setCity(c);
    setRegion(r);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !variety) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        province,
        city,
        region,
        variety: variety as TeaVariety,
        year,
        season,
        processType,
        appearance,
        photos,
        description,
        lastBrewDate: initial?.lastBrewDate,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="tea-label">茶叶名称 *</label>
        <input
          className="tea-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="如：西湖龙井"
          required
        />
      </div>

      <div>
        <label className="tea-label mb-2 block">产地（省/市/产区）</label>
        <RegionSelect
          province={province}
          city={city}
          region={region}
          onChange={handleRegionChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="tea-label">品种 *</label>
          <select
            className="tea-input"
            value={variety}
            onChange={(e) => setVariety(e.target.value as TeaVariety)}
            required
          >
            <option value="">请选择</option>
            {VARIETIES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="tea-label">采摘季节</label>
          <select
            className="tea-input"
            value={season}
            onChange={(e) => setSeason(e.target.value as Season)}
          >
            {SEASONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="tea-label">年份</label>
          <input
            type="number"
            className="tea-input"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || 0)}
            min={1900}
            max={2100}
          />
        </div>
        <div>
          <label className="tea-label">工艺类型</label>
          <input
            className="tea-input"
            value={processType}
            onChange={(e) => setProcessType(e.target.value)}
            placeholder="如：炒青、烘青、晒青等"
          />
        </div>
      </div>

      <div>
        <label className="tea-label">干茶外形描述</label>
        <textarea
          className="tea-input"
          value={appearance}
          onChange={(e) => setAppearance(e.target.value)}
          placeholder="描述干茶的形状、色泽、条索等"
          rows={2}
        />
      </div>

      <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={3} />

      <div>
        <label className="tea-label">简介</label>
        <textarea
          className="tea-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="茶叶的简短介绍"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          className="tea-btn tea-btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          取消
        </button>
        <button
          type="submit"
          className="tea-btn tea-btn-primary"
          disabled={submitting}
        >
          {submitting ? '保存中...' : initial ? '保存修改' : '添加档案'}
        </button>
      </div>
    </form>
  );
}
