import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TripRecord,
  Achievement,
  TRANSPORT_OPTIONS,
  LeaderboardUser,
} from './Types';
import {
  aggregateDailyStats,
  calculateTotalSaved,
  getTripsByMode,
  calculateGreenTripRatio,
  calculateMonthlySaved,
  calculateMaxGreenStreak,
  generateLeaderboard,
  animateNumber,
} from './utils';

interface StatsDashboardProps {
  trips: TripRecord[];
  achievements: Achievement[];
}

const COLORS = ['#2E7D32', '#4CAF50', '#81C784', '#FFC107', '#FF9800', '#F44336'];
const PIE_COLORS = ['#2E7D32', '#E0E0E0'];

const AnimatedNumber: React.FC<{ value: number; suffix?: string; decimals?: number; duration?: number }> = ({
  value,
  suffix = '',
  decimals = 0,
  duration = 800,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const cancel = animateNumber(prevValue.current, value, duration, (v) => {
      setDisplayValue(v);
    });
    prevValue.current = value;
    return cancel;
  }, [value, duration]);

  return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
};

const ProgressRing: React.FC<{
  totalSaved: number;
  size?: number;
  strokeWidth?: number;
}> = ({ totalSaved, size = 200, strokeWidth = 12 }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [displayTotal, setDisplayTotal] = useState(0);
  const prevSaved = useRef(0);

  useEffect(() => {
    const maxThreshold = 500000;
    const targetProgress = Math.min((totalSaved / maxThreshold) * 100, 100);
    const cancel1 = animateNumber(prevSaved.current, targetProgress, 1200, (v) => {
      setAnimatedProgress(v);
    });
    const cancel2 = animateNumber(prevSaved.current, totalSaved, 1200, (v) => {
      setDisplayTotal(v);
    });
    prevSaved.current = totalSaved;
    return () => {
      cancel1();
      cancel2();
    };
  }, [totalSaved]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E8F5E9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#81C784" />
            <stop offset="100%" stopColor="#2E7D32" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--primary-green)',
        }}>
          {(displayTotal / 1000).toFixed(1)} kg
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--text-gray)',
          marginTop: 4,
        }}>
          累计减碳
        </div>
      </div>
    </div>
  );
};

const SparkleEffect: React.FC = () => {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    delay: i * 0.08,
    size: 4 + (i % 3) * 3,
  }));

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, #FFD700 0%, #FFA500 50%, transparent 70%)',
            borderRadius: '50%',
            animation: `sparkle 1.5s ease-in-out ${p.delay}s infinite`,
            transform: `rotate(${p.angle}deg) translateY(-45px)`,
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 0 6px #FFD700',
          }}
        />
      ))}
    </>
  );
};

