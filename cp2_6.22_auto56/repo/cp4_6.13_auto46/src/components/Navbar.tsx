import { NavLink, useNavigate } from 'react-router-dom';
import { Camera, FolderOpen, Plus, Loader } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import styles from './Navbar.module.css';

interface Props {
  onUploadClick?: () => void;
  showUpload?: boolean;
}

export default function Navbar({ onUploadClick, showUpload = true }: Props) {
  const navigate = useNavigate();
  const loading = useAppStore((s) => s.loadingMessage);
  const photoCount = useAppStore((s) => s.photos.length);
  const portfolioCount = useAppStore((s) => s.portfolios.length);

  return (
    <header className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <button className={styles.brand} onClick={() => navigate('/')}>
          <span className={styles.logoMark}>L</span>
          <span className={styles.brandName}>Lumen</span>
          <span className={styles.brandTag}>· 摄影作品集工作室</span>
        </button>

        <nav className={styles.links}>
          <NavLink to="/" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
            <Camera size={16} />
            作品库
            <em>{photoCount}</em>
          </NavLink>
          <NavLink to="/portfolio" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
            <FolderOpen size={16} />
            作品集
            <em>{portfolioCount}</em>
          </NavLink>
        </nav>

        <div className={styles.actions}>
          {loading && (
            <div className={styles.loading}>
              <Loader size={14} className={styles.spin} />
              <span>{loading}</span>
            </div>
          )}
          {showUpload && onUploadClick && (
            <button className="btn btn-primary" onClick={onUploadClick}>
              <Plus size={16} />
              上传作品
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
