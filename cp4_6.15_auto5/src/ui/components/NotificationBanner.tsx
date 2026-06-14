import React from 'react';

interface NotificationBannerProps {
  permission: 'default' | 'granted' | 'denied';
  onRequestPermission: () => void;
  onDismiss: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  permission,
  onRequestPermission,
  onDismiss,
}) => {
  if (permission !== 'default') return null;

  return (
    <div style={styles.wrapper} className="anim-slide-down anim-pulse-glow">
      <div style={styles.inner}>
        <div style={styles.icon}>🔔</div>
        <div style={styles.textGroup}>
          <div style={styles.title}>如需接收告警通知，请允许浏览器通知</div>
          <div style={styles.subtitle}>当服务连续失败达到阈值时，系统将弹出桌面通知</div>
        </div>
        <div style={styles.actions}>
          <button className="btn btn-sm btn-primary" onClick={onRequestPermission}>
            允许通知
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={onDismiss}
            style={{ color: 'var(--color-text-muted)' }}
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    top: 78,
    right: 24,
    zIndex: 90,
    maxWidth: 420,
    background:
      'linear-gradient(135deg, rgba(233,69,96,0.18) 0%, rgba(22,33,62,0.95) 100%)',
    border: '1px solid rgba(233,69,96,0.4)',
    borderRadius: 14,
    boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  inner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 16px',
  },
  icon: {
    fontSize: 22,
    flexShrink: 0,
    marginTop: 2,
  },
  textGroup: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: 'var(--color-text-primary)',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 1.45,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flexShrink: 0,
  },
};

export default NotificationBanner;