const AchievementCard: React.FC<{ achievement: Achievement; isNew: boolean }> = ({ achievement, isNew }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isRecentlyUnlocked = achievement.unlocked && achievement.unlockedAt && Date.now() - achievement.unlockedAt < 8000;

  return (
    <div
      style={{
        ...styles.achievementCard,
        ...(achievement.unlocked ? styles.achievementUnlocked : styles.achievementLocked),
        ...(isHovered && achievement.unlocked ? styles.achievementHovered : {}),
        animation: isRecentlyUnlocked || isNew ? 'bounce 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55) 2' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {((isRecentlyUnlocked || isNew) && achievement.unlocked) && <SparkleEffect />}
      <div style={{
        ...styles.achievementIconWrapper,
        filter: achievement.unlocked ? 'none' : 'grayscale(100%) opacity(0.5)',
        transform: isHovered && achievement.unlocked ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {achievement.unlocked ? achievement.icon : '🔒'}
      </div>
      <div style={styles.achievementName}>
        {achievement.name}
      </div>
      <div style={{
        ...styles.achievementDesc,
        opacity: achievement.unlocked ? 1 : 0.6,
      }}>
        {achievement.description}
      </div>
      <div style={{
        ...styles.achievementStatus,
        backgroundColor: achievement.unlocked ? 'var(--primary-green)' : '#9E9E9E',
      }}>
        {achievement.unlocked ? '✓ 已解锁' : '🔒 未解锁'}
      </div>
    </div>
  );
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ trips, achievements }) => {
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [newlyUnlockedIds, setNewlyUnlockedIds] = useState<Set<string>>(new Set());
  const [lastUpdateKey, setLastUpdateKey] = useState(0);
  const prevUnlockedCount = useRef(0);

  const dailyStats = aggregateDailyStats(trips, 7);
  const totalSaved = calculateTotalSaved(trips);
  const tripsByMode = getTripsByMode(trips);
  const greenRatio = calculateGreenTripRatio(trips);
  const monthlySaved = calculateMonthlySaved(trips);
  const maxStreak = calculateMaxGreenStreak(trips);

  const todayEmission = dailyStats[dailyStats.length - 1]?.totalEmission || 0;

  useEffect(() => {
    setLeaderboard(generateLeaderboard(trips, leaderboardPeriod));
  }, [trips, leaderboardPeriod, lastUpdateKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateKey((k) => k + 1);
    }, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentUnlocked = achievements.filter((a) => a.unlocked).length;
    if (currentUnlocked > prevUnlockedCount.current) {
      const newIds = new Set(
        achievements
          .filter((a) => a.unlocked)
          .map((a) => a.id)
      );
      setNewlyUnlockedIds(newIds);
      setTimeout(() => setNewlyUnlockedIds(new Set()), 5000);
    }
    prevUnlockedCount.current = currentUnlocked;
  }, [achievements]);

  const barData = TRANSPORT_OPTIONS.map((opt) => ({
    name: opt.label,
    value: Number(tripsByMode[opt.mode].toFixed(1)),
    icon: opt.icon,
  }));

  const pieData = [
    { name: '绿色出行', value: greenRatio },
    { name: '其他出行', value: 100 - greenRatio },
  ];

  const lineData = dailyStats.map((s) => ({
    date: s.date.slice(5),
    碳排放: Number((s.totalEmission / 1000).toFixed(2)),
    减碳量: Number((s.totalSaved / 1000).toFixed(2)),
  }));

  const handlePeriodChange = (period: 'weekly' | 'monthly') => {
    setLeaderboardPeriod(period);
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🌿 碳排放概览</h2>
        <div style={styles.overviewGrid}>
          <div style={styles.progressRingContainer}>
            <ProgressRing totalSaved={totalSaved} />
          </div>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🚗</div>
              <div>
                <div style={styles.statLabel}>今日碳排</div>
                <div style={styles.statValue}>
                  <AnimatedNumber value={todayEmission} decimals={0} suffix=" g" />
                </div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: '#E8F5E9' }}>🌿</div>
              <div>
                <div style={styles.statLabel}>本月减碳</div>
                <div style={{ ...styles.statValue, color: 'var(--primary-green)' }}>
                  <AnimatedNumber value={monthlySaved / 1000} decimals={1} suffix=" kg" />
                </div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: '#FFF8E1' }}>🔥</div>
              <div>
                <div style={styles.statLabel}>连续绿色出行</div>
                <div style={{ ...styles.statValue, color: '#F57C00' }}>
                  <AnimatedNumber value={maxStreak} suffix=" 天" />
                </div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: '#FCE4EC' }}>📊</div>
              <div>
                <div style={styles.statLabel}>总出行次数</div>
                <div style={styles.statValue}>
                  <AnimatedNumber value={trips.length} suffix=" 次" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📈 数据统计</h2>
        <div style={styles.chartsGrid}>
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>近7天碳排趋势</h3>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="碳排放"
                    stroke="#F44336"
                    strokeWidth={2.5}
                    dot={{ fill: '#F44336', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="减碳量"
                    stroke="#2E7D32"
                    strokeWidth={2.5}
                    dot={{ fill: '#2E7D32', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>各出行方式里程</h3>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="里程(km)"
                    animationDuration={900}
                    animationEasing="ease-out"
                    radius={[6, 6, 0, 0]}
                  >
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>绿色出行占比</h3>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    animationDuration={1000}
                    animationEasing="ease-out"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🏆 环保成就</h2>
        <div style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isNew={newlyUnlockedIds.has(achievement.id)}
            />
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🏅 荣誉排行榜</h2>
        <div style={styles.leaderboard}>
          <div style={styles.leaderboardTabs}>
            <button
              style={{
                ...styles.tabButton,
                ...(leaderboardPeriod === 'weekly' ? styles.activeTab : {}),
              }}
              onClick={() => handlePeriodChange('weekly')}
            >
              周榜
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(leaderboardPeriod === 'monthly' ? styles.activeTab : {}),
              }}
              onClick={() => handlePeriodChange('monthly')}
            >
              月榜
            </button>
          </div>
          <div key={leaderboardPeriod + lastUpdateKey} style={styles.leaderboardList}>
            {leaderboard.map((user, index) => (
              <div
                key={user.id}
                style={{
                  ...styles.leaderboardItem,
                  ...(user.isCurrentUser ? styles.currentUserItem : {}),
                  animation: `fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s both`,
                }}
              >
                <div style={{
                  ...styles.rankBadge,
                  ...(index === 0 ? styles.rankGold : index === 1 ? styles.rankSilver : index === 2 ? styles.rankBronze : {}),
                }}>
                  {index + 1}
                </div>
                <div style={styles.userAvatar}>{user.avatar}</div>
                <div style={styles.userName}>
                  <div style={styles.userNameText}>{user.name}</div>
                  {user.isCurrentUser && <span style={styles.currentUserTag}>就是你</span>}
                </div>
                <div style={styles.userScore}>
                  <AnimatedNumber
                    value={leaderboardPeriod === 'weekly' ? user.weeklySaved : user.monthlySaved}
                    decimals={1}
                    suffix=" kg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--text-dark)',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  overviewGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    alignItems: 'center',
  },
  progressRingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 200,
    flexShrink: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    flex: 1,
    minWidth: 300,
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'var(--bg-gray)',
    borderRadius: 12,
    transition: 'var(--transition)',
  },
  statIcon: {
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    borderRadius: 12,
    background: '#E3F2FD',
    flexShrink: 0,
  },
  statLabel: {
    fontSize: 13,
    color: 'var(--text-gray)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-dark)',
    marginTop: 2,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16,
  },
  chartCard: {
    backgroundColor: 'var(--bg-gray)',
    borderRadius: 12,
    padding: 16,
    transition: 'var(--transition)',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-dark)',
    marginBottom: 12,
  },
  chartContainer: {
    width: '100%',
  },
  achievementsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 16,
  },
  achievementCard: {
    position: 'relative',
    padding: 20,
    borderRadius: 16,
    textAlign: 'center',
    transition: 'var(--transition)',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  achievementIconWrapper: {
    fontSize: 44,
    marginBottom: 4,
  },
  achievementUnlocked: {
    background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    border: '2px solid var(--primary-green-light)',
  },
  achievementLocked: {
    backgroundColor: '#F5F5F5',
    border: '2px solid #E0E0E0',
  },
  achievementHovered: {
    transform: 'translateY(-6px)',
    boxShadow: '0 12px 32px rgba(46, 125, 50, 0.25)',
  },
  achievementName: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-dark)',
    marginTop: 8,
  },
  achievementDesc: {
    fontSize: 12,
    color: 'var(--text-gray)',
    marginTop: 4,
  },
  achievementStatus: {
    display: 'inline-block',
    marginTop: 12,
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 11,
    color: '#fff',
    fontWeight: 500,
  },
  leaderboard: {
    backgroundColor: 'var(--bg-gray)',
    borderRadius: 12,
    padding: 16,
  },
  leaderboardTabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    padding: '8px 24px',
    borderRadius: 20,
    border: 'none',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'var(--transition)',
    backgroundColor: '#fff',
    color: 'var(--text-gray)',
    fontFamily: 'inherit',
  },
  activeTab: {
    backgroundColor: 'var(--primary-green)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)',
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    backgroundColor: '#fff',
    borderRadius: 10,
    transition: 'var(--transition)',
    opacity: 0,
  },
  currentUserItem: {
    background: 'linear-gradient(135deg, #E8F5E9 0%, #A5D6A7 100%)',
    fontWeight: 600,
    border: '2px solid var(--primary-green-light)',
    boxShadow: '0 2px 8px rgba(46, 125, 50, 0.15)',
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    backgroundColor: '#BDBDBD',
    flexShrink: 0,
  },
  rankGold: {
    backgroundColor: '#FFD700',
    color: '#8B6914',
    boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
  },
  rankSilver: {
    backgroundColor: '#C0C0C0',
    color: '#555',
    boxShadow: '0 2px 8px rgba(192, 192, 192, 0.4)',
  },
  rankBronze: {
    backgroundColor: '#CD7F32',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(205, 127, 50, 0.4)',
  },
  userAvatar: {
    fontSize: 26,
    flexShrink: 0,
  },
  userName: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-dark)',
  },
  currentUserTag: {
    fontSize: 10,
    color: 'var(--primary-green)',
    fontWeight: 600,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    padding: '2px 6px',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  userScore: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--primary-green)',
    flexShrink: 0,
  },
};

export default StatsDashboard;
