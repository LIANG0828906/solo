import React from 'react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  icon?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  trend?: { value: string; positive: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  tone = 'default',
  trend,
}) => {
  const toneColors = {
    default: { bg: 'rgba(15,52,96,0.4)', border: 'rgba(15,52,96,0.7)', text: '#7fb8ff' },
    success: { bg: 'rgba(0,214,143,0.1)', border: 'rgba(0,214,143,0.3)', text: 'var(--color-accent-success)' },
    warning: { bg: 'rgba(255,170,44,0.1)', border: 'rgba(255,170,44,0.3)', text: 'var(--color-accent-warning-soft)' },
    danger: { bg: 'rgba(233,69,96,0.1)', border: 'rgba(233,69,96,0.3)', text: 'var(--color-accent-warning)' },
  }[tone];

  return (
    <div
      style={{
        ...styles.card,
        background: `linear-gradient(135deg, var(--color-bg-card) 0%, ${toneColors.bg} 100%)`,
        borderColor: toneColors.border,
      }}
    >
      <div style={styles.topRow}>
        <span style={styles.label}>{label}</span>
        {icon && (
          <div
            style={{
              ...styles.iconBox,
              background: toneColors.bg,
              borderColor: toneColors.border,
              color: toneColors.text,
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <div
        style={{
          ...styles.value,
          color: tone === 'default' ? 'var(--color-text-primary)' : toneColors.text,
        }}
      >
        {value}
      </div>
      {(subValue || trend) && (
        <div style={styles.bottomRow}>
          {subValue && <span style={styles.subValue}>{subValue}</span>}
          {trend && (
            <span
              style={{
                ...styles.trend,
                color: trend.positive
                  ? 'var(--color-accent-success)'
                  : 'var(--color-accent-warning)',
              }}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: 'relative',
    padding: '18px 20px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    transition: 'transform 220ms ease, box-shadow 220ms ease',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 11.5,
    color: 'var(--color-text-muted)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid',
    fontSize: 14,
  },
  value: {
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.15,
  },
  bottomRow: {
    marginTop: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  subValue: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
  },
  trend: {
    fontSize: 11.5,
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
  },
};

export default StatCard;
