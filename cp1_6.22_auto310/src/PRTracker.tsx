import { useState } from 'react';
import { GitPullRequest, User, Calendar, Plus, Minus, Check, GitMerge } from 'lucide-react';
import type { PullRequest, PRStatus } from './types';
import { PR_STATUS_META } from './types';

interface Props {
  prs: PullRequest[];
  onMerge: (prId: string) => void;
}

function formatDate(iso: string): string {
  return iso.split('T')[0];
}

interface MergeAnimState {
  animating: boolean;
  prId: string | null;
}

function PRCard({
  pr,
  onMerge,
  mergedAnims,
}: {
  pr: PullRequest;
  onMerge: (prId: string) => void;
  mergedAnims: MergeAnimState;
}) {
  const isMerged = pr.status === 'merged';
  const isAnimating = mergedAnims.prId === pr.id && mergedAnims.animating;

  const canMerge = pr.status === 'ready_to_merge';
  const statusMeta = PR_STATUS_META[pr.status as Exclude<PRStatus, 'merged'>];

  return (
    <div
      style={{
        background: isMerged ? 'rgba(46,204,113,0.06)' : 'var(--bg-card)',
        borderRadius: 10,
        border: '1px solid',
        borderColor: isMerged ? 'rgba(46,204,113,0.25)' : 'var(--border)',
        boxShadow: 'var(--shadow-card)',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        position: 'relative',
        animation: isAnimating ? undefined : 'fadeIn 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!isAnimating) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {isAnimating && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(46,204,113,0.15)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#2ecc71',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(46,204,113,0.5)',
              animation: 'checkmark 0.4s ease forwards',
            }}
          >
            <Check size={30} color="#fff" strokeWidth={3} />
          </div>
        </div>
      )}

      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: isMerged
                ? 'rgba(46,204,113,0.15)'
                : pr.status === 'ready_to_merge'
                  ? 'rgba(52,152,219,0.15)'
                  : pr.status === 'changes_requested'
                    ? 'rgba(241,196,15,0.15)'
                    : 'rgba(243,156,18,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isMerged ? (
              <GitMerge size={18} color="#2ecc71" />
            ) : (
              <GitPullRequest
                size={18}
                color={
                  pr.status === 'ready_to_merge'
                    ? '#3498db'
                    : pr.status === 'changes_requested'
                      ? '#f1c40f'
                      : '#f39c12'
                }
              />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                #{pr.number}
              </span>
              {!isMerged ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 10px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    background: statusMeta.color + '22',
                    color: statusMeta.color,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: statusMeta.color,
                      marginRight: 6,
                    }}
                  />
                  {statusMeta.label}
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 10px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'rgba(46,204,113,0.2)',
                    color: '#2ecc71',
                  }}
                >
                  <Check size={12} style={{ marginRight: 4 }} strokeWidth={3} />
                  已合并
                </span>
              )}
            </div>

            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: isMerged ? '#95a5a6' : 'var(--text-primary)',
                lineHeight: 1.5,
                marginBottom: 10,
                textDecoration: isMerged ? 'line-through' : 'none',
              }}
            >
              {pr.title}
            </h3>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 16,
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <User size={12} />
                {pr.author}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={12} />
                {formatDate(pr.createdAt)}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#2ecc71',
                }}
              >
                <Plus size={12} />
                +{pr.linesAdded}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#e74c3c',
                }}
              >
                <Minus size={12} />
                -{pr.linesDeleted}
              </span>
            </div>
          </div>
        </div>

        {canMerge && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => onMerge(pr.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 7,
                background: 'linear-gradient(135deg, #3498db, #2980b9)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(52,152,219,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(52,152,219,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(52,152,219,0.3)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.01)';
              }}
            >
              <GitMerge size={14} />
              合并 PR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PRTracker({ prs, onMerge }: Props) {
  const [mergeAnims, setMergeAnims] = useState<Map<string, MergeAnimState>>(new Map());

  const handleMergeWithAnim = (prId: string) => {
    setMergeAnims((prev) => {
      const next = new Map(prev);
      next.set(prId, { animating: true, prId });
      return next;
    });
    setTimeout(() => {
      onMerge(prId);
      setTimeout(() => {
        setMergeAnims((prev) => {
          const next = new Map(prev);
          next.delete(prId);
          return next;
        });
      }, 50);
    }, 400);
  };

  const openPRs = prs
    .filter((p) => p.status !== 'merged')
    .sort((a, b) => {
      const order: Record<string, number> = {
        ready_to_merge: 0,
        changes_requested: 1,
        unreviewed: 2,
      };
      return (order[a.status] || 9) - (order[b.status] || 9);
    });

  const mergedPRs = prs
    .filter((p) => p.status === 'merged')
    .sort((a, b) => new Date(b.mergedAt || b.createdAt).getTime() - new Date(a.mergedAt || a.createdAt).getTime());

  return (
    <div>
      <h2
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        开放 PR
        <span style={{ color: 'var(--text-muted)' }}>({openPRs.length})</span>
      </h2>

      {openPRs.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            borderRadius: 10,
            border: '1px dashed var(--border)',
            color: 'var(--text-muted)',
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          暂无开放 PR，工作已全部完成 🎉
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {openPRs.map((pr) => (
            <PRCard
              key={pr.id}
              pr={pr}
              onMerge={handleMergeWithAnim}
              mergedAnims={mergeAnims.get(pr.id) || { animating: false, prId: null }}
            />
          ))}
        </div>
      )}

      {mergedPRs.length > 0 && (
        <>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <GitMerge size={16} color="#2ecc71" />
            已完成 ({mergedPRs.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.9 }}>
            {mergedPRs.slice(0, 10).map((pr) => (
              <PRCard
                key={pr.id}
                pr={pr}
                onMerge={handleMergeWithAnim}
                mergedAnims={{ animating: false, prId: null }}
              />
            ))}
            {mergedPRs.length > 10 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 12,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                还有 {mergedPRs.length - 10} 个已合并 PR...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
