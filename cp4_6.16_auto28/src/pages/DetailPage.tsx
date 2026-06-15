import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ColorCard from '@/modules/colors/ColorCard';
import GradientPreview from '@/modules/explore/GradientPreview';
import { loadPaletteById } from '@/utils/indexedDB';
import type { Palette } from '@/types';
import './DetailPage.css';

const DetailPage: React.FC = () => {
  const { colorId } = useParams<{ colorId: string }>();
  const [palette, setPalette] = useState<Palette | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPalette = async () => {
      if (!colorId) return;
      setLoading(true);
      try {
        const data = await loadPaletteById(colorId);
        setPalette(data || null);
      } catch (error) {
        console.error('加载色卡失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPalette();
  }, [colorId]);

  if (!colorId) {
    return (
      <div className="detail-page container">
        <div className="error-state">
          <p>无效的色卡ID</p>
          <Link to="/" className="btn btn-primary">
            返回探索页
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="detail-page container">
        <div className="detail-skeleton">
          <div className="skeleton-card-large" />
          <div className="skeleton-gradient" />
        </div>
      </div>
    );
  }

  if (!palette) {
    return (
      <div className="detail-page container">
        <div className="error-state">
          <p>色卡不存在或已被删除</p>
          <Link to="/" className="btn btn-primary">
            返回探索页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page container">
      <div className="detail-header">
        <Link to="/" className="back-link">
          ← 返回探索
        </Link>
        <h1 className="detail-title">{palette.title}</h1>
        <p className="detail-meta">
          创建于 {new Date(palette.createdAt).toLocaleDateString('zh-CN')}
        </p>
      </div>

      <div className="detail-content">
        <div className="detail-card-wrapper">
          <ColorCard colorId={colorId} showFullColors={true} />
        </div>

        <div className="detail-gradient">
          <GradientPreview colorId={colorId} />
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
