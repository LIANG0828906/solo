import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Confetti from './Confetti';
import Icon from './Icon';

interface NotificationProps {
  candidateName: string;
  jobTitle: string;
  bonus: number;
  redirectTo?: string;
  onClose?: () => void;
}

export default function Notification({
  candidateName,
  jobTitle,
  bonus,
  redirectTo,
  onClose,
}: NotificationProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const styleInjected = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (!styleInjected.current) {
      const styleId = 'notification-keyframes';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @keyframes slideInRight {
            0% {
              transform: translateX(100%);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOutRight {
            0% {
              transform: translateX(0);
              opacity: 1;
            }
            100% {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }
      styleInjected.current = true;
    }
  }, []);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 100);
    const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);
    const closeTimer = setTimeout(() => handleClose(), 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(confettiTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 300);
  };

  const handleClick = () => {
    if (redirectTo) {
      navigate(redirectTo);
    }
    handleClose();
  };

  if (!visible) return null;

  return (
    <>
      <Confetti active={showConfetti} />
      <div
        style={{
          ...styles.container,
          animation: isExiting
            ? 'slideOutRight 0.3s ease-out forwards'
            : 'slideInRight 0.3s ease-out forwards',
          cursor: redirectTo ? 'pointer' : 'default',
        }}
        onClick={handleClick}
      >
        <div style={styles.iconWrapper}>
          <Icon name="check" size={28} color="#FFFFFF" />
        </div>
        <div style={styles.content}>
          <div style={styles.title}>🎉 恭喜！成功入职</div>
          <div style={styles.message}>
            {candidateName} 已成功入职 {jobTitle}
          </div>
          <div style={styles.bonus}>
            奖励金额：<span style={styles.bonusAmount}>¥{bonus.toLocaleString()}</span>
          </div>
        </div>
        {redirectTo && <div style={styles.arrow}>→</div>}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    zIndex: 10000,
    minWidth: '360px',
    opacity: 0,
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34A853',
    borderRadius: '50%',
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333333',
    marginBottom: '4px',
  },
  message: {
    fontSize: '14px',
    color: '#666666',
    marginBottom: '6px',
  },
  bonus: {
    fontSize: '13px',
    color: '#666666',
  },
  bonusAmount: {
    color: '#EA4335',
    fontWeight: 600,
    fontSize: '15px',
  },
  arrow: {
    fontSize: '20px',
    color: '#1A73E8',
    fontWeight: 300,
  },
};
