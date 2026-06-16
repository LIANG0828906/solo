import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';

const COVER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F0E68C'];

export default function ProjectList() {
  const navigate = useNavigate();
  const { projects, loadProjects, createProject, deleteProject, openProject } = useProjectStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject(name.trim(), description.trim(), coverColor);
    setShowCreate(false);
    setName('');
    setDescription('');
    setCoverColor(COVER_COLORS[0]);
    await openProject(project.id);
    navigate(`/editor/${project.id}`);
  };

  const handleOpen = async (id: string) => {
    await openProject(id);
    navigate(`/editor/${id}`);
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setDeletingId(null);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0' }}>
      <nav
        style={{
          height: 88,
          background: 'linear-gradient(135deg, #FFD6A5, #FFC3A0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          boxShadow: '0 2px 12px rgba(255, 195, 160, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28, filter: 'none' }}>📖</span>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#2D3436',
              letterSpacing: 1,
            }}
          >
            绘本工坊
          </h1>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          ✨ 新建项目
        </button>
      </nav>

      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        {projects.length === 0 && !showCreate && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#B2BEC3',
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
            <p style={{ fontSize: 18, marginBottom: 8, color: '#636E72' }}>
              还没有绘本项目
            </p>
            <p style={{ fontSize: 14 }}>点击右上角「新建项目」开始创作</p>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}
        >
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                background: '#FFF',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease-out',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
              }}
            >
              <div
                onClick={() => handleOpen(project.id)}
                style={{
                  height: 140,
                  background: project.coverColor || '#4ECDC4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 48, opacity: 0.8 }}>📖</span>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 12,
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: 10,
                    padding: '2px 10px',
                    fontSize: 12,
                    color: '#636E72',
                  }}
                >
                  {project.pages.length} 页
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: '#2D3436',
                  }}
                >
                  {project.name}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: '#636E72',
                    marginBottom: 8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {project.description || '暂无描述'}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#B2BEC3' }}>
                    {formatDate(project.updatedAt)}
                  </span>
                  {deletingId === project.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-danger"
                        style={{ padding: '4px 12px', fontSize: 12 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project.id);
                        }}
                      >
                        确认
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 12px', fontSize: 12 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#B2BEC3',
                        cursor: 'pointer',
                        fontSize: 16,
                        padding: 4,
                        transition: 'color 0.2s',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(project.id);
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = '#FF6B6B';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = '#B2BEC3';
                      }}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{
              background: '#FFF',
              borderRadius: 20,
              padding: 32,
              width: 420,
              maxWidth: '90vw',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 24,
                color: '#2D3436',
              }}
            >
              ✨ 新建绘本项目
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 6,
                  color: '#636E72',
                }}
              >
                项目名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入绘本名称..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #E0E0E0',
                  fontSize: 14,
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4ECDC4';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E0E0E0';
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 6,
                  color: '#636E72',
                }}
              >
                项目描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述绘本内容..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #E0E0E0',
                  fontSize: 14,
                  resize: 'vertical',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4ECDC4';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E0E0E0';
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 8,
                  color: '#636E72',
                }}
              >
                封面颜色
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {COVER_COLORS.map((c) => (
                  <div
                    key={c}
                    onClick={() => setCoverColor(c)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: c,
                      cursor: 'pointer',
                      border: coverColor === c ? '3px solid #2D3436' : '3px solid transparent',
                      transition: 'all 0.2s ease-out',
                      transform: coverColor === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowCreate(false)}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleCreate}
                style={{ opacity: name.trim() ? 1 : 0.5 }}
                disabled={!name.trim()}
              >
                创建项目
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
