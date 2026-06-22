import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Challenge, LeaderboardEntry } from '../types';
import ChallengeList from '../components/ChallengeList';
import Leaderboard from '../components/Leaderboard';
import CreateChallengeModal from '../components/CreateChallengeModal';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [challengesRes] = await Promise.all([
        axios.get('/challenges'),
      ]);
      setChallenges(challengesRes.data.challenges);
      
      if (challengesRes.data.challenges.length > 0) {
        const firstChallengeId = challengesRes.data.challenges[0].id;
        try {
          const lbRes = await axios.get(`/challenges/${firstChallengeId}/leaderboard`);
          setLeaderboard(lbRes.data.leaderboard);
        } catch {
          setLeaderboard([]);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateChallenge = async (data: {
    name: string;
    duration: 7 | 14 | 30;
    dailyGoal: number;
    unit: string;
    startDate: string;
    inviteCode?: string;
  }) => {
    try {
      await axios.post('/challenges', data);
      fetchData();
    } catch (err: any) {
      console.error('Failed to create challenge:', err);
      alert(err.response?.data?.error || '创建失败');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <h2 style={{ color: 'var(--text-secondary)' }}>加载中...</h2>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #ff8c00 0%, #ffa940 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            🔥 健身挑战打榜
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            加入挑战，记录每一天，成为更好的自己
          </p>
        </div>
        <button
          className="btn"
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '14px 32px',
            fontSize: '16px',
          }}
        >
          + 创建挑战
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '32px',
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 600,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            📋 挑战列表
          </h2>
          <ChallengeList challenges={challenges} />
        </div>
        
        <div>
          <Leaderboard 
            entries={leaderboard} 
            currentUserId={user?.id}
          />
        </div>
      </div>

      <CreateChallengeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateChallenge}
      />
    </div>
  );
};

export default Home;
