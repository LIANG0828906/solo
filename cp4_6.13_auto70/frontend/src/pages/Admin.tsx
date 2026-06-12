import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

interface Seat {
  id: string;
  seat_number: string;
  floor: number;
  status: string;
}

interface UserStats {
  id: string;
  username: string;
  nickname: string;
  role: string;
  total_duration: number;
  weekly_duration: number;
}

const Admin: React.FC = () => {
  const { token } = useAuth();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [activeTab, setActiveTab] = useState<'seats' | 'users'>('seats');
  const [loading, setLoading] = useState(true);
  const [flashSeatId, setFlashSeatId] = useState<string | null>(null);

  const fetchSeats = useCallback(async () => {
    try {
      const response = await fetch('/api/seats/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSeats(data.seats || []);
      }
    } catch (error) {
      console.error('Failed to fetch seats:', error);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/seats/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSeats(), fetchUsers()]).finally(() => setLoading(false));
  }, [fetchSeats, fetchUsers]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSeats();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchSeats]);

  const handleRelease = async (seatId: string) => {
    try {
      const response = await fetch('/api/seats/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seatId }),
      });

      if (response.ok) {
        setFlashSeatId(seatId);
        setTimeout(() => setFlashSeatId(null), 500);
        fetchSeats();
      }
    } catch (error) {
      console.error('Failed to release seat:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return '#E74C3C';
      case 'reserved':
        return '#F1C40F';
      default:
        return '#27AE60';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'occupied':
        return '占用中';
      case 'reserved':
        return '已预约';
      default:
        return '空闲';
    }
  };

  const seatStats = {
    total: seats.length,
    available: seats.filter((s) => s.status === 'available').length,
    occupied: seats.filter((s) => s.status === 'occupied').length,
    reserved: seats.filter((s) => s.status === 'reserved').length,
  };

  return (
    <div className="page-transition" style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>管理后台</h1>

        <div style={styles.tabs}>
          <button
            className="btn"
            onClick={() => setActiveTab('seats')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'seats' ? 'var(--accent-color)' : 'var(--gray-bg)',
              color: activeTab === 'seats' ? 'white' : 'var(--primary-color)',
            }}
          >
            座位总览
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('users')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'users' ? 'var(--accent-color)' : 'var(--gray-bg)',
              color: activeTab === 'users' ? 'white' : 'var(--primary-color)',
            }}
          >
            用户统计
          </button>
        </div>

        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : (
          <>
            {activeTab === 'seats' && (
              <div>
                <div style={styles.statsRow}>
                  <div className="card" style={styles.statCard}>
                    <div style={styles.statNumber}>{seatStats.total}</div>
                    <div style={styles.statLabel}>总座位数</div>
                  </div>
                  <div className="card" style={{ ...styles.statCard, borderLeft: '4px solid #27AE60' }}>
                    <div style={{ ...styles.statNumber, color: '#27AE60' }}>{seatStats.available}</div>
                    <div style={styles.statLabel}>空闲</div>
                  </div>
                  <div className="card" style={{ ...styles.statCard, borderLeft: '4px solid #E74C3C' }}>
                    <div style={{ ...styles.statNumber, color: '#E74C3C' }}>{seatStats.occupied}</div>
                    <div style={styles.statLabel}>占用中</div>
                  </div>
                  <div className="card" style={{ ...styles.statCard, borderLeft: '4px solid #F1C40F' }}>
                    <div style={{ ...styles.statNumber, color: '#F1C40F' }}>{seatStats.reserved}</div>
                    <div style={styles.statLabel}>已预约</div>
                  </div>
                </div>

                {[1, 2, 3].map((floor) => (
                  <div key={floor} className="card" style={styles.floorSection}>
                    <h3 style={styles.floorTitle}>{floor}楼</h3>
                    <div style={styles.seatList}>
                      {seats
                        .filter((s) => s.floor === floor)
                        .map((seat) => (
                          <div
                            key={seat.id}
                            className="card"
                            style={{
                              ...styles.seatItem,
                              animation: flashSeatId === seat.id ? 'flash 0.5s ease' : 'none',
                            }}
                          >
                            <div style={styles.seatInfo}>
                              <span style={styles.seatNumber}>{seat.seat_number}</span>
                              <span
                                style={{
                                  ...styles.seatStatus,
                                  color: getStatusColor(seat.status),
                                }}
                              >
                                {getStatusText(seat.status)}
                              </span>
                            </div>
                            {seat.status === 'occupied' && (
                              <button
                                className="btn btn-danger"
                                onClick={() => handleRelease(seat.id)}
                                style={styles.releaseBtn}
                              >
                                释放
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="card" style={styles.userListCard}>
                <h3 style={styles.userListTitle}>用户学习排行榜</h3>
                <div style={styles.userList}>
                  {users.length > 0 ? (
                    users.map((user, index) => (
                      <div key={user.id} className="card" style={styles.userItem}>
                        <div style={styles.userRank}>
                          <span
                            style={{
                              ...styles.rankNumber,
                              color: index < 3 ? 'var(--accent-color)' : '#7F8C8D',
                            }}
                          >
                            {index + 1}
                          </span>
                        </div>
                        <div style={styles.userInfo}>
                          <div style={styles.userName}>
                            {user.nickname}
                            {user.role === 'admin' && (
                              <span style={styles.adminBadge}>管理员</span>
                            )}
                          </div>
                          <div style={styles.userSub}>@{user.username}</div>
                        </div>
                        <div style={styles.userStats}>
                          <div style={styles.userStat}>
                            <span style={styles.userStatValue}>{formatDuration(user.total_duration)}</span>
                            <span style={styles.userStatLabel}>累计</span>
                          </div>
                          <div style={styles.userStat}>
                            <span style={styles.userStatValue}>{formatDuration(user.weekly_duration)}</span>
                            <span style={styles.userStatLabel}>本周</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.emptyState}>暂无用户数据</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes flash {
          0%, 100% { background-color: white; }
          50% { background-color: #27AE60; opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#FAFBFC',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    marginBottom: '20px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tabBtn: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#7F8C8D',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    padding: '16px',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#7F8C8D',
  },
  floorSection: {
    padding: '20px',
    marginBottom: '16px',
  },
  floorTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--primary-color)',
    marginBottom: '16px',
  },
  seatList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  seatItem: {
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: '12px',
  },
  seatInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  seatNumber: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--primary-color)',
  },
  seatStatus: {
    fontSize: '12px',
    fontWeight: 500,
  },
  releaseBtn: {
    padding: '6px 16px',
    fontSize: '12px',
    transition: 'all 0.2s ease',
  },
  userListCard: {
    padding: '20px',
  },
  userListTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--primary-color)',
    marginBottom: '16px',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userItem: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderRadius: '12px',
  },
  userRank: {
    width: '30px',
    textAlign: 'center',
  },
  rankNumber: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--primary-color)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  adminBadge: {
    fontSize: '10px',
    padding: '2px 6px',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    borderRadius: '4px',
  },
  userSub: {
    fontSize: '12px',
    color: '#7F8C8D',
    marginTop: '2px',
  },
  userStats: {
    display: 'flex',
    gap: '24px',
  },
  userStat: {
    textAlign: 'right',
  },
  userStatValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--accent-color)',
    display: 'block',
  },
  userStatLabel: {
    fontSize: '11px',
    color: '#7F8C8D',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#BDC3C7',
    fontSize: '14px',
  },
};

export default Admin;
