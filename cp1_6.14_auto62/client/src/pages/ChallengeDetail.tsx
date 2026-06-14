import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Challenge, LeaderboardEntry, DailyRecord, User } from '../types';
import Leaderboard from '../components/Leaderboard';
import GrowthChart from '../components/GrowthChart';
import DailyRecordForm from '../components/DailyRecordForm';
import { useAuth } from '../context/AuthContext';

interface ChallengeDetailData {
  challenge: Challenge;
  participants: User[];
  leaderboard: LeaderboardEntry[];
  myRecords: DailyRecord[];
  myToday: DailyRecord | null;
  isJoined: boolean;
}

const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<ChallengeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [error, setError] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const previousLeaderboardRef = useRef<LeaderboardEntry[]>([]);

  const fetchChallengeData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axios.get(`/challenges/${id}`);
      setData(res.data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch challenge:', err);
      if (err.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchLeaderboard = useCallback(async () => {
    if (!id) return;
    try {
      const startTime = Date.now();
      const res = await axios.get(`/challenges/${id}/leaderboard`);
      const elapsed = Date.now() - startTime;
      
      if (elapsed > 300) {
        console.warn(`Leaderboard response took ${elapsed}ms, exceeds 300ms target`);
      }
      
      const newLeaderboard = res.data.leaderboard.map((entry: LeaderboardEntry, index: number) => ({
        ...entry,
        currentRank: index + 1,
        previousRank: previousLeaderboardRef.current.find(
          prev => prev.user?.id === entry.user?.id
        )?.currentRank || index + 1,
      }));
      
      setLeaderboardData(newLeaderboard);
      previousLeaderboardRef.current = newLeaderboard;
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchChallengeData();
  }, [fetchChallengeData]);

  useEffect(() => {
    if (data?.isJoined) {
      fetchLeaderboard();
      const interval = setInterval(fetchLeaderboard, 15000);
      return () => clearInterval(interval);
    }
  }, [data?.isJoined, fetchLeaderboard]);

  const handleJoinChallenge = async () => {
    if (!id || !user) return;
    try {
      setError('');
      await axios.post(`/challenges/${id}/join`, {
        inviteCode: inviteCode || undefined,
      });
      fetchChallengeData();
      setShowInviteInput(false);
      setInviteCode('');
    } catch (err: any) {
      if (err.response?.data?.error === '邀请码错误') {
        setShowInviteInput(true);
        setError('邀请码错误，请重试');
      } else {
        setError(err.response?.data?.error || '加入失败');
      }
    }
  };

  const handleSubmitRecord = async (count: number) => {
    if (!id) return;
    await axios.post(`/challenges/${id}/records`, { count });
    await Promise.all([
      fetchChallengeData(),
      fetchLeaderboard(),
    ]);
  };

  const getGrowthData = () => {
    if (!data) return [];
    
    const today = new Date();
    const result = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const record = data.myRecords.find(r => r.date === dateStr);
      result.push({
        date: dateStr,
        total: record?.count || 0,
        challenges: { [id!]: record?.count || 0 },
      });
    }
    
    return result;
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <h2 style={{ color: 'var(--text-secondary)' }}>加载中...</h2>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❓</div>
        <h2 style={{ color: 'var(--text-secondary)' }}>挑战不存在</h2>
        <button className="btn" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
          返回首页
        </button>
      </div>
    );
  }

  const { challenge, participants, myRecords, myToday, isJoined } = data;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(challenge.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + challenge.duration);
  
  let status: 'active' | 'upcoming' | 'ended' = 'upcoming';
  if (today >= startDate && today <= endDate) {
    status = 'active';
  } else if (today > endDate) {
    status = 'ended';
  }

  const statusConfig = {
    active: { text: '进行中', color: '#52c41a' },
    upcoming: { text: '即将开始', color: '#1890ff' },
    ended: { text: '已结束', color: '#8c8c8c' },
  };

  const myTotal = myRecords.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="container animate-fade-in">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/')}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          ← 返回
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 700,
                margin: 0,
              }}>
                {challenge.name}
              </h1>
              <span style={{
                padding: '6px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 600,
                background: `${statusConfig[status].color}20`,
                color: statusConfig[status].color,
              }}>
                {statusConfig[status].text}
              </span>
            </div>
            <div style={{
              display: 'flex',
              gap: '24px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
            }}>
              <span>📅 {new Date(challenge.startDate).toLocaleDateString('zh-CN')} - {new Date(endDate).toLocaleDateString('zh-CN')}</span>
              <span>⏱️ {challenge.duration} 天</span>
              <span>🎯 每日 {challenge.dailyGoal} {challenge.unit}</span>
              <span>👥 {participants.length} 人参与</span>
            </div>
          </div>
          
          {!isJoined && status !== 'ended' && (
            <div>
              {showInviteInput && (
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="请输入邀请码"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    style={{ width: '200px', marginBottom: '8px' }}
                  />
                </div>
              )}
              {error && (
                <div style={{
                  padding: '8px 12px',
                  marginBottom: '8px',
                  background: 'rgba(255, 77, 79, 0.15)',
                  borderRadius: '8px',
                  color: '#ff7875',
                  fontSize: '13px',
                }}>
                  {error}
                </div>
              )}
              <button className="btn" onClick={handleJoinChallenge}>
                加入挑战
              </button>
            </div>
          )}
        </div>

        {isJoined && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-orange)' }}>
                {myTotal}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>累计完成</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a' }}>
                {myRecords.length}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>打卡天数</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>
                {Math.round(myTotal / challenge.dailyGoal)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>目标完成</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#722ed1' }}>
                {Math.round((myRecords.length / challenge.duration) * 100)}%
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>参与度</div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {isJoined && (
          <DailyRecordForm
            challenge={challenge}
            todayRecord={myToday}
            onSubmit={handleSubmitRecord}
          />
        )}
        
        <div>
          <h3 style={{
            fontSize: '22px',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            👥 参与者 ({participants.length})
          </h3>
          <div className="glass-card">
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              {participants.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                  }}
                >
                  <img
                    src={p.avatar}
                    alt={p.nickname}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                    }}
                  />
                  <span style={{ fontSize: '14px' }}>{p.nickname}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isJoined && (
        <div style={{ marginBottom: '24px' }}>
          <GrowthChart
            data={getGrowthData()}
            challenges={[challenge]}
            title={`${challenge.name} - 我的成长曲线`}
          />
        </div>
      )}

      {isJoined && (
        <Leaderboard
          entries={leaderboardData.length > 0 ? leaderboardData : data.leaderboard}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
};

export default ChallengeDetail;
