import { useState } from 'react';
import { Github, Plus, Trash2, ChevronRight, Package } from 'lucide-react';
import type { Repo } from './types';

interface Props {
  repos: Repo[];
  activeRepoId: string;
  onSelect: (repoId: string) => void;
  onAdd: (fullName: string) => boolean;
  onRemove: (repoId: string) => void;
}

export default function RepoManager({ repos, activeRepoId, onSelect, onAdd, onRemove }: Props) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const ok = onAdd(trimmed);
    if (ok) {
      setInput('');
      setAdding(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Github size={22} color="#e0e0e0" />
          <h1
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: 0.3,
            }}
          >
            仓库管理中心
          </h1>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          追踪最多 5 个开源项目
        </p>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {repos.map((repo) => {
            const isActive = repo.id === activeRepoId;
            return (
              <div
                key={repo.id}
                onClick={() => onSelect(repo.id)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-card)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: repo.color + '22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Package size={18} color={repo.color} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {repo.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {repo.owner}
                  </div>
                </div>

                <div
                  style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: '#e74c3c',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    minWidth: 22,
                    textAlign: 'center',
                  }}
                >
                  {repo.openIssuesCount}
                </div>

                {isActive && <ChevronRight size={16} color="var(--accent)" />}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(repo.id);
                  }}
                  aria-label="删除仓库"
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    transition: 'all 0.15s',
                    zIndex: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.display = 'flex';
                    e.currentTarget.style.background = 'rgba(231,76,60,0.15)';
                    e.currentTarget.style.color = '#e74c3c';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                  className="repo-delete-btn"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {adding ? (
          <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: 'var(--bg-card)',
                border: '1px solid var(--accent)',
              }}
            >
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                输入 owner/repo 格式
              </label>
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如: facebook/react"
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  marginBottom: 10,
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setInput('');
                  }}
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 6,
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                >
                  添加
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            disabled={repos.length >= 5}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              height: 44,
              marginTop: 12,
              borderRadius: 10,
              border: '1px dashed var(--border)',
              color: repos.length >= 5 ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.15s',
              background: 'transparent',
              opacity: repos.length >= 5 ? 0.5 : 1,
              cursor: repos.length >= 5 ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (repos.length < 5) {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = repos.length >= 5 ? 'var(--text-muted)' : 'var(--text-secondary)';
            }}
          >
            <Plus size={16} />
            {repos.length >= 5 ? '已达最大数量' : '添加仓库'}
          </button>
        )}
      </div>

      <div
        style={{
          padding: 16,
          borderTop: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        {repos.length} / 5 个仓库
      </div>
    </div>
  );
}
