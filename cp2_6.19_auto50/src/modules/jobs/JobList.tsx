import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobStore } from '../../store/useJobStore';
import type { Job } from '../../types';

const departments = ['全部', '技术部', '产品部', '设计部', '数据部'];
const bonusRanges = [
  { label: '全部', min: 0, max: Infinity },
  { label: '1万以下', min: 0, max: 10000 },
  { label: '1万-2万', min: 10000, max: 20000 },
  { label: '2万以上', min: 20000, max: Infinity },
];

function getSuccessRate(referrals: { jobId: string; status: string }[], jobId: string): number {
  const jobReferrals = referrals.filter((r) => r.jobId === jobId);
  if (jobReferrals.length === 0) return -1;
  const hired = jobReferrals.filter((r) => r.status === '已入职').length;
  return Math.round((hired / jobReferrals.length) * 100);
}

function getSuccessRateColor(rate: number): { bg: string; text: string } {
  if (rate < 0) return { bg: '#F1F3F4', text: '#9AA0A6' };
  if (rate >= 60) return { bg: '#E6F4EA', text: '#137333' };
  if (rate >= 30) return { bg: '#FEF7E0', text: '#B06000' };
  return { bg: '#FCE8E6', text: '#C5221F' };
}

function getBonusTier(bonus: number): { bg: string; text: string; border: string } {
  if (bonus >= 20000) return { bg: 'linear-gradient(135deg, #1A73E8 0%, #6EB1FF 100%)', text: '#FFFFFF', border: 'transparent' };
  if (bonus >= 15000) return { bg: 'linear-gradient(135deg, #34A853 0%, #66DF80 100%)', text: '#FFFFFF', border: 'transparent' };
  return { bg: '#FFF3E0', text: '#E65100', border: 'transparent' };
}

