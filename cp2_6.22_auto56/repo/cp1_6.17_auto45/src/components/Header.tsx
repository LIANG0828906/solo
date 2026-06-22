import { usePaletteStore } from '@/stores/usePaletteStore';
import styles from './Header.module.css';

export default function Header() {
  const undo = usePaletteStore((s) => s.undo);
  const history = usePaletteStore((s) => s.history);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="6" cy="6" r="5" fill="#3F51B5" />
            <circle cx="18" cy="6" r="5" fill="#E91E63" />
            <circle cx="6" cy="18" r="5" fill="#009688" />
            <circle cx="18" cy="18" r="5" fill="#FFC107" />
          </svg>
        </div>
        <h1 className={styles.title}>Palette Accessibility</h1>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.undoBtn}
          onClick={undo}
          disabled={history.length === 0}
          title="撤销"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
      </div>
    </header>
  );
}
