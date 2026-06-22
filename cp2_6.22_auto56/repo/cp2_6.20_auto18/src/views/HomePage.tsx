import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page animate-fade-in">
      <div className="home-hero">
        <div className="hero-content">
          <div className="hero-badge">异步面试评估平台</div>
          <h1 className="hero-title">
            让面试评估
            <br />
            <span className="highlight">更高效、更公平</span>
          </h1>
          <p className="hero-desc">
            面试官创建问题，候选人录屏作答，评估者随时打分。
            <br />
            打破时间限制，提升招聘效率。
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary hero-btn"
              onClick={() => navigate('/interview/setup')}
            >
              创建面试
            </button>
            <button
              className="btn btn-secondary hero-btn"
              onClick={() => navigate('/evaluation')}
            >
              评估中心
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-card card">
            <div className="visual-header">
              <div className="visual-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="visual-title">面试评估</span>
            </div>
            <div className="visual-body">
              <div className="video-preview">
                <div className="play-btn-center">▶</div>
              </div>
              <div className="score-bars">
                <div className="score-bar" style={{ height: '70%' }} />
                <div className="score-bar" style={{ height: '85%' }} />
                <div className="score-bar" style={{ height: '60%' }} />
                <div className="score-bar" style={{ height: '90%' }} />
                <div className="score-bar" style={{ height: '75%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon icon-blue">📹</div>
            <h3>异步录屏</h3>
            <p>候选人随时录制视频回答，无需实时协调时间</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon icon-orange">🎯</div>
            <h3>多维评分</h3>
            <p>支持1-10分打分和文字、语音双维度评价</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon icon-purple">📊</div>
            <h3>数据洞察</h3>
            <p>雷达图+柱状图，多维度能力分析一目了然</p>
          </div>
        </div>
      </div>

      <style>{`
        .home-page {
          min-height: 100vh;
          padding-bottom: 60px;
        }
        .home-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 40px;
          align-items: center;
        }
        .hero-badge {
          display: inline-block;
          padding: 6px 16px;
          background: rgba(59, 130, 246, 0.15);
          color: var(--color-accent-blue);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 24px;
        }
        .hero-title {
          font-size: 48px;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 20px;
          color: var(--color-text-primary);
        }
        .highlight {
          background: linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-orange));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-desc {
          font-size: 18px;
          color: var(--color-text-secondary);
          line-height: 1.7;
          margin-bottom: 32px;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
        }
        .hero-btn {
          padding: 14px 28px;
          font-size: 16px;
        }
        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .visual-card {
          width: 100%;
          max-width: 400px;
          overflow: hidden;
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .visual-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--color-primary-light);
          border-bottom: 1px solid var(--color-border);
        }
        .visual-dots {
          display: flex;
          gap: 6px;
        }
        .visual-dots span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--color-text-muted);
        }
        .visual-dots span:first-child { background: #ef4444; }
        .visual-dots span:nth-child(2) { background: #f59e0b; }
        .visual-dots span:last-child { background: #10b981; }
        .visual-title {
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .visual-body {
          padding: 20px;
        }
        .video-preview {
          aspect-ratio: 16 / 9;
          background: #000;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }
        .video-preview::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(245, 158, 11, 0.2));
        }
        .play-btn-center {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          padding-left: 4px;
          z-index: 1;
        }
        .score-bars {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 12px;
          height: 80px;
        }
        .score-bar {
          width: 24px;
          background: linear-gradient(to top, var(--color-accent-blue), var(--color-accent-orange));
          border-radius: 4px 4px 0 0;
          transition: height 0.5s ease;
        }
        .features-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .feature-card {
          padding: 32px 24px;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }
        .feature-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin: 0 auto 20px;
        }
        .icon-blue {
          background: rgba(59, 130, 246, 0.15);
        }
        .icon-orange {
          background: rgba(245, 158, 11, 0.15);
        }
        .icon-purple {
          background: rgba(139, 92, 246, 0.15);
        }
        .feature-card h3 {
          font-size: 18px;
          margin-bottom: 10px;
          color: var(--color-text-primary);
        }
        .feature-card p {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        @media (max-width: 900px) {
          .home-hero {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 60px 24px;
            text-align: center;
          }
          .hero-title {
            font-size: 36px;
          }
          .hero-actions {
            justify-content: center;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .hero-title {
            font-size: 28px;
          }
          .hero-desc {
            font-size: 16px;
          }
          .hero-actions {
            flex-direction: column;
          }
          .hero-btn {
            width: 100%;
          }
          .features-section {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
