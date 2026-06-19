import { useState } from 'react';
import PlantCard from '../components/PlantCard';
import { usePlantStore } from '../store/plantStore';
import './HomePage.css';

function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [habits, setHabits] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const plants = usePlantStore(s => s.plants);
  const addPlant = usePlantStore(s => s.addPlant);
  const currentUserId = usePlantStore(s => s.currentUserId);

  const myPlants = plants.filter(p => p.userId === currentUserId);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB');
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('只允许JPG/PNG格式');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入植物名称');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('variety', variety);
      formData.append('difficulty', String(difficulty));
      formData.append('habits', habits);
      if (imageFile) {
        formData.append('image', imageFile);
      }
      await addPlant(formData);
      setShowModal(false);
      setName('');
      setVariety('');
      setDifficulty(3);
      setHabits('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      alert('添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home-page page-container">
      <div className="page-header">
        <h1>我的花园</h1>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + 添加植物
        </button>
      </div>

      {myPlants.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">🌱</p>
          <p>还没有植物，点击上方按钮添加你的第一株植物吧！</p>
        </div>
      ) : (
        <div className="plants-grid">
          {myPlants.map(plant => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>添加新植物</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>植物名称 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例如：绿萝"
                />
              </div>

              <div className="form-row">
                <label>品种</label>
                <input
                  type="text"
                  value={variety}
                  onChange={e => setVariety(e.target.value)}
                  placeholder="例如：黄金葛"
                />
              </div>

              <div className="form-row">
                <label>养护难度</label>
                <div className="stars-input">
                  {[1, 2, 3, 4, 5].map(n => (
                    <span
                      key={n}
                      className={`star ${n <= difficulty ? 'active' : ''}`}
                      onClick={() => setDifficulty(n)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label>生长习性</label>
                <textarea
                  value={habits}
                  onChange={e => setHabits(e.target.value)}
                  placeholder="描述一下它的生长习性..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <label>植物照片（JPG/PNG，≤2MB）</label>
                <input type="file" accept="image/jpeg,image/png" onChange={handleImageChange} />
                {imagePreview && (
                  <img src={imagePreview} alt="预览" className="image-preview" />
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? '添加中...' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
