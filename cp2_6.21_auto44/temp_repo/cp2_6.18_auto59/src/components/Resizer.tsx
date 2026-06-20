import styles from '../styles/Resizer.module.css';

interface ResizerProps {
  isDragging: boolean;
  onResizeStart: (e: React.MouseEvent) => void;
}

export default function Resizer({ isDragging, onResizeStart }: ResizerProps) {
  return (
    <div
      className={`${styles.resizer} ${isDragging ? styles.resizerDragging : ''}`}
      onMouseDown={onResizeStart}
    >
      <div className={styles.resizerHandle}>
        <div className={styles.handleDots}>
          <div className={styles.handleDot} />
          <div className={styles.handleDot} />
          <div className={styles.handleDot} />
        </div>
      </div>
    </div>
  );
}
