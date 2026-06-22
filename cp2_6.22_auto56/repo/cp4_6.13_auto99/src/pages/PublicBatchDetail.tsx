import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import RoastCurveChart from '../components/RoastCurveChart';
import FlavorRadarChart from '../components/FlavorRadarChart';
import FlavorTags from '../components/FlavorTags';
import CircularProgress from '../components/CircularProgress';
import { ROAST_LEVELS } from '../../server/models';
import './PublicBatchDetail.css';

interface RoastPoint {
  time: number;
  temperature: number;
}

interface FlavorProfile {
  acidity: number;
  sweetness: number;
  bitterness: number;
  body: number;
  aftertaste: number;
}

interface Batch {
  id: string;
  origin: string;
  variety: string;
  processingMethod: string;
  roastProfile: RoastPoint[];
  greenScore: number;
  flavorNotes: string[];
  roastDate: string;
  createdAt: string;
  flavorProfile: FlavorProfile;
  roastLevel: 'light' | 'medium' | 'dark';
}

const PublicBatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/batch/public/${id}`);
        if (!response.ok) throw new Error('批次不存在');
        const data = await response.json();
        setBatch(data);
      } catch (err) {
        console.error('Failed to fetch batch:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBatch();
    }
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="public-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="public-page">
        <div className="not-found">
          <h2>批次不存在</h2>
          <p>请检查链接是否正确</p>
        </div>
      </div>
    );
  }

  const roastLevelInfo = ROAST_LEVELS[batch.roastLevel];

  return (
    <div className="public-page">
      <div className="public-header">
        <div className="brand-small">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 3.87 3.13 7 7 7s7-3.13 7-7c0-3.87-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
          </svg>
          <span>BeanTrace</span>
        </div>
      </div>

      <div className="public-content">
        <div className="detail-header">
          <div className="header-main">
            <h1 className="detail-title">
              {batch.origin} · {batch.variety}
            </h1>
            <div className="detail-meta">
              <span
                className="roast-level-tag"
                style={{
                  backgroundColor: roastLevelInfo.color,
                  color: roastLevelInfo.textColor,
                }}
              >
                {roastLevelInfo.label}
              </span>
              <span className="processing-tag">{batch.processingMethod}</span>
              <span className="date-tag">{formatDate(batch.roastDate)}</span>
            </div>
          </div>
          <div className="header-score">
            <span className="score-label">生豆评分</span>
            <CircularProgress value={batch.greenScore} max={10} size={64} strokeWidth={5} />
          </div>
        </div>

        <div className="detail-sections">
          <div className="detail-section">
            <h2 className="section-title">烘焙曲线</h2>
            <div className="chart-wrapper">
              <RoastCurveChart data={batch.roastProfile} width={600} height={280} interactive={true} />
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-section flavor-section">
              <h2 className="section-title">风味雷达</h2>
              <div className="radar-wrapper">
                <FlavorRadarChart data={batch.flavorProfile} size={240} />
              </div>
            </div>

            <div className="detail-section notes-section">
              <h2 className="section-title">风味笔记</h2>
              <FlavorTags flavors={batch.flavorNotes} />
            </div>
          </div>
        </div>

        <div className="public-footer">
          <p>由 BeanTrace 提供风味溯源支持</p>
        </div>
      </div>
    </div>
  );
};

export default PublicBatchDetail;
