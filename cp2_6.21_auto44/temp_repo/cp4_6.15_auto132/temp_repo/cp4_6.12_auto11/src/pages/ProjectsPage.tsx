import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { deleteProjectApi } from '../api/projectApi';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loadProjects, setCurrentProject, user } = useProjectStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects().finally(() => setLoading(false));
  }, [loadProjects]);

  const handleOpen = (id: number) => {
    setCurrentProject(null);
    navigate(`/studio`);
    setTimeout(() => {
      useProjectStore.getState().loadProject(id);
    }, 100);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个项目吗？此操作不可恢复。')) {
      try {
        await deleteProjectApi(id);
        await loadProjects();
      } catch (err) {
        console.error('删除失败:', err);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate('/studio')} style={styles.backBtn}>
          ← 返回设计台
        </button>
        <h1 style={styles.title}>📂 我的项目</h1>
        <button
          onClick={() => navigate('/studio')}
          style={styles.newBtn}
        >
          + 新建项目
        </button>
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : projects.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📭</div>
            <div style={styles.emptyTitle}>还没有项目</div>
            <div style={styles.emptyText}>点击上方按钮创建你的第一个拼布设计</div>
          </div>
        ) : (
          <div style={styles.grid}>
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleOpen(project.id)}
                style={styles.card}
              >
                <div style={styles.cardPreview}>
                  {project.layout.some((c) => c.fabricId !== null) ? (
                    <div style={styles.previewGrid}>
                      {project.layout.slice(0, 100).map((cell, i) => (
                        <div
                          key={i}
                          style={{
                            ...styles.previewCell,
                            background: cell.fabricId
                              ? useProjectStore.getState().fabrics.find((f) => f.id === cell.fabricId)?.colorCode || '#F5F0E8'
                              : '#FFFAF4',
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={styles.emptyPreview}>空白画布</div>
                  )}
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.cardTitle}>{project.name}</div>
                  <div style={styles.cardMeta}>
                    <span>{project.widthCm}×{project.heightCm}cm</span>
                    <span>{project.gridCols}×{project.gridRows}格</span>
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={styles.cost}>
                      预估 ¥{project.totalCost.toFixed(2)}
                    </span>
                    <span style={styles.date}>
                      {formatDate(project.updatedAt)}
                    </span>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    style={styles.deleteBtn}
                    title="删除项目"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#F5F0E8',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 32px',
    background: '#FFFAF4',
    borderBottom: '1px solid #D7C4A1',
  },
  backBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #D7C4A1',
    background: 'transparent',
    color: '#5D4037',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#5D4037',
    margin: 0,
  },
  newBtn: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #B87333 0%, #A6622A 100%)',
    color: '#FFFAF4',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(184, 115, 51, 0.3)',
    fontFamily: 'inherit',
  },
  content: {
    flex: 1,
    padding: 32,
    overflowY: 'auto',
  },
  loading: {
    textAlign: 'center',
    padding: 60,
    color: '#8D6E63',
  },
  empty: {
    textAlign: 'center',
    padding: 80,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.5,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#5D4037',
    marginBottom: 8,
  },
  emptyText: {
    color: '#8D6E63',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
  },
  card: {
    position: 'relative',
    background: '#FFFAF4',
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(93, 64, 55, 0.08)',
    transition: 'all 0.2s',
    border: '1px solid #E8DDD0',
  },
  cardPreview: {
    aspectRatio: '1',
    background: '#F5F0E8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  previewGrid: {
    width: '100%',
    height: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gridTemplateRows: 'repeat(10, 1fr)',
    gap: 1,
    background: '#8D6E63',
    borderRadius: 4,
    overflow: 'hidden',
  },
  previewCell: {
    background: '#FFFAF4',
  },
  emptyPreview: {
    color: '#8D6E63',
    fontSize: 14,
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#5D4037',
    marginBottom: 8,
  },
  cardMeta: {
    display: 'flex',
    gap: 12,
    fontSize: 12,
    color: '#8D6E63',
    marginBottom: 12,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
  },
  cost: {
    fontWeight: 700,
    color: '#B87333',
  },
  date: {
    color: '#8D6E63',
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 8,
    border: 'none',
    background: 'rgba(255,255,255,0.9)',
    cursor: 'pointer',
    fontSize: 14,
  },
};

export default ProjectsPage;
