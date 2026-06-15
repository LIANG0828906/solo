import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Heart, Check, X, Share2 } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Project } from '@/types';
import { cn } from '@/lib/utils';

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

  const cardHeights = useMemo(() => {
    return completedProjects.map(p => {
      const hash = p.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return 240 + (hash % 101);
    });
  }, [completedProjects]);

  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  const handleCopyLink = (projectId: string) => {
    const fakeUrl = `${window.location.origin}/works/${projectId}`;
    setTimeout(() => {
      setCopiedId(projectId);
    }, 100);
    try {
      navigator.clipboard?.writeText(fakeUrl);
    } catch {
      // silently fail
    }
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
          .works-gallery {
            column-count: 2;
          }
        }
        @media (max-width: 640px) {
          .works-gallery {
            column-count: 1;
          }
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
          padding: 20px;
        }
        .work-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover);
        }
        .work-card-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          z-index: 0;
        }
        .work-card:before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(74,66,56,0.1) 0%, rgba(74,66,56,0.85) 100%);
          z-index: 1;
        }
        .work-card-blur {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: blur(8px) saturate(1.2);
          transform: scale(1.1);
          z-index: 0;
          opacity: 0.6;
        }
        .work-card-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .work-card-title {
          font-weight: 700;
          color: white;
          font-size: 18px;
          margin-bottom: 6px;
        }
        .work-card-date {
          color: rgba(255,255,255,0.75);
          font-size: 12px;
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
        }
        .like-btn.liked {
          border-color: #E06B5A;
        }
        .like-btn:after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 36px;
          height: 36px;
          border: 2px solid #E06B5A;
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 0;
          pointer-events: none;
        }
        .like-btn.ripple:after {
          animation: ripple 0.6s ease-out;
        }
        .modal-wrapper {
          max-width: 720px;
          width: 100%;
        }
        .modal-cover {
          width: 100%;
          max-height: 360px;
          object-fit: cover;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          display: block;
        }
        .material-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--color-bg-alt);
          border-radius: var(--radius-sm);
        }
        .modal-close {
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
        }
        .modal-close:hover {
          background: white;
        }
      `}</style>

      {completedProjects.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-[var(--color-text-muted)]">
          暂无完成的作品
        </div>
      ) : (
        <div className="works-gallery">
          {completedProjects.map((project, idx) => (
            <div
              key={project.id}
              className="work-card"
              style={{
                height: `${cardHeights[idx]}px`,
                animationDelay: `${idx * 50}ms`,
              }}
              onClick={() => setSelectedProject(project)}
            >
              <div
                className="work-card-blur"
                style={{ backgroundImage: `url(${project.coverImage})` }}
              />
              <div
                className="work-card-bg"
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
            className="modal-content modal-wrapper"
            onClick={e => e.stopPropagation()}
          >
            <div style={{ position: 'relative' }}>
              <button
                className="modal-close"
                onClick={() => setSelectedProject(null)}
              >
                <X size={18} />
              </button>
              <img
                src={selectedProject.coverImage}
                alt={selectedProject.name}
                className="modal-cover"
              />
            </div>

            <div style={{ padding: '24px' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                }}
              >
                {selectedProject.name}
              </h2>
              <div
                style={{
                  marginTop: '6px',
                  color: 'var(--color-text-muted)',
                  fontSize: '13px',
                }}
              >
                {selectedProject.completedAt &&
                  format(new Date(selectedProject.completedAt), 'yyyy年MM月dd日 完成')}
              </div>

              <p
                style={{
                  marginTop: '16px',
                  color: 'var(--color-text)',
                  lineHeight: 1.7,
                  margin: 0,
                  paddingTop: '16px',
                }}
              >
                {selectedProject.description}
              </p>

              <div style={{ marginTop: '24px' }}>
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                  }}
                >
                  使用材料
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedProject.materials.map(pm => {
                    const mat = materials.find(m => m.id === pm.materialId);
                    return (
                      <div key={pm.materialId} className="material-item">
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {mat?.name ?? '未知材料'}
                        </span>
                        <span
                          style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '13px',
                          }}
                        >
                          {pm.usedQuantity} {mat?.unit ?? ''}
                        </span>
                      </div>
                    );
                  })}
                  {selectedProject.materials.length === 0 && (
                    <div
                      style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '13px',
                        padding: '10px 14px',
                      }}
                    >
                      暂无材料记录
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <button
                  className={cn('btn', 'btn-secondary', copiedId === selectedProject.id && '!border-[var(--color-success)] !text-[var(--color-success)]')}
                  onClick={() => handleCopyLink(selectedProject.id)}
                >
                  {copiedId === selectedProject.id ? (
                    <>
                      <Check size={16} />
                      已复制
                    </>
                  ) : (
                    <>
                      <Share2 size={16} />
                      复制分享链接
                    </>
                  )}
                </button>

                <button
                  key={`${selectedProject.id}-${likeRippleKey}`}
                  className={cn(
                    'like-btn ripple',
                    likedProjects[selectedProject.id] && 'liked'
                  )}
                  onClick={() => handleLike(selectedProject.id)}
                  style={{
                    color: likedProjects[selectedProject.id] ? '#E06B5A' : '#8A8379',
                  }}
                >
                  <Heart
                    size={18}
                    fill={likedProjects[selectedProject.id] ? '#E06B5A' : 'none'}
                    strokeWidth={2}
                  />
                  {likedProjects[selectedProject.id] ? '已点赞' : '点赞'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
