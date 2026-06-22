import React, { useCallback } from 'react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  plantName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = function ConfirmDialog({
  title,
  message,
  plantName,
  onConfirm,
  onCancel,
}) {
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>
          {message}
          {plantName && <span className={styles.plantName}>{plantName}</span>}？
        </p>
        <div className={styles.buttons}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnCancel}`}
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnConfirm}`}
            onClick={onConfirm}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
