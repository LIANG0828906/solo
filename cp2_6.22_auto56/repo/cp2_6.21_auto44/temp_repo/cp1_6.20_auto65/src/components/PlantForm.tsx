import { useState, useEffect } from 'react';
import { Plant, SPECIES_LIST, LOCATION_LIST } from '../types';
import { format } from 'date-fns';

interface PlantFormProps {
  plant?: Plant;
  onSubmit: (data: Omit<Plant, 'id' | 'events' | 'nextWaterDate' | 'nextFertilizeDate'>) => void;
  onCancel: () => void;
}

export default function PlantForm({ plant, onSubmit, onCancel }: PlantFormProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState(SPECIES_LIST[0]);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [location, setLocation] = useState(LOCATION_LIST[0]);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (plant) {
      setName(plant.name);
      setSpecies(plant.species);
      setPurchaseDate(format(new Date(plant.purchaseDate), 'yyyy-MM-dd'));
      setLocation(plant.location);
      setImage(plant.image || null);
    } else {
      setPurchaseDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [plant]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      species,
      purchaseDate: new Date(purchaseDate).toISOString(),
      location,
      image
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="image">植物照片</label>
        {image ? (
          <div>
            <img src={image} alt="预览" className="image-preview" />
            <button
              type="button"
              className="btn btn-danger"
              style={{ width: '100%', marginBottom: '12px' }}
              onClick={() => setImage(null)}
            >
              移除图片
            </button>
          </div>
        ) : (
          <label className="image-upload" htmlFor="image-upload">
            <div className="image-upload-icon">📷</div>
            <div className="image-upload-text">点击上传植物照片</div>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="name">植物名称 *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="给你的植物起个名字"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="species">植物种类</label>
        <select
          id="species"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        >
          {SPECIES_LIST.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="purchaseDate">购买日期</label>
        <input
          id="purchaseDate"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="location">摆放位置</label>
        <select
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          {LOCATION_LIST.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          {plant ? '保存修改' : '添加植物'}
        </button>
      </div>
    </form>
  );
}
