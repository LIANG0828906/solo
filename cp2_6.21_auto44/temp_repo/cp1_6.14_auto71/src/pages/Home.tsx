import React, { useEffect, useState } from 'react';
import PetCard from '../components/PetCard';
import { getPets } from '../api';
import type { Pet } from '../types';

const Home: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog' as const,
    breed: '',
    gender: 'male' as const,
    birthday: '',
    weight: 0,
    description: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const response = await getPets();
      if (response.data) {
        setPets(response.data);
      }
    } catch (error) {
      console.error('Failed to load pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { createPet } = await import('../api');
      await createPet({
        ...formData,
        avatar: avatarFile || undefined,
      });
      setShowModal(false);
      setFormData({
        name: '',
        species: 'dog',
        breed: '',
        gender: 'male',
        birthday: '',
        weight: 0,
        description: '',
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      loadPets();
    } catch (error) {
      console.error('Failed to create pet:', error);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6" style={{ height: '280px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">🐾 我的宠物</h1>
          <p className="text-gray-500">记录每一个温暖的陪伴时刻</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <span>+ 添加宠物</span>
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">🐱🐶</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">还没有宠物档案</h2>
          <p className="text-gray-500 mb-6">点击上方按钮添加你的第一只宠物吧！</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <span>+ 立即添加</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
          }}
        >
          {pets.map((pet, index) => (
            <PetCard key={pet.id} pet={pet} index={index} />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6 gradient-text">添加宠物档案</h2>
            <form onSubmit={handleSubmit}>
              <div className="flex justify-center mb-6">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-pink-200">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="预览" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-4xl">
                      📷
                    </div>
                  )}
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <span className="text-white text-sm">点击上传</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>宠物名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入宠物名称"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>品种</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="如：金毛、布偶"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>物种</label>
                  <select
                    value={formData.species}
                    onChange={(e) =>
                      setFormData({ ...formData, species: e.target.value as 'dog' | 'cat' | 'other' })
                    }
                  >
                    <option value="dog">🐕 狗狗</option>
                    <option value="cat">🐱 猫咪</option>
                    <option value="other">🐾 其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>性别</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })
                    }
                  >
                    <option value="male">♂ 公</option>
                    <option value="female">♀ 母</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>出生日期</label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>体重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>简介</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="写点什么介绍你的宝贝..."
                  rows={3}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  创建档案
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;
