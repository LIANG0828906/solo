import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BatchCard from '../components/BatchCard';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './BatchList.css';

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

const BatchList: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [search, setSearch] = useState('');
  const [roastFilter, setRoastFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        let query = '';
        const params: string[] = [];

        if (search) {
          params.push(`search=${encodeURIComponent(search)}`);
        }
        if (roastFilter !== 'all') {
          params.push(`roastLevel=${roastFilter}`);
        }

        if (params.length > 0) {
          query = '?' + params.join('&');
        }

        const data = await api.get<Batch[]>(`/batches${query}`);
        setBatches(data);
      } catch (err) {
        console.error('Failed to fetch batches:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchBatches();
    }
  }, [search, roastFilter, authLoading]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleRoastFilter = (level: string) => {
    setRoastFilter(level);
  };

  if (authLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="batch-list-page">
      <Navbar />

      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">我的烘焙批次</h1>
          <p className="page-subtitle">共 {batches.length} 个批次</p>
        </div>

        <div className="filter-bar">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="搜索产地、品种或处理法..."
              value={search}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          <div className="roast-filters">
            <button
              className={`filter-btn ${roastFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleRoastFilter('all')}
            >
              全部
            </button>
            <button
              className={`filter-btn ${roastFilter === 'light' ? 'active' : ''}`}
              onClick={() => handleRoastFilter('light')}
            >
              浅烘
            </button>
            <button
              className={`filter-btn ${roastFilter === 'medium' ? 'active' : ''}`}
              onClick={() => handleRoastFilter('medium')}
            >
              中烘
            </button>
            <button
              className={`filter-btn ${roastFilter === 'dark' ? 'active' : ''}`}
              onClick={() => handleRoastFilter('dark')}
            >
              深烘
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">☕</div>
            <h3>还没有烘焙批次</h3>
            <p>创建你的第一批咖啡，开始风味溯源之旅</p>
            <button className="create-first-btn" onClick={() => navigate('/batch/add')}>
              创建第一批
            </button>
          </div>
        ) : (
          <div className="batch-grid">
            {batches.map((batch, index) => (
              <div
                key={batch.id}
                style={{ animationDelay: `${index * 0.03}s` }}
                className="batch-card-wrapper"
              >
                <BatchCard batch={batch} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchList;
