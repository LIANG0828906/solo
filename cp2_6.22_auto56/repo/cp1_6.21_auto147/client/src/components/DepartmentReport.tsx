import { useApp } from '../context/AppContext';
import { useState, useEffect } from 'react';
import type { DepartmentStats } from '../types';

export default function DepartmentReport() {
  const { departmentStats, trainees, loading } = useApp();
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (departmentStats.length === 0) {
    return (
      <div style={emptyStyle}>
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>暂无部门数据</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {departmentStats.map((dept) => (
        <div key={dept.name} style={deptCardStyle}>
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => setExpandedDept(expandedDept === dept.name ? null : dept.name)}
          >
            <div style={deptHeaderStyle}>
              <div style={deptInfoStyle}>
                <h3 style={deptNameStyle}>{dept.name}</h3>
                <span style={deptCountStyle}>
                  {dept.submitted} / {dept.total} 人完成
                </span>
              </div>
              <div style={ringWrapperStyle}>
                <RingProgress rate={dept.completionRate} />
              </div>
            </div>
            <div style={progressBarStyle}>
              <div
                style={{
                  ...progressFillStyle,
                  width: `${dept.completionRate}%`
                }}
              />
            </div>
          </div>

          {expandedDept === dept.name && (
            <div style={expandedStyle}>
              {trainees
                .filter(t => t.department === dept.name)
                .map(trainee => (
                  <div key={trainee.id} style={traineeRowStyle}>
                    <div style={traineeInfoStyle}>
                      <span style={{ fontWeight: 500, color: '#334155' }}>{trainee.name}</span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{trainee.email}</span>
                    </div>
                    <div
                      style={{
                        ...statusBadgeStyle,
                        backgroundColor: getStatusColor(trainee.status).bg,
                        color: getStatusColor(trainee.status).text
                      }}
                    >
                      {getStatusText(trainee.status)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RingProgress({ rate }: { rate: number }) {
  const [displayRate, setDisplayRate] = useState(0);
  const size = 64;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayRate / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setDisplayRate(rate), 100);
    return () => clearTimeout(timer);
  }, [rate]);

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="14"
        fontWeight="600"
        fill="#334155"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {rate.toFixed(1)}%
      </text>
    </svg>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'submitted':
      return { bg: '#DCFCE7', text: '#22C55E' };
    case 'viewed':
      return { bg: '#FEF3C7', text: '#F59E0B' };
    default:
      return { bg: '#F1F5F9', text: '#94A3B8' };
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'submitted':
      return '已提交';
    case 'viewed':
      return '已查看';
    default:
      return '未查看';
  }
}

const containerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '16px'
};

const deptCardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid #E2E8F0',
  transition: 'box-shadow 0.2s ease'
};

const deptHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px'
};

const deptInfoStyle: React.CSSProperties = {
  flex: 1
};

const deptNameStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#1E293B',
  marginBottom: '4px'
};

const deptCountStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748B'
};

const ringWrapperStyle: React.CSSProperties = {
  width: '64px',
  height: '64px'
};

const progressBarStyle: React.CSSProperties = {
  height: '6px',
  backgroundColor: '#E2E8F0',
  borderRadius: '3px',
  overflow: 'hidden'
};

const progressFillStyle: React.CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, #22C55E, #3B82F6)',
  borderRadius: '3px',
  transition: 'width 0.6s ease'
};

const expandedStyle: React.CSSProperties = {
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid #E2E8F0',
  maxHeight: '300px',
  overflow: 'auto'
};

const traineeRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid #F1F5F9'
};

const traineeInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
};

const statusBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 500
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #E2E8F0'
};
