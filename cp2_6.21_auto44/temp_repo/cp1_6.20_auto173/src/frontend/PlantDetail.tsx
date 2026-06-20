import React, { useState } from 'react';

export interface PlantInfo {
  id: string;
  name: string;
  varieties: string[];
  careTips: {
    light: string;
    watering: string;
    fertilizing: string;
  };
  growthCycle: {
    name: string;
    duration: string;
    order: number;
  }[];
}

type TabKey = 'basic' | 'care' | 'growth';

interface PlantDetailProps {
  plant: PlantInfo;
  onCreateCareLog: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

const SunIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="5" fill="#f5a623" />
    <g stroke="#f5a623" strokeWidth="2" strokeLinecap="round">
      <line x1="14" y1="2" x2="14" y2="6" />
      <line x1="14" y1="22" x2="14" y2="26" />
      <line x1="2" y1="14" x2="6" y2="14" />
      <line x1="22" y1="14" x2="26" y2="14" />
      <line x1="5.5" y1="5.5" x2="8.3" y2="8.3" />
      <line x1="19.7" y1="19.7" x2="22.5" y2="22.5" />
      <line x1="5.5" y1="22.5" x2="8.3" y2="19.7" />
      <line x1="19.7" y1="8.3" x2="22.5" y2="5.5" />
    </g>
  </svg>
);

const WaterIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path
      d="M14 3C14 3 6 13 6 18C6 22.4 9.6 26 14 26C18.4 26 22 22.4 22 18C22 13 14 3 14 3Z"
      fill="#4a90d9"
    />
    <path
      d="M11 18C11 16 14 12 14 12"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const FertilizerIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="8" y="14" width="12" height="11" rx="2" fill="#8b6f47" />
    <rect x="11" y="10" width="6" height="5" rx="1" fill="#a0845c" />
    <path d="M13 6L14 3L15 6" stroke="#50e3c2" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="19" r="1.5" fill="#50e3c2" />
    <circle cx="16" cy="21" r="1.5" fill="#50e3c2" />
  </svg>
);

const PlantDetail: React.FC<PlantDetailProps> = ({
  plant,
  onCreateCareLog,
  isFavorited,
  onToggleFavorite,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'basic', label: '基本信息' },
    { key: 'care', label: '养护要点' },
    { key: 'growth', label: '生长周期' },
  ];

  return (
    <div className="plant-detail">
      <div className="plant-header-card">
        <h1 className="plant-name">{plant.name}</h1>
        <button
          className={`fav-btn ${isFavorited ? 'favorited' : ''}`}
          onClick={onToggleFavorite}
          title={isFavorited ? '取消收藏' : '添加收藏'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={isFavorited ? '#ffd700' : 'none'}
              stroke={isFavorited ? '#ffd700' : '#999'}
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>

      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <div className={`tab-panel ${activeTab === 'basic' ? 'visible' : ''}`}>
          <div className="info-section">
            <h3>常见品种</h3>
            <div className="variety-tags">
              {plant.varieties.map((v, i) => (
                <span key={i} className="variety-tag">{v}</span>
              ))}
            </div>
          </div>
        </div>

        <div className={`tab-panel ${activeTab === 'care' ? 'visible' : ''}`}>
          <div className="care-cards">
            <div className="care-card">
              <div className="care-icon"><SunIcon /></div>
              <h3>光照</h3>
              <p>{plant.careTips.light}</p>
            </div>
            <div className="care-card">
              <div className="care-icon"><WaterIcon /></div>
              <h3>浇水</h3>
              <p>{plant.careTips.watering}</p>
            </div>
            <div className="care-card">
              <div className="care-icon"><FertilizerIcon /></div>
              <h3>施肥</h3>
              <p>{plant.careTips.fertilizing}</p>
            </div>
          </div>
        </div>

        <div className={`tab-panel ${activeTab === 'growth' ? 'visible' : ''}`}>
          <div className="timeline">
            {plant.growthCycle.map((stage, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-node">
                  <span className="node-number">{stage.order}</span>
                </div>
                {i < plant.growthCycle.length - 1 && <div className="timeline-connector" />}
                <div className="timeline-content">
                  <span className="stage-name">{stage.name}</span>
                  <span className="stage-duration">{stage.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="create-log-btn" onClick={onCreateCareLog}>
        创建养护日志
      </button>
    </div>
  );
};

export default PlantDetail;
