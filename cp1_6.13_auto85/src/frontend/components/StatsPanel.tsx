import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Stats {
  totalDecks: number;
  totalCards: number;
  dueToday: number;
  masteryRate: number;
}

const StatsPanel: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cacheRef = useRef<{ data: Stats; timestamp: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const now = Date.now();
      
      if (cacheRef.current && (now - cacheRef.current.timestamp < 10000)) {
        setStats(cacheRef.current.data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:3001/api/stats');
        cacheRef.current = { data: response.data, timestamp: now };
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="stats-panel">
        <h2>Stats</h2>
        <div className="loading-spinner-small"></div>
      </div>
    );
  }

  return (
    <div className="stats-panel">
      <h2>📊 Statistics</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalDecks || 0}</div>
          <div className="stat-label">Decks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalCards || 0}</div>
          <div className="stat-label">Cards</div>
        </div>
        <div className="stat-card">
          <div className="stat-value due">{stats?.dueToday || 0}</div>
          <div className="stat-label">Due Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value mastery">{stats?.masteryRate || 0}%</div>
          <div className="stat-label">Mastery</div>
        </div>
      </div>

      <style>{`
        .stats-panel {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .stats-panel h2 {
          color: #1F2937;
          margin: 0 0 20px 0;
          font-size: 18px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .stat-card {
          background: #F9FAFB;
          border-radius: 12px;
          padding: 15px;
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #4F46E5;
          margin-bottom: 4px;
        }

        .stat-value.due {
          color: #F59E0B;
        }

        .stat-value.mastery {
          color: #10B981;
        }

        .stat-label {
          font-size: 12px;
          color: #6B7280;
        }

        .loading-spinner-small {
          width: 24px;
          height: 24px;
          border: 3px solid #E5E7EB;
          border-top-color: #4F46E5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .stats-panel {
            padding: 15px;
          }

          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .stat-card {
            padding: 10px 5px;
          }

          .stat-value {
            font-size: 18px;
          }

          .stat-label {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default StatsPanel;