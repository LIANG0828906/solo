import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RoastCurveChart from '../components/RoastCurveChart';
import FlavorRadarChart from '../components/FlavorRadarChart';
import FlavorTags from '../components/FlavorTags';
import CircularProgress from '../components/CircularProgress';
import { ROAST_LEVELS } from '../../server/models';
import api from '../utils/api';
import './BatchDetail.css';

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

const BatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        setLoading(true);
        const data = await api.get<Batch>(`/batch/${id}`);
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

  const handleGenerateQrCode = async () => {
    if (!id) return;

    try {
      setGenerating(true);
      const data = await api.get<{ qrcode: string; url: string }>(`/batch/${id}/qrcode`);
      setQrCode(data.qrcode);
      setQrVisible(true);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQrCode = () => {
    if (!qrCode || !batch) return;

    const link = document.createElement('a');
    link.download = `beantrace-${batch.origin}-${batch.id.slice(0, 8)}.png`;
    link.href = qrCode;
    link.click();
  };

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
      <div className="batch-detail-page">
        <Navbar />
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="batch-detail-page">
        <Navbar />
        <div className="not-found">
          <h2>批次不存在</h2>
          <button onClick={() => navigate('/')}>返回列表</button>
        </div>
      </div>
    );
  }

  const roastLevelInfo = ROAST_LEVELS[batch.roastLevel];

  return (
    <div className="batch-detail-page">
      <Navbar />

      <div className="detail-content">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回列表
        </button>

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
              <RoastCurveChart data={batch.roastProfile} width={700} height={320} />
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-section flavor-section">
              <h2 className="section-title">风味雷达</h2>
              <div className="radar-wrapper">
                <FlavorRadarChart data={batch.flavorProfile} size={260} />
              </div>
            </div>

            <div className="detail-section notes-section">
              <h2 className="section-title">风味笔记</h2>
              <FlavorTags flavors={batch.flavorNotes} />
            </div>
          </div>
        </div>

        <div className="action-bar">
          <button
            className="generate-qr-btn"
            onClick={handleGenerateQrCode}
            disabled={generating}
          >
            {generating ? '生成中...' : '生成溯源二维码'}
          </button>
        </div>

        {qrVisible && qrCode && (
          <div className="qr-section">
            <div className="qr-card">
              <h3 className="qr-title">溯源二维码</h3>
              <p className="qr-subtitle">扫描二维码查看批次详情</p>
              <div className="qr-image-wrapper">
                <img src={qrCode} alt="溯源二维码" className="qr-image" />
              </div>
              <button className="download-qr-btn" onClick={handleDownloadQrCode}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                下载二维码
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDetail;
