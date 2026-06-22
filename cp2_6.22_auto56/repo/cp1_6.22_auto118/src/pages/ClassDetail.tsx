import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchClass,
  generateGroups,
  fetchGroups,
} from '../services/api';
import GroupCard from '../components/GroupCard';

interface ClassData {
  id: string;
  name: string;
  students: string[];
}

interface GroupData {
  id: string;
  name: string;
  members: string[];
  task?: string;
  progress: number;
  submissions: { text: string; rating: number; timestamp: number }[];
}

const styles = {
  page: {
    fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    minHeight: '100vh',
    background: '#F7F9FC',
  },
  navbar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    background: '#1B3A5C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 1000,
    color: '#fff',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    fontSize: 16,
    fontWeight: 600 as const,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  navBtn: {
    padding: '6px 18px',
    background: '#fff',
    color: '#1B3A5C',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600 as const,
    cursor: 'pointer',
  },
  navLink: {
    color: '#AAC4E0',
    textDecoration: 'none',
    fontSize: 14,
  },
  hamburger: {
    display: 'none',
    flexDirection: 'column' as const,
    gap: 4,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 6,
  },
  hamburgerLine: {
    width: 22,
    height: 2,
    background: '#fff',
    borderRadius: 1,
  },
  mobileMenu: {
    position: 'fixed' as const,
    top: 56,
    left: 0,
    right: 0,
    background: '#1B3A5C',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '12px 24px',
    gap: 10,
    zIndex: 999,
  },
  content: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '80px 20px 40px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    zIndex: 1001,
  },
  sidePanel: {
    position: 'fixed' as const,
    top: 0,
    right: 0,
    width: 340,
    maxWidth: '90vw',
    height: '100vh',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '-4px 0 20px rgba(27,58,92,0.15)',
    zIndex: 1002,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: 32,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 700 as const,
    color: '#1B3A5C',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    accentColor: '#1B3A5C',
    marginBottom: 8,
  },
  sliderValue: {
    textAlign: 'center' as const,
    fontSize: 18,
    fontWeight: 600 as const,
    color: '#1B3A5C',
    marginBottom: 24,
  },
  generateBtn: {
    padding: '10px 0',
    width: '100%',
    background: '#1B3A5C',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600 as const,
    cursor: 'pointer',
  },
  closeBtn: {
    marginTop: 16,
    padding: '8px 0',
    width: '100%',
    background: 'transparent',
    color: '#888',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center' as const,
    color: '#999',
    marginTop: 60,
    fontSize: 16,
  },
};

export default function ClassDetail() {
  const { id: classId } = useParams<{ id: string }>();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [groupSize, setGroupSize] = useState(3);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadGroups = useCallback(() => {
    if (!classId) return;
    fetchGroups(classId)
      .then((res) => setGroups(res.data))
      .catch(() => {});
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    fetchClass(classId)
      .then((res) => setClassData(res.data))
      .catch(() => {});
    loadGroups();
  }, [classId, loadGroups]);

  const handleGenerate = async () => {
    if (!classId) return;
    try {
      await generateGroups(classId, groupSize);
      loadGroups();
      setPanelOpen(false);
    } catch {}
  };

  const studentCount = classData?.students?.length ?? 0;

  return (
    <div style={styles.page}>
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <span>{classData?.name ?? '班级详情'}</span>
          <span style={{ fontWeight: 400, opacity: 0.8, fontSize: 14 }}>
            {studentCount} 名学生
          </span>
        </div>
        <button
          style={styles.hamburger}
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
        </button>
        <div style={styles.navRight} className="nav-right">
          <button style={styles.navBtn} onClick={() => setPanelOpen(true)}>
            开始分组
          </button>
          <Link to="/admin" style={styles.navLink}>
            管理
          </Link>
        </div>
      </nav>
      {menuOpen && (
        <div style={styles.mobileMenu}>
          <button
            style={{ ...styles.navBtn, width: '100%', textAlign: 'center' }}
            onClick={() => {
              setPanelOpen(true);
              setMenuOpen(false);
            }}
          >
            开始分组
          </button>
          <Link
            to="/admin"
            style={{ ...styles.navLink, fontSize: 16, textAlign: 'center' }}
            onClick={() => setMenuOpen(false)}
          >
            管理
          </Link>
        </div>
      )}
      <div style={styles.content}>
        {groups.length === 0 ? (
          <p style={styles.empty}>
            暂无分组，点击"开始分组"生成分组
          </p>
        ) : (
          <div style={styles.grid} className="class-grid">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                classId={classId!}
                onRefresh={loadGroups}
              />
            ))}
          </div>
        )}
      </div>
      {panelOpen && (
        <>
          <div style={styles.overlay} onClick={() => setPanelOpen(false)} />
          <div style={styles.sidePanel}>
            <div style={styles.panelTitle}>分组设置</div>
            <div style={styles.label}>每组人数</div>
            <input
              type="range"
              min={2}
              max={5}
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.sliderValue}>{groupSize} 人/组</div>
            <button style={styles.generateBtn} onClick={handleGenerate}>
              生成分组
            </button>
            <button
              style={styles.closeBtn}
              onClick={() => setPanelOpen(false)}
            >
              关闭
            </button>
          </div>
        </>
      )}
      <style>{`
        @media (max-width: 768px) {
          .nav-right { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .class-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .hamburger-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
