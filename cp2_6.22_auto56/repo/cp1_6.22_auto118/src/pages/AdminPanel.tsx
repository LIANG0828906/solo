import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllProgress } from '../services/api';

interface ProgressRow {
  classId: string;
  className: string;
  groupId: string;
  groupName: string;
  members: string[];
  progress: number;
  tasks: { id: string; description: string }[];
  submissions: { text: string; rating: number; timestamp: number }[];
}

const styles = {
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  title: {
    color: '#1B3A5C',
    fontSize: 28,
    fontWeight: 700 as const,
    marginBottom: 24,
  },
  backLink: {
    display: 'inline-block',
    marginBottom: 20,
    color: '#1B3A5C',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600 as const,
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(27,58,92,0.08)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    background: '#fff',
    fontSize: 14,
  },
  th: {
    background: '#1B3A5C',
    color: '#fff',
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontWeight: 600 as const,
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
    whiteSpace: 'nowrap' as const,
  },
  rowEven: {
    background: '#F9F9F9',
  },
  rowHover: {
    transition: 'background 0.15s',
  },
  empty: {
    textAlign: 'center' as const,
    color: '#999',
    padding: 40,
  },
};

export default function AdminPanel() {
  const [data, setData] = useState<ProgressRow[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchAllProgress()
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  const avgRating = (submissions: ProgressRow['submissions']) => {
    if (!submissions || submissions.length === 0) return '-';
    const sum = submissions.reduce((a, s) => a + (s.rating || 0), 0);
    return (sum / submissions.length).toFixed(1);
  };

  const lastTime = (submissions: ProgressRow['submissions']) => {
    if (!submissions || submissions.length === 0) return '-';
    const sorted = [...submissions].sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
    );
    return new Date(sorted[0].timestamp).toLocaleString('zh-CN');
  };

  const taskDesc = (tasks: ProgressRow['tasks']) => {
    if (!tasks || tasks.length === 0) return '-';
    return tasks.map((t) => t.description).join('; ');
  };

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.backLink}>
        ← 返回首页
      </Link>
      <h1 style={styles.title}>管理面板</h1>
      {data.length === 0 ? (
        <p style={styles.empty}>暂无进度数据</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>班级</th>
                <th style={styles.th}>小组名</th>
                <th style={styles.th}>任务</th>
                <th style={styles.th}>进度百分比</th>
                <th style={styles.th}>最后提交时间</th>
                <th style={styles.th}>成员平均评分</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={row.groupId}
                  style={{
                    ...styles.rowHover,
                    ...(idx % 2 === 0 ? styles.rowEven : {}),
                    background:
                      hoverIdx === idx
                        ? '#E8EDF3'
                        : idx % 2 === 0
                        ? '#F9F9F9'
                        : '#fff',
                  }}
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  <td style={styles.td}>{row.className}</td>
                  <td style={styles.td}>{row.groupName}</td>
                  <td style={styles.td}>{taskDesc(row.tasks)}</td>
                  <td style={styles.td}>{row.progress}%</td>
                  <td style={styles.td}>{lastTime(row.submissions)}</td>
                  <td style={styles.td}>{avgRating(row.submissions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
