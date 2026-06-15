import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useAppStore } from '@/store';
import type { Project } from '@/types';

export default function WorksGallery() {
  const projects = useAppStore(s => s.projects);
  const materials = useAppStore(s => s.materials);
  const likedProjects = useAppStore(s => s.likedProjects);
  const toggleLike = useAppStore(s => s.toggleLike);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likeRippleKey, setLikeRippleKey] = useState(0);

  const completedProjects = useMemo(
    () => projects.filter(p => p.status === 'completed'),
    [projects]
  );

  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  const handleCopyLink = (projectId: string) => {
    const fakeUrl = `${window.location.origin}/works/${projectId}`;
    try {
      navigator.clipboard?.writeText(fakeUrl);
    } catch { /* */ }
    setCopiedId(projectId);
  };

  const handleLike = (projectId: string) => {
    toggleLike(projectId);
    setLikeRippleKey(k => k + 1);
  };

  return (
    <>
      <style>{`
        .works-gallery {
          column-count: 3;
          column-gap: 20px;
        }
        @media (max-width: 1024px) {
          .works-gallery { column-count: 2; }
        }
        @media (max-width: 640px) {
          .works-gallery { column-count: 1; }
        }
        .work-card {
          break-inside: avoid;
          margin-bottom: 20px;
          position: relative;
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          box-shadow: var(--shadow-md);
          transition: transform 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out);
          animation: slideUp 0.5s var(--ease-out) both;
          display: flex;
          flex-direction: column;
          padding: 24px 20px 20px;
          min-height: 220px;
        }
        .work-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover);
        }
        .work-card-blur {
          position: absolute;
          inset: -8px;
          background-size: cover;
          background-position: center;
          filter: blur(12px) saturate(1.3);
          z-index: 0;
          opacity: 0.7;
        }
        .work-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(74,66,56,0.15) 0%, rgba(74,66,56,0.82) 100%);
          z-index: 1;
        }
        .work-card-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .work-card-title {
          font-weight: 700;
          color: white;
          font-size: 18px;
          margin-bottom: 6px;
          line-height: 1.3;
        }
        .work-card-date {
          color: rgba(255,255,255,0.75);
          font-size: 12px;
          margin-bottom: 16px;
        }
        .work-card-btn {
          margin-top: auto;
          align-self: flex-start;
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.7);
          color: white;
          border-radius: 999px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s ease;
          font-family: inherit;
          cursor: pointer;
        }
        .work-card-btn:hover {
          background: rgba(255,255,255,0.95);
          color: #4A4238;
        }
        .like-btn {
          position: relative;
          background: white;
          border: 2px solid #E8DFD2;
          border-radius: 999px;
          padding: 10px 20px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 14px;
          overflow: visible;
          transition: border-color 0.2s var(--ease-out);
          font-family: inherit;
          cursor: pointer;
        }
        .like-btn.liked {
          border-color: #E06B5A;
        }
        @keyframes rippleOut {
          from { transform: translate(-50%, -50%) scale(0.5); opacity: 0.7; }
          to { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        .like-btn .ripple-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 36px;
          height: 36px;
          border: 2px solid #E06B5A;
          border-radius: 50%;
          pointer-events: none;
          animation: rippleOut 0.6s ease-out forwards;
        }
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(60px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .works-modal-content {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          max-height: 90vh;
          overflow: auto;
          animation: modalSlideUp 0.4s var(--ease-out);
        }
        .works-modal-cover {
          width: 100%;
          max-height: 360px;
          object-fit: cover;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          display: block;
        }
        .works-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text);
          box-shadow: var(--shadow-sm);
          z-index: 10;
          border: none;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .works-modal-close:hover {
          background: white;
        }
        .works-material-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--color-bg-alt);
          border-radius: var(--radius-sm);
        }
      `}</style>

      {completedProjects.length === 0 ? (
        <div style={{ display: 'flex', height: 256, alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
          暂无完成的作品
        </div>
      ) : (
        <div className="works-gallery">
          {completedProjects.map((project, idx) => (
            <div
              key={project.id}
              className="work-card"
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => setSelectedProject(project)}
            >
              <div
                className="work-card-blur"
                style={{ backgroundImage: `url(${project.coverImage})` }}
              />
              <div className="work-card-content">
                <div className="work-card-title">{project.name}</div>
                <div className="work-card-date">
                  {project.completedAt &&
                    format(new Date(project.completedAt), 'yyyy年MM月dd日 完成')}
                </div>
                <button
                  className="work-card-btn"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedProject(project);
                  }}
                >
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="works-modal-content"
            style={{ maxWidth: 720, width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ position: 'relative' }}>
              <button
                className="works-modal-close"
                onClick={() => setSelectedProject(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
              <img
                src={selectedProject.coverImage}
                alt={selectedProject.name}
                className="works-modal-cover"
              />
            </div>

            <div style={{ padding: 24 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--color-text)' }}>
                {selectedProject.name}
              </h2>
              <div style={{ marginTop: 6, color: 'var(--color-text-muted)', fontSize: 13 }}>
                {selectedProject.completedAt &&
                  format(new Date(selectedProject.completedAt), 'yyyy年MM月dd日 完成')}
              </div>

              <p style={{ marginTop: 16, color: 'var(--color-text)', lineHeight: 1.7, paddingTop: 16 }}>
                {selectedProject.description}
              </p>

              <div style={{ marginTop: 24 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
                  使用材料
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedProject.materials.map(pm => {
                    const mat = materials.find(m => m.id === pm.materialId);
                    return (
                      <div key={pm.materialId} className="works-material-item">
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {mat?.name ?? '未知材料'}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                          {pm.usedQuantity} {mat?.unit ?? ''}
                        </span>
                      </div>
                    );
                  })}
                  {selectedProject.materials.length === 0 && (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '10px 14px' }}>
                      暂无材料记录
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <button
                  className={`btn ${copiedId === selectedProject.id ? 'btn-secondary' : 'btn-secondary'}`}
                  style={copiedId === selectedProject.id ? { borderColor: 'var(--color-success)', color: 'var(--color-success)' } : {}}
                  onClick={() => handleCopyLink(selectedProject.id)}
                >
                  {copiedId === selectedProject.id ? (
                    <>
                      <i className="fa-solid fa-check" style={{ fontSize: 14, color: 'var(--color-success)' }}></i>
                      已复制
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-share-nodes" style={{ fontSize: 14 }}></i>
                      复制分享链接
                    </>
                  )}
                </button>

                <button
                  key={`${selectedProject.id}-${likeRippleKey}`}
                  className={`like-btn ${likedProjects[selectedProject.id] ? 'liked' : ''}`}
                  onClick={() => handleLike(selectedProject.id)}
                  style={{ color: likedProjects[selectedProject.id] ? '#E06B5A' : '#8A8379' }}
                >
                  <i
                    className={`fa-${likedProjects[selectedProject.id] ? 'solid' : 'regular'} fa-heart`}
                    style={{ fontSize: 16 }}
                  ></i>
                  {likedProjects[selectedProject.id] ? '已点赞' : '点赞'}
                  {likeRippleKey > 0 && <span className="ripple-ring" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
