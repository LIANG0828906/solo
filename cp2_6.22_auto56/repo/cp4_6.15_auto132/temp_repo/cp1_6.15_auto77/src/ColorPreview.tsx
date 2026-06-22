import React, { useState } from 'react';
import type { Palette } from './utils/types';
import { adjustBrightness, getContrastColor } from './utils/colorUtils';
import { Layout, Menu, Bell, User, Star, Heart, Bookmark } from 'lucide-react';

interface ColorPreviewProps {
  palette: Palette | null;
  animating: boolean;
}

const ColorPreview: React.FC<ColorPreviewProps> = ({ palette, animating }) => {
  const [buttonPressed, setButtonPressed] = useState(false);

  if (!palette || palette.colors.length < 5) {
    return (
      <div className="preview-empty">
        <style>{`
          .preview-empty {
            padding: 24px;
            background: var(--bg-card);
            border-radius: var(--radius-card);
            box-shadow: var(--shadow-soft);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: var(--text-secondary);
            font-size: 14px;
            transition: all var(--transition-normal);
          }
        `}</style>
        <p>请选择一个配色方案预览效果</p>
      </div>
    );
  }

  const [bgColor, cardBg, buttonColor, textColor, accentColor] = palette.colors;
  const btnHoverColor = adjustBrightness(buttonColor, -15);
  const contrastText = getContrastColor(buttonColor);
  const cardText = getContrastColor(cardBg);
  const navText = getContrastColor(bgColor);

  return (
    <div className={`color-preview ${animating ? 'preview-fading' : ''}`}>
      <style>{`
        .color-preview {
          padding: 24px;
          background: var(--bg-card);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-soft);
          transition: opacity var(--transition-slow);
          opacity: 1;
        }
        .color-preview.preview-fading {
          opacity: 0.3;
        }
        .preview-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 20px;
          color: var(--text-primary);
        }
        .preview-container {
          border-radius: 10px;
          overflow: hidden;
          transition: all var(--transition-slow);
        }
        .preview-navbar {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          gap: 20px;
          background: ${bgColor};
          transition: background var(--transition-slow);
        }
        .preview-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 15px;
          color: ${navText};
        }
        .preview-nav-links {
          display: flex;
          gap: 16px;
          flex: 1;
        }
        .preview-nav-link {
          font-size: 13px;
          color: ${navText};
          opacity: 0.75;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .preview-nav-link:hover {
          opacity: 1;
        }
        .preview-nav-icons {
          display: flex;
          gap: 12px;
        }
        .preview-nav-icon {
          color: ${navText};
          opacity: 0.75;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .preview-nav-icon:hover {
          opacity: 1;
          transform: scale(1.1);
        }
        .preview-content {
          background: ${adjustBrightness(bgColor, -5)};
          padding: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          transition: background var(--transition-slow);
        }
        .preview-card {
          flex: 1;
          min-width: 200px;
          background: ${cardBg};
          border-radius: 10px;
          padding: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
          border: 1px solid ${accentColor}30;
          cursor: pointer;
          transition: all var(--transition-normal);
        }
        .preview-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        }
        .preview-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: ${buttonColor}20;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${buttonColor};
          margin-bottom: 12px;
        }
        .preview-card-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
          color: ${cardText};
        }
        .preview-card-desc {
          font-size: 12px;
          color: ${cardText};
          opacity: 0.65;
          line-height: 1.5;
        }
        .preview-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid ${textColor}20;
        }
        .preview-tag {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 4px;
          background: ${accentColor}20;
          color: ${accentColor};
          font-weight: 500;
        }
        .preview-actions {
          display: flex;
          gap: 16px;
          padding: 16px 20px;
          background: ${bgColor};
          align-items: center;
          flex-wrap: wrap;
          transition: background var(--transition-slow);
        }
        .preview-btn {
          padding: 10px 24px;
          background: ${buttonColor};
          color: ${contrastText};
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          transform: scale(1);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .preview-btn:hover {
          background: ${btnHoverColor};
        }
        .preview-btn.pressed {
          transform: scale(0.9);
        }
        .preview-btn-secondary {
          padding: 10px 20px;
          background: transparent;
          color: ${textColor};
          border: 1px solid ${textColor}40;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .preview-btn-secondary:hover {
          border-color: ${textColor}80;
          background: ${textColor}10;
        }
        .preview-color-dots {
          margin-left: auto;
          display: flex;
          gap: 6px;
        }
        .preview-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform var(--transition-fast);
        }
        .preview-dot:hover {
          transform: scale(1.2);
        }
        @media (max-width: 768px) {
          .preview-content {
            flex-direction: column;
          }
          .preview-card {
            min-width: 100%;
          }
          .preview-nav-links {
            display: none;
          }
          .preview-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .preview-color-dots {
            margin-left: 0;
            justify-content: center;
          }
        }
      `}</style>
      <div className="preview-title">UI 预览 - {palette.name}</div>
      <div className="preview-container">
        <div className="preview-navbar">
          <div className="preview-logo">
            <Layout size={18} />
            <span>ColorLab</span>
          </div>
          <div className="preview-nav-links">
            <span className="preview-nav-link">首页</span>
            <span className="preview-nav-link">作品</span>
            <span className="preview-nav-link">探索</span>
            <span className="preview-nav-link">关于</span>
          </div>
          <div className="preview-nav-icons">
            <Bell size={18} className="preview-nav-icon" />
            <User size={18} className="preview-nav-icon" />
          </div>
        </div>

        <div className="preview-content">
          <div className="preview-card">
            <div className="preview-card-icon"><Star size={18} /></div>
            <div className="preview-card-title">精选作品</div>
            <div className="preview-card-desc">发现社区中最受欢迎的色彩搭配方案，获取创作灵感。</div>
            <div className="preview-card-footer">
              <span className="preview-tag">热门</span>
              <span style={{ fontSize: 11, color: cardText, opacity: 0.5 }}>2.4k 浏览</span>
            </div>
          </div>

          <div className="preview-card">
            <div className="preview-card-icon"><Heart size={18} /></div>
            <div className="preview-card-title">我的收藏</div>
            <div className="preview-card-desc">收藏喜欢的配色方案，随时访问和使用。</div>
            <div className="preview-card-footer">
              <span className="preview-tag">12 个</span>
              <Heart size={14} style={{ color: accentColor, fill: accentColor }} />
            </div>
          </div>

          <div className="preview-card">
            <div className="preview-card-icon"><Bookmark size={18} /></div>
            <div className="preview-card-title">历史记录</div>
            <div className="preview-card-desc">查看最近使用过的配色方案，快速恢复工作状态。</div>
            <div className="preview-card-footer">
              <span className="preview-tag">最近</span>
              <span style={{ fontSize: 11, color: cardText, opacity: 0.5 }}>10 条</span>
            </div>
          </div>
        </div>

        <div className="preview-actions">
          <button
            className={`preview-btn ${buttonPressed ? 'pressed' : ''}`}
            onMouseDown={() => setButtonPressed(true)}
            onMouseUp={() => setButtonPressed(false)}
            onMouseLeave={() => setButtonPressed(false)}
          >
            <Star size={16} />
            立即使用
          </button>
          <button className="preview-btn-secondary">了解更多</button>
          <div className="preview-color-dots">
            {palette.colors.map((c, i) => (
              <div key={i} className="preview-dot" style={{ background: c }} title={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ColorPreview);
