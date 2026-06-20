import { ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
  visible: boolean;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  maskClosable?: boolean;
}

export default function Modal({
  visible,
  title,
  children,
  footer,
  onClose,
  maskClosable = true,
}: ModalProps) {
  const styleInjected = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (!styleInjected.current) {
      const styleId = 'modal-keyframes';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @keyframes fadeIn {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }
          @keyframes fadeOut {
            0% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }
          @keyframes scaleIn {
            0% {
              transform: scale(0.9);
              opacity: 0;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes scaleOut {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(0.9);
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
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  const handleMaskClick = () => {
    if (maskClosable) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div style={styles.overlay} onClick={handleMaskClick}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div style={styles.header}>
            <h3 style={styles.title}>{title}</h3>
            <button
              style={styles.closeButton}
              onClick={onClose}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>
          </div>
        )}
        {children && <div style={styles.body}>{children}</div>}
        {footer && <div style={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
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
    animation: 'fadeIn 0.2s ease-out forwards',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'scaleIn 0.2s ease-out forwards',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #F0F0F0',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333333',
    margin: 0,
  },
  closeButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '24px',
    color: '#999999',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.1s ease',
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #F0F0F0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
};
