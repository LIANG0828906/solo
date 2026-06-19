import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import WorkCard from './components/WorkCard';
import SkeletonCard from './components/SkeletonCard';
import { getWorks } from './api';
import type { Work } from './types';

const WorksList = () => {
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = '首页 - 创作者作品集';
    loadWorks();
  }, []);

  const loadWorks = async () => {
    try {
      const data = await getWorks();
      setWorks(data);
    } catch (error) {
      console.error('Failed to load works:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#cdd6f4', marginBottom: '24px', fontSize: '28px' }}>
        作品列表
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {loading
          ? Array(6)
              .fill(0)
              .map((_, i) => <SkeletonCard key={i} />)
          : works.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
      </div>
    </div>
  );
};

const WorkDetail = () => {
  useEffect(() => {
    document.title = '作品详情 - 创作者作品集';
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', color: '#cdd6f4' }}>
      <h2>作品详情页面</h2>
      <p style={{ color: '#6c7086' }}>作品详情内容将在这里展示</p>
    </div>
  );
};

const StatsDashboard = () => {
  useEffect(() => {
    document.title = '统计看板 - 创作者作品集';
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#cdd6f4' }}>
      <h2>统计看板</h2>
      <p style={{ color: '#6c7086' }}>统计数据将在这里展示</p>
    </div>
  );
};

const App = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorks();
  }, []);

  const loadWorks = async () => {
    try {
      const data = await getWorks();
      setWorks(data);
    } catch (error) {
      console.error('Failed to load works:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWork = () => {
    console.log('Add new work');
  };

  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#181825',
        }}
      >
        <Header />
        <Routes>
          <Route path="/" element={<WorksList />} />
          <Route path="/work/:id" element={<WorkDetail />} />
          <Route path="/admin" element={<StatsDashboard />} />
        </Routes>
        <button
          onClick={handleAddWork}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#cba6f7',
            color: '#1e1e2e',
            border: 'none',
            fontSize: '28px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(203, 166, 247, 0.4)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(203, 166, 247, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(203, 166, 247, 0.4)';
          }}
        >
          +
        </button>
      </div>
    </BrowserRouter>
  );
};

export default App;
