import { useState } from 'react';
import CreateRoomForm from '../components/CreateRoomForm';
import RoomLinkModal from '../components/RoomLinkModal';
import type { CreateRoomRequest, CreateRoomResponse } from '../types';

export default function CreateRoomPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateRoomResponse | null>(null);

  const handleSubmit = async (data: CreateRoomRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '创建失败' }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const result = (await res.json()) as CreateRoomResponse;
      setCreated(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="hero-section animate-fade-in-up">
        <div className="hero-badge">🎵 独立音乐人社区</div>
        <h1 className="hero-title page-title">声浪决选</h1>
        <p className="hero-subtitle page-subtitle">
          让乐迷投票决定你的下一首翻唱曲目，实时见证热度对决
        </p>
      </div>

      <div className="form-wrapper glass-card animate-fade-in-up" style={{ animationDelay: '120ms' }}>
        <div className="form-header">
          <h2 className="form-heading">创建投票房间</h2>
          <p className="form-subheading">
            填写房间信息和候选曲目，让乐迷们参与决选
          </p>
        </div>

        {error && (
          <div className="error-box">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <CreateRoomForm onSubmit={handleSubmit} loading={loading} />
      </div>

      <div className="features-grid">
        <div className="feature-card glass-card">
          <div className="feature-icon">⚡</div>
          <h3 className="feature-title">毫秒级同步</h3>
          <p className="feature-desc">
            WebSocket双向实时通信，每一次投票瞬达所有用户
          </p>
        </div>
        <div className="feature-card glass-card">
          <div className="feature-icon">📊</div>
          <h3 className="feature-title">可视化热度</h3>
          <p className="feature-desc">
            动态柱状图 + 趋势折线图，直观感受人气变化
          </p>
        </div>
        <div className="feature-card glass-card">
          <div className="feature-icon">🏆</div>
          <h3 className="feature-title">仪式感解锁</h3>
          <p className="feature-desc">
            倒计时归零瞬间，冠军曲目金色加冕动画震撼呈现
          </p>
        </div>
      </div>

      {created && (
        <RoomLinkModal
          roomId={created.roomId}
          shareUrl={created.shareUrl}
          onClose={() => setCreated(null)}
        />
      )}

      <style>{`
        .hero-section {
          text-align: center;
          margin-bottom: 36px;
          padding-top: 20px;
        }
        .hero-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(108, 99, 255, 0.15);
          border: 1px solid rgba(108, 99, 255, 0.3);
          font-size: 0.78rem;
          color: var(--btn-gradient-start);
          font-weight: 500;
          letter-spacing: 0.5px;
          margin-bottom: 18px;
        }
        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: 2px;
        }
        .hero-subtitle {
          font-size: 1.02rem;
          margin: 0 auto;
          max-width: 520px;
        }
        .form-wrapper {
          max-width: 640px;
          margin: 0 auto 48px;
          padding: 32px;
        }
        .form-header {
          margin-bottom: 28px;
          text-align: center;
        }
        .form-heading {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .form-subheading {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        .error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(231, 76, 60, 0.1);
          border: 1px solid rgba(231, 76, 60, 0.3);
          color: var(--time-red);
          font-size: 0.88rem;
          margin-bottom: 24px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .feature-card {
          padding: 24px;
          text-align: center;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.3);
        }
        .feature-icon {
          font-size: 2.2rem;
          margin-bottom: 12px;
        }
        .feature-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .feature-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        @media (max-width: 900px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
          .hero-title {
            font-size: 2.2rem;
          }
        }
        @media (max-width: 767px) {
          .form-wrapper {
            padding: 20px 18px;
          }
          .hero-title {
            font-size: 1.8rem;
            letter-spacing: 1px;
          }
        }
      `}</style>
    </div>
  );
}
