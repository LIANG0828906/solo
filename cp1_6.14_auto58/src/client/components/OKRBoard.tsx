import React from 'react';
import type { Objective, User } from '../types';

interface OKRBoardProps {
  objectives: Objective[];
  users: User[];
  currentUserId?: string;
  userRole?: 'member' | 'manager';
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'var(--color-success)';
  if (progress >= 50) return 'var(--color-warning)';
  return 'var(--color-danger)';
};

const getUserById = (users: User[], id: string) => users.find((u) => u.id === id);

const OKRBoard: React.FC<OKRBoardProps> = ({ objectives, users }) => {
  if (objectives.length === 0) {
    return (
      <div className="empty">
        <div className="empty-title">暂无OKR数据</div>
        <p>点击右上角"创建OKR"按钮开始创建</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {objectives.map((obj) => {
        const objOwner = getUserById(users, obj.ownerId);
        const avgProgress =
          obj.keyResults.length > 0
            ? Math.round(
                obj.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / obj.keyResults.length
              )
            : 0;

        return (
          <div key={obj.id} className="card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600 }}>{obj.title}</h2>
                    <span
                      style={{
                        padding: '2px 10px',
                        backgroundColor: 'var(--color-primary)',
                        color: '#fff',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    >
                      {obj.quarter}
                    </span>
                  </div>
                  {obj.description && (
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 8 }}>
                      {obj.description}
                    </p>
                  )}
                  {objOwner && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      <span className="user-avatar" style={{ fontSize: 16 }}>{objOwner.avatar}</span>
                      <span>负责人：{objOwner.name}</span>
                    </div>
                  )}
                </div>

                <div style={{ minWidth: 140, textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    整体进度
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: getProgressColor(avgProgress) }}>
                    {avgProgress}%
                  </div>
                </div>
              </div>

              <div
                style={{
                  height: 6,
                  backgroundColor: 'var(--color-border)',
                  borderRadius: 3,
                  marginTop: 12,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${avgProgress}%`,
                    backgroundColor: getProgressColor(avgProgress),
                    borderRadius: 3,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 12,
              }}
            >
              {obj.keyResults
                .sort((a, b) => a.priority - b.priority)
                .map((kr) => {
                  const krOwner = getUserById(users, kr.ownerId);
                  return (
                    <div
                      key={kr.id}
                      style={{
                        padding: 14,
                        backgroundColor: 'var(--color-surface-hover)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            <span style={{ color: 'var(--color-text-secondary)', marginRight: 6 }}>#{kr.priority}</span>
                            {kr.title}
                          </div>
                          {kr.description && (
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                              {kr.description}
                            </p>
                          )}
                        </div>
                        {kr.score !== undefined && (
                          <div
                            style={{
                              padding: '2px 8px',
                              backgroundColor: 'var(--color-warning)',
                              color: '#fff',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ★ {kr.score}
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>进度</span>
                          <span style={{ fontWeight: 600, color: getProgressColor(kr.progress) }}>
                            {kr.progress}%
                          </span>
                        </div>
                        <div
                          style={{
                            height: 4,
                            backgroundColor: 'var(--color-border)',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${kr.progress}%`,
                              backgroundColor: getProgressColor(kr.progress),
                              borderRadius: 2,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="user-avatar" style={{ fontSize: 14 }}>
                            {krOwner?.avatar || '👤'}
                          </span>
                          <span>{krOwner?.name || '未知'}</span>
                        </div>
                        <span>截止：{new Date(kr.deadline).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OKRBoard;
