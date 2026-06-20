import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import {
  plantApi,
  statsApi,
  recognitionApi,
  getSocket,
  Plant,
  StatsOverview,
  RecognitionResult,
  DiseaseRegion
} from './api';

const styles = `
  .stats-overview {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
    animation: fadeInUp 0.5s ease-out;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: var(--border-radius);
    padding: 20px 24px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    transition: var(--transition);
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  }

  .stat-label {
    font-size: 13px;
    color: var(--color-text-light);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .stat-value {
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
  }

  .stat-value.red { color: var(--color-accent-red); }
  .stat-value.orange { color: var(--color-accent-orange); }
  .stat-value.green { color: var(--color-primary); }

  .stat-icon {
    font-size: 20px;
    margin-left: 8px;
    opacity: 0.7;
  }

  .action-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
    align-items: center;
    animation: fadeInUp 0.5s ease-out 0.1s both;
  }

  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 8px;
    animation: fadeInUp 0.5s ease-out;
  }

  .plant-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }

  .plant-card {
    background: white;
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-card);
    transition: var(--transition);
    cursor: pointer;
    animation: fadeInUp 0.5s ease-out both;
  }

  .plant-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-hover);
  }

  .plant-avatar-wrap {
    width: 100%;
    aspect-ratio: 1;
    background: linear-gradient(135deg, #c8e6c9, #a5d6a7);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
  }

  .plant-avatar {
    width: 80%;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 2px solid var(--color-border-gray-green);
    object-fit: cover;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .plant-info {
    padding: 16px;
  }

  .plant-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 4px;
  }

  .plant-species {
    font-size: 13px;
    color: var(--color-text-light);
    margin-bottom: 12px;
  }

  .plant-last-water {
    font-size: 12px;
    color: var(--color-text-light);
    margin-bottom: 8px;
  }

  .water-countdown {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }

  .water-countdown.days-ok {
    color: var(--color-primary);
  }

  .water-countdown.days-urgent {
    color: var(--color-accent-orange);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .water-countdown.days-now {
    color: var(--color-accent-red);
    animation: pulse 1s ease-in-out infinite;
  }

  .add-card {
    background: white;
    border: 2px dashed var(--color-border-gray-green);
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    aspect-ratio: auto;
    min-height: 300px;
    cursor: pointer;
    transition: var(--transition);
    color: var(--color-primary);
    font-weight: 600;
    gap: 8px;
    animation: fadeInUp 0.5s ease-out both;
  }

  .add-card:hover {
    background: rgba(46, 125, 50, 0.05);
    border-color: var(--color-primary);
    transform: translateY(-4px);
  }

  .add-icon {
    font-size: 48px;
    opacity: 0.6;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
    padding: 20px;
  }

  .modal-content {
    background: white;
    border-radius: var(--border-radius);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease-out;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }

  .modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text);
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--color-text-light);
    transition: var(--transition);
    padding: 4px 8px;
    border-radius: 8px;
  }

  .modal-close:hover {
    background: rgba(0,0,0,0.05);
    color: var(--color-text);
  }

  .modal-body {
    padding: 24px;
  }

  .form-group {
    margin-bottom: 18px;
  }

  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 8px;
  }

  .form-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #ddd;
    border-radius: 10px;
    font-size: 14px;
    transition: var(--transition);
    background: white;
  }

  .form-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
  }

  .avatar-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid var(--color-border-gray-green);
    object-fit: cover;
    margin-bottom: 12px;
    background: #f5f5f5;
  }

  .upload-btn {
    display: inline-block;
    padding: 8px 16px;
    background: rgba(46, 125, 50, 0.1);
    color: var(--color-primary);
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: var(--transition);
  }

  .upload-btn:hover {
    background: rgba(46, 125, 50, 0.2);
  }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .progress-ring-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    gap: 20px;
  }

  .progress-ring {
    width: 120px;
    height: 120px;
    transform: rotate(-90deg);
  }

  .progress-ring-bg {
    fill: none;
    stroke: #e0e0e0;
    stroke-width: 10;
  }

  .progress-ring-fill {
    fill: none;
    stroke-width: 10;
    stroke-linecap: round;
    stroke-dasharray: 314;
    stroke-dashoffset: 314;
    transition: stroke-dashoffset 0.3s ease-out;
  }

  .progress-text {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-primary);
  }

  .progress-label {
    font-size: 14px;
    color: var(--color-text-light);
  }

  .recognition-result {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .recognition-canvas-wrap {
    position: relative;
    background: #f5f5f5;
    border-radius: 12px;
    overflow: hidden;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .recognition-canvas {
    width: 100%;
    height: 100%;
  }

  .disease-name {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 12px;
  }

  .severity-badge {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .severity-low {
    background: #c8e6c9;
    color: #2e7d32;
  }

  .severity-medium {
    background: #ffe0b2;
    color: #e65100;
  }

  .severity-high {
    background: #ffcdd2;
    color: #c62828;
  }

  .recommendation {
    font-size: 14px;
    line-height: 1.7;
    color: var(--color-text);
  }

  .recommendation h2 {
    font-size: 16px;
    margin: 16px 0 8px;
    color: var(--color-primary);
  }

  .recommendation h3 {
    font-size: 14px;
    margin: 12px 0 6px;
    color: var(--color-text);
  }

  .recommendation p, .recommendation li {
    margin-bottom: 6px;
  }

  .recommendation ul, .recommendation ol {
    padding-left: 20px;
  }

  .recommendation strong {
    color: var(--color-primary-dark);
  }

  .hidden-input {
    display: none;
  }

  @media (max-width: 768px) {
    .stats-overview {
      grid-template-columns: 1fr;
    }

    .recognition-result {
      grid-template-columns: 1fr;
    }

    .stat-value {
      font-size: 28px;
    }
  }
`;

