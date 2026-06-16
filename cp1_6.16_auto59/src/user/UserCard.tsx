import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCropInfo, CropInfo, GrowthStage, getStageName } from '../api/farmService';
import './UserCard.css';

const stageGradientMap: Record<GrowthStage, string> = {
  seed: 'linear-gradient(135deg, #9CAF88 0%, #7A8B6E 100%)',
  seedling: 'linear-gradient(135deg, #B8E6B8 0%, #90C695 100%)',
  growing: 'linear-gradient(135deg, #50C878 0%, #2E8B57 100%)',
  flowering: 'linear-gradient(135deg, #DDA0DD 0%, #BA55D3 100%)',
  mature: 'linear-gradient(135deg, #FF7F50 0%, #FF4500 100%)'
};

interface CropCardProps {
  crop: CropInfo;
  index: number;
  onClick: () => void;
}

const CropCard: React.FC<CropCardProps> = ({ crop, index, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [animateTag, setAnimateTag] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateTag(true);
    }, 300 + index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const daysLeft = () => {
    const now = new Date();
    const harvest = new Date(crop.expectedHarvestDate);
    const diff = Math.ceil((harvest.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}天后收获` : '已到收获期';
  };

  return (
    <div
      className="crop-card"
      onClick={onClick}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="card-image-wrapper">
        {!imageLoaded && <div className="card-image-placeholder" />}
        <img
          src={crop.image}
          alt={crop.name}
          loading="lazy"
          className={`card-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="card-type-badge">
          {crop.type === 'vegetable' ? '🥬 果蔬类' : '🍎 果树类'}
        </div>
        <span
          className={`stage-tag ${animateTag ? 'animate' : ''}`}
          style={{ background: stageGradientMap[crop.currentStage] }}
          onMouseEnter={() => setAnimateTag(false)}
          onAnimationEnd={() => setAnimateTag(true)}
        >
          {getStageName(crop.currentStage)}
        </span>
      </div>

      <div className="card-content">
        <div className="card-title-row">
          <h3 className="card-title">{crop.name}</h3>
          <span className="card-days">{daysLeft()}</span>
        </div>

        <div className="card-info-row">
          <div className="info-item">
            <span className="info-icon">📅</span>
            <span className="info-label">认养日期</span>
            <span className="info-value">{formatDate(crop.adoptionDate)}</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🌾</span>
            <span className="info-label">预计收获</span>
            <span className="info-value">{formatDate(crop.expectedHarvestDate)}</span>
          </div>
        </div>

        <div className="card-footer">
          <div className="location-info">
            <span className="info-icon">📍</span>
            <span>{crop.location}</span>
          </div>
          <div className="farmer-info">
            <span className="farmer-avatar">{crop.farmerName.charAt(0)}</span>
            <span>{crop.farmerName}</span>
          </div>
        </div>
      </div>

      <div className="card-hover-glow" />
    </div>
  );
};

const UserCard: React.FC = () => {
  const [crops, setCrops] = useState<CropInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'vegetable' | 'fruit'>('all');
  const navigate = useNavigate();

  const fetchCrops = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCropInfo('user-default');
      setCrops(data);
    } catch (error) {
      console.error('获取认养列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const filteredCrops = crops.filter((crop) => {
    if (filter === 'all') return true;
    return crop.type === filter;
  });

  const handleCardClick = (cropId: string) => {
    navigate(`/crop/${cropId}`);
  };

  const stats = {
    total: crops.length,
    vegetables: crops.filter((c) => c.type === 'vegetable').length,
    fruits: crops.filter((c) => c.type === 'fruit').length
  };

  return (
    <div className="user-card-page">
      <header className="page-header">
        <div>
          <h1>🌱 我的认养农场</h1>
          <p className="header-subtitle">
            共认养 <strong style={{ color: 'var(--olive-green)' }}>{stats.total}</strong> 块
            · 果蔬 <strong>{stats.vegetables}</strong> · 果树 <strong>{stats.fruits}</strong>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => {}}>
          ＋ 认养新作物
        </button>
      </header>

      <div className="container">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部 ({stats.total})
          </button>
          <button
            className={`filter-tab ${filter === 'vegetable' ? 'active' : ''}`}
            onClick={() => setFilter('vegetable')}
          >
            🥬 果蔬类 ({stats.vegetables})
          </button>
          <button
            className={`filter-tab ${filter === 'fruit' ? 'active' : ''}`}
            onClick={() => setFilter('fruit')}
          >
            🍎 果树类 ({stats.fruits})
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>正在加载我的农场...</span>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌻</div>
            <h3>还没有认养的作物</h3>
            <p>快去认养一块属于你的小天地吧！</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }}>
              立即认养
            </button>
          </div>
        ) : (
          <div className="crop-grid">
            {filteredCrops.map((crop, index) => (
              <CropCard
                key={crop.id}
                crop={crop}
                index={index}
                onClick={() => handleCardClick(crop.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;
