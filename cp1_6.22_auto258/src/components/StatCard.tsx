interface StatCardProps {
  title: string;
  value: number | string;
  iconType: 'orders' | 'production' | 'stock';
}

const iconPaths: Record<string, JSX.Element> = {
  orders: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5B8DEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  production: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  stock: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  ),
};

export default function StatCard({ title, value, iconType }: StatCardProps) {
  return (
    <div style={cardStyle}>
      <div style={iconStyle}>{iconPaths[iconType]}</div>
      <div style={contentStyle}>
        <div style={titleStyle}>{title}</div>
        <div style={valueStyle}>{value}</div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  width: '160px',
  borderRadius: '16px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E0E0E0',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  transition: 'all 0.3s ease',
};

const iconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
};

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#666666',
  fontWeight: 500,
};

const valueStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#333333',
  lineHeight: 1.2,
};