export default function JobList() {
  const navigate = useNavigate();
  const jobs = useJobStore((state) => state.jobs);
  const referrals = useJobStore((state) => state.referrals);
  const getLeaderboard = useJobStore((state) => state.getLeaderboard);
  const [selectedDepartment, setSelectedDepartment] = useState('全部');
  const [selectedBonusRange, setSelectedBonusRange] = useState(bonusRanges[0]);
  const [leaderboardJob, setLeaderboardJob] = useState<Job | null>(null);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const deptMatch =
        selectedDepartment === '全部' || job.department === selectedDepartment;
      const bonusMatch =
        job.bonus >= selectedBonusRange.min &&
        job.bonus < selectedBonusRange.max;
      return deptMatch && bonusMatch;
    });
  }, [jobs, selectedDepartment, selectedBonusRange]);

  const leaderboard = leaderboardJob
    ? getLeaderboard(leaderboardJob.id)
    : [];

  const handleCardClick = (jobId: string) => {
    navigate(`/job/${jobId}`);
  };

  const handleLeaderboardClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setLeaderboardJob(job);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>内推职位</h1>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>部门：</span>
          {departments.map((dept) => (
            <button
              key={dept}
              style={{
                ...styles.filterButton,
                ...(selectedDepartment === dept
                  ? styles.filterButtonActive
                  : {}),
              }}
              onClick={() => setSelectedDepartment(dept)}
            >
              {dept}
            </button>
          ))}
        </div>

        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>奖金：</span>
          {bonusRanges.map((range) => (
            <button
              key={range.label}
              style={{
                ...styles.filterButton,
                ...(selectedBonusRange.label === range.label
                  ? styles.filterButtonActive
                  : {}),
              }}
              onClick={() => setSelectedBonusRange(range)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.grid}>
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            style={styles.card}
            onClick={() => handleCardClick(job.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow =
                '0 8px 25px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 2px 8px rgba(0, 0, 0, 0.08)';
            }}
          >
            <div style={styles.cardHeader}>
              <h3 style={styles.jobTitle}>{job.title}</h3>
              <span style={styles.departmentTag}>{job.department}</span>
            </div>

            <div style={styles.cardBody}>
              <div style={styles.jobMeta}>
                <span style={styles.location}>📍 {job.location}</span>
                <span style={styles.salary}>💰 {job.salaryRange}</span>
              </div>
              <p style={styles.description}>
                {job.description.length > 60
                  ? `${job.description.slice(0, 60)}...`
                  : job.description}
              </p>
            </div>

            <div style={styles.cardFooter}>
              <div style={styles.footerLeft}>
                <div
                  style={{
                    ...styles.bonusBadge,
                    background: getBonusTier(job.bonus).bg,
                    color: getBonusTier(job.bonus).text,
                    border: `1px solid ${getBonusTier(job.bonus).border}`,
                  }}
                >
                  <span style={styles.bonusIcon}>💰</span>
                  <span style={styles.bonusText}>¥{job.bonus.toLocaleString()}</span>
                </div>
                {(() => {
                  const rate = getSuccessRate(referrals, job.id);
                  const color = getSuccessRateColor(rate);
                  return (
                    <div
                      style={{
                        ...styles.successRateTag,
                        backgroundColor: color.bg,
                        color: color.text,
                      }}
                    >
                      {rate < 0 ? '暂无数据' : `成功率 ${rate}%`}
                    </div>
                  );
                })()}
              </div>
              <div style={styles.referrerCount}>
                👥 已推荐 {job.referrerCount} 人
              </div>
            </div>

            <button
              style={styles.leaderboardButton}
              onClick={(e) => handleLeaderboardClick(e, job)}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🏆 排行榜
            </button>
          </div>
        ))}
      </div>

      {leaderboardJob && (
        <div style={styles.modalOverlay} onClick={() => setLeaderboardJob(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              🏆 {leaderboardJob.title} - 推荐排行榜
            </h2>
            {leaderboard.length > 0 ? (
              <div style={styles.leaderboardList}>
                {leaderboard.map((entry, index) => (
                  <div key={entry.referrerName} style={styles.leaderboardItem}>
                    <span
                      style={{
                        ...styles.rank,
                        ...(index === 0
                          ? styles.rankGold
                          : index === 1
                          ? styles.rankSilver
                          : index === 2
                          ? styles.rankBronze
                          : {}),
                      }}
                    >
                      {index + 1}
                    </span>
                    <span style={styles.referrerName}>
                      {entry.referrerName}
                    </span>
                    <span style={styles.successCount}>
                      成功入职 {entry.successCount} 人
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.emptyText}>暂无成功入职的推荐记录</p>
            )}
            <button
              style={styles.closeButton}
              onClick={() => setLeaderboardJob(null)}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    backgroundColor: '#F5F5F5',
    minHeight: '100vh',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '24px',
  },
  filters: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: 500,
  },
  filterButton: {
    padding: '8px 16px',
    border: '1px solid #E0E0E0',
    borderRadius: '20px',
    backgroundColor: '#FFFFFF',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  filterButtonActive: {
    backgroundColor: '#1A73E8',
    color: '#FFFFFF',
    borderColor: '#1A73E8',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  jobTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    margin: 0,
    flex: 1,
  },
  departmentTag: {
    padding: '4px 12px',
    backgroundColor: '#E8F0FE',
    color: '#1A73E8',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    marginLeft: '12px',
  },
  cardBody: {
    marginBottom: '16px',
  },
  jobMeta: {
    display: 'flex',
    gap: '16px',
    marginBottom: '8px',
  },
  location: {
    fontSize: '14px',
    color: '#666',
  },
  salary: {
    fontSize: '14px',
    color: '#1A73E8',
    fontWeight: 500,
  },
  description: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.6,
    margin: 0,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #F0F0F0',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  bonusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  bonusIcon: {
    fontSize: '14px',
  },
  bonusText: {
    fontSize: '14px',
    fontWeight: 700,
  },
  successRateTag: {
    padding: '4px 10px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  referrerCount: {
    fontSize: '14px',
    color: '#666',
  },
  leaderboardButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    padding: '6px 12px',
    backgroundColor: '#FFF8E1',
    color: '#FF8F00',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '24px',
    textAlign: 'center',
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#F8F9FA',
    borderRadius: '8px',
  },
  rank: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#E0E0E0',
    color: '#666',
    fontWeight: 600,
    marginRight: '16px',
  },
  rankGold: {
    backgroundColor: '#FFD700',
    color: '#FFFFFF',
  },
  rankSilver: {
    backgroundColor: '#C0C0C0',
    color: '#FFFFFF',
  },
  rankBronze: {
    backgroundColor: '#CD7F32',
    color: '#FFFFFF',
  },
  referrerName: {
    flex: 1,
    fontSize: '14px',
    color: '#333',
    fontWeight: 500,
  },
  successCount: {
    fontSize: '14px',
    color: '#1A73E8',
    fontWeight: 500,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: '40px 0',
    marginBottom: '24px',
  },
  closeButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1A73E8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
  },
};

const mediaQuery = `
  @media (max-width: 1024px) {
    .grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

if (typeof document !== 'undefined') {
  const styleId = 'job-list-media-query';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = mediaQuery;
    document.head.appendChild(style);
  }
}
