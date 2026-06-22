import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MatchedItem } from '../types';
import { showToast } from '../utils/toast';

interface MatchPanelProps {
  itemId: string;
}

const MatchPanel: React.FC<MatchPanelProps> = ({ itemId }) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/match/${itemId}`);
        setMatches(response.data);
      } catch {
        showToast('获取匹配结果失败', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [itemId]);

  const getMatchColor = (score: number): string => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#3B82F6';
    return '#F59E0B';
  };

  const handleMatchClick = (matchId: string) => {
    navigate(`/item/${matchId}`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        正在匹配...
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="match-empty">
        暂无匹配结果，系统将持续为您监控新发布的物品
      </div>
    );
  }

  return (
    <div>
      {matches.map((match) => (
        <div
          key={match.id}
          className="match-item"
          onClick={() => handleMatchClick(match.id)}
        >
          <div className="match-item-header">
            <span className="match-item-name">{match.name}</span>
            <span style={{ fontSize: '12px', color: getMatchColor(match.matchScore), fontWeight: 600 }}>
              {match.matchScore}%
            </span>
          </div>
          <div className="match-item-location">
            📍 {match.location} · {match.type === 'lost' ? '寻物' : '招领'}
          </div>
          <div className="match-score-bar-container">
            <div
              className="match-score-bar"
              style={{
                width: `${match.matchScore}%`,
                background: `linear-gradient(90deg, #F59E0B, ${getMatchColor(match.matchScore)})`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchPanel;
