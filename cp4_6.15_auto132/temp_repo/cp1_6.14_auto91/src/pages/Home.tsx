import React, { useState, useEffect } from 'react';
import FosterCard from '../components/Card';
import { getFosterList, FosterFamily } from '../api';

const Home: React.FC = () => {
  const [families, setFamilies] = useState<FosterFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getFosterList();
        if (!cancelled) setFamilies(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-wrapper">
      <h1 className="page-title">为您推荐的寄养家庭</h1>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <div>正在加载寄养家庭...</div>
        </div>
      )}

      {error && (
        <div className="empty-state">
          <div className="empty-state-icon">😿</div>
          <div className="empty-state-text">加载失败：{error}</div>
        </div>
      )}

      {!loading && !error && families.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🏡</div>
          <div className="empty-state-text">暂无寄养家庭</div>
        </div>
      )}

      {!loading && !error && families.length > 0 && (
        <div className="foster-grid">
          {families.map((f) => (
            <FosterCard key={f.id} family={f} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