const PlantList: React.FC = () => {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [stats, setStats] = useState<StatsOverview>({ needWatering: 0, recentDiseases: 0, totalPlants: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecognizeModal, setShowRecognizeModal] = useState(false);
  const [recognizeProgress, setRecognizeProgress] = useState(0);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const [newPlant, setNewPlant] = useState({
    name: '',
    species: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    avatar: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognizeInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadData();
    const socket = getSocket();
    socket.on('stats:updated', (newStats: StatsOverview) => {
      setStats(newStats);
    });
    return () => {
      socket.off('stats:updated');
    };
  }, []);

  useEffect(() => {
    if (recognitionResult && canvasRef.current) {
      drawDiseaseRegions(recognitionResult.imageUrl, recognitionResult.diseaseRegions);
    }
  }, [recognitionResult]);

  const loadData = async () => {
    try {
      const [plantsData, statsData] = await Promise.all([
        plantApi.getAll(),
        statsApi.getOverview()
      ]);
      setPlants(plantsData);
      setStats(statsData);
    } catch (e) {
      console.error('加载数据失败', e);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '暂无记录';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewPlant(p => ({ ...p, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePlant = async () => {
    if (!newPlant.name || !newPlant.species) return;
    try {
      await plantApi.create({
        ...newPlant,
        avatar: newPlant.avatar || undefined
      } as any);
      setShowCreateModal(false);
      setNewPlant({ name: '', species: '', purchaseDate: new Date().toISOString().split('T')[0], avatar: '' });
      loadData();
    } catch (e) {
      console.error('创建失败', e);
    }
  };

  const handleRecognize = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowRecognizeModal(true);
    setIsRecognizing(true);
    setRecognizeProgress(0);
    setRecognitionResult(null);

    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress = Math.min(progress + Math.random() * 15, 90);
      setRecognizeProgress(Math.round(progress));
    }, 200);

    recognitionApi.recognize(
      file,
      undefined,
      (p) => setRecognizeProgress(Math.max(recognizeProgress, p))
    ).then(result => {
      clearInterval(uploadInterval);
      setRecognizeProgress(100);
      setTimeout(() => {
        setRecognitionResult(result);
        setIsRecognizing(false);
      }, 300);
    }).catch(err => {
      clearInterval(uploadInterval);
      setIsRecognizing(false);
      console.error('识别失败', err);
    });

    if (recognizeInputRef.current) {
      recognizeInputRef.current.value = '';
    }
  };

  const drawDiseaseRegions = (imageUrl: string, regions: DiseaseRegion[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width || 300;
      canvas.height = img.height || 300;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);

      regions.forEach(r => {
        const x = (r.x / 100) * canvas.width;
        const y = (r.y / 100) * canvas.height;
        const w = (r.width / 100) * canvas.width;
        const h = (r.height / 100) * canvas.height;
        ctx.strokeRect(x, y, w, h);
      });

      ctx.setLineDash([]);
    };
    img.src = imageUrl;
  };

  const renderRecommendation = (md: string) => {
    return { __html: marked.parse(md) as string };
  };

  const getCountdownClass = (days: number) => {
    if (days <= 0) return 'days-now';
    if (days < 2) return 'days-urgent';
    return 'days-ok';
  };

  const getCountdownText = (days: number) => {
    if (days <= 0) return '今天需要浇水';
    if (days === 1) return '明天需要浇水';
    return `还有 ${days} 天浇水`;
  };

  return (
    <div>
      <style>{styles}</style>

      <h1 className="page-title">我的植物花园 🌱</h1>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-label">
            今天需要浇水
            <span className="stat-icon">💧</span>
          </div>
          <div className="stat-value red">{stats.needWatering}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            近一周病虫害
            <span className="stat-icon">⚠️</span>
          </div>
          <div className="stat-value orange">{stats.recentDiseases}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            植物总数
            <span className="stat-icon">🌿</span>
          </div>
          <div className="stat-value green">{stats.totalPlants}</div>
        </div>
      </div>

      <div className="action-bar">
        <button
          className="btn btn-primary"
          onClick={() => recognizeInputRef.current?.click()}
        >
          🔍 识别病虫害
        </button>
        <input
          ref={recognizeInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden-input"
          onChange={handleRecognize}
        />
      </div>

      <div className="plant-grid">
        <div className="add-card" onClick={() => setShowCreateModal(true)}>
          <div className="add-icon">+</div>
          <div>添加新植物</div>
        </div>

        {plants.map((plant, idx) => (
          <div
            key={plant.id}
            className="plant-card"
            style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
            onClick={() => navigate(`/plant/${plant.id}`)}
          >
            <div className="plant-avatar-wrap">
              <img
                className="plant-avatar"
                src={plant.avatar}
                alt={plant.name}
              />
            </div>
            <div className="plant-info">
              <div className="plant-name">{plant.name}</div>
              <div className="plant-species">{plant.species}</div>
              <div className="plant-last-water">上次浇水: {formatDate(plant.lastWateredAt)}</div>
              <div className={`water-countdown ${getCountdownClass(plant.daysToWater)}`}>
                💧 {getCountdownText(plant.daysToWater)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">🌱 添加新植物</div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">植物头像</label>
                {newPlant.avatar && (
                  <img className="avatar-preview" src={newPlant.avatar} alt="预览" />
                )}
                <div>
                  <label className="upload-btn">
                    📷 选择照片
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden-input"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">植物名称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="给它起个名字吧"
                  value={newPlant.name}
                  onChange={(e) => setNewPlant(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">品种</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="如：绿萝、多肉"
                  value={newPlant.species}
                  onChange={(e) => setNewPlant(p => ({ ...p, species: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">购买日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={newPlant.purchaseDate}
                  onChange={(e) => setNewPlant(p => ({ ...p, purchaseDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleCreatePlant}
                disabled={!newPlant.name || !newPlant.species}
              >
                创建档案
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecognizeModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget && !isRecognizing) {
            setShowRecognizeModal(false);
          }
        }}>
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <div className="modal-title">🔍 病虫害识别结果</div>
              <button
                className="modal-close"
                onClick={() => !isRecognizing && setShowRecognizeModal(false)}
                disabled={isRecognizing}
              >×</button>
            </div>
            <div className="modal-body">
              {isRecognizing && (
                <div className="progress-ring-wrap">
                  <svg className="progress-ring" viewBox="0 0 120 120">
                    <circle className="progress-ring-bg" cx="60" cy="60" r="50" />
                    <circle
                      className="progress-ring-fill"
                      cx="60"
                      cy="60"
                      r="50"
                      style={{
                        stroke: `url(#grad${recognizeProgress})`,
                        strokeDashoffset: 314 - (314 * recognizeProgress / 100)
                      }}
                    />
                    <defs>
                      <linearGradient id={`grad${recognizeProgress}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2e7d32" />
                        <stop offset="100%" stopColor="#66bb6a" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="progress-text">{recognizeProgress}%</div>
                  <div className="progress-label">正在分析叶片图像...</div>
                </div>
              )}

              {recognitionResult && !isRecognizing && (
                <div className="recognition-result">
                  <div className="recognition-canvas-wrap">
                    <canvas
                      ref={canvasRef}
                      className="recognition-canvas"
                    />
                  </div>
                  <div>
                    <div className="disease-name">{recognitionResult.disease}</div>
                    <span className={`severity-badge severity-${recognitionResult.severity}`}>
                      严重程度: {recognitionResult.severityLabel}
                    </span>
                    <div
                      className="recommendation"
                      dangerouslySetInnerHTML={renderRecommendation(recognitionResult.recommendation)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantList;
