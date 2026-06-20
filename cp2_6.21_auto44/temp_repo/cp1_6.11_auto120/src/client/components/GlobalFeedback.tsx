import { useUIStore } from '../store/uiStore';

const styles: Record<string, React.CSSProperties> = {
  progressBarContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    zIndex: 9999,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    background: '#FFD700',
    animation: 'slideIn 1.2s ease-in-out infinite',
    transformOrigin: 'left center',
  },
  toastsContainer: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '360px',
  },
  toast: {
    padding: '12px 20px',
    borderRadius: '8px',
    background: '#333',
    color: '#FFF',
    fontSize: '14px',
    lineHeight: 1.5,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    animation: 'toastSlideIn 0.3s ease-out',
    wordBreak: 'break-word',
  },
  toastInfo: {
    background: '#2563eb',
  },
  toastError: {
    background: '#333',
  },
};

const keyframes = `
@keyframes slideIn {
  0% {
    transform: translateX(-100%) scaleX(0.3);
    opacity: 0.8;
  }
  50% {
    transform: translateX(0%) scaleX(0.7);
    opacity: 1;
  }
  100% {
    transform: translateX(100%) scaleX(0.3);
    opacity: 0.8;
  }
}

@keyframes toastSlideIn {
  from {
    transform: translateX(120%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
`;

export default function GlobalFeedback() {
  const { loadingRequests, toasts, removeToast } = useUIStore();

  return (
    <>
      <style>{keyframes}</style>
      {loadingRequests > 0 && (
        <div style={styles.progressBarContainer}>
          <div style={styles.progressBar} />
        </div>
      )}
      <div style={styles.toastsContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              ...styles.toast,
              ...(toast.type === 'info' ? styles.toastInfo : styles.toastError),
            }}
            onClick={() => removeToast(toast.id)}
          >
            {toast.msg}
          </div>
        ))}
      </div>
    </>
  );
}
