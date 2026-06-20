import { useState } from 'react';
import { useApp } from '../App';
import type { MergedDish } from '../types';

function renderSpicy(n: number) {
  return '🌶️'.repeat(n);
}
function MergedRow({ item, memberCount }: { item: MergedDish; memberCount: number }) {
  const pct = memberCount > 0 ? Math.round((item.count / memberCount) * 100) : 0;
  return (
    <div className="merged-item">
      <div className="merged-emoji">{item.dish.emoji}</div>
      <div>
        <div className="merged-name">
          {item.dish.name} <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>{renderSpicy(item.dish.spiciness) || '🌱'}</span>
        </div>
        <div className="merged-meta">
          {item.memberIds.length === memberCount && memberCount > 1 ? '全员选择 👨‍👩‍👧‍👦' : `${item.count}人想吃 · ${pct}%`}
        </div>
      </div>
      <div className="merged-count">×{item.count}</div>
      <div className="merged-price">¥{(item.dish.price).toFixed(0)}</div>
    </div>
  );
}

function avatarLetter(name: string) {
  const n = name.trim();
  return n ? n.charAt(0).toUpperCase() : '?';
}

export default function GroupPanel() {
  const { state, createGroup, joinMember, setCurrentMember } = useApp();
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');

  const group = state.group;
  const totalMembers = group?.members.length || 0;
  const totalCount = state.merged.reduce((s, x) => s + x.count, 0);
  const originalTotal = state.merged.reduce((s, x) => s + x.dish.price, 0);

  return (
    <div className="card">
      <h2 className="section-title">拼单小组</h2>

      {!group && (
        <>
          <div className="hero-empty">
            <div className="hero-emoji">🍽️</div>
            <h3>开启美味拼单</h3>
            <p>创建小组邀请好友，或加入已有小组一起凑单更划算！</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>🆕 创建拼单</div>
              <input
                className="input"
                placeholder="你的昵称"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                maxLength={10}
              />
              <div className="form-row">
                <button
                  className="btn btn-primary btn-block"
                  disabled={!createName.trim()}
                  onClick={() => createGroup(createName.trim())}
                >
                  创建小组
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>🤝 快速体验</div>
              <input
                className="input"
                placeholder="加入演示小组"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                maxLength={10}
              />
              <div className="form-row">
                <button
                  className="btn btn-ghost btn-block"
                  onClick={() => {
                    if (!joinName.trim()) {
                      alert('请先输入昵称');
                      return;
                    }
                    if (!group) {
                      createGroup('组长小明').then(() => {
                        setTimeout(() => joinMember(joinName.trim()), 100);
                      });
                    } else {
                      joinMember(joinName.trim());
                    }
                  }}
                >
                  立即加入
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {group && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 2 }}>小组编号</div>
              <div
                className="group-code"
                onClick={() => {
                  navigator.clipboard?.writeText(group.id);
                  alert('小组ID已复制，可分享给好友！');
                }}
                title="点击复制小组ID"
              >
                📋 {group.id.slice(0, 8)}...
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13 }}>
              <div style={{ color: 'var(--text-soft)' }}>成员</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--primary-dark)' }}>
                {totalMembers} / {group.maxMembers}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, margin: '8px 0 10px', color: 'var(--text-soft)' }}>
            选择自己的身份进行点菜：
          </div>
          <div className="member-list">
            {group.members.map((m) => (
              <button
                key={m.id}
                className={`member-chip ${state.currentMemberId === m.id ? 'active' : ''}`}
                onClick={() => setCurrentMember(m.id)}
              >
                <span className="member-avatar">{avatarLetter(m.name)}</span>
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-soft)', marginLeft: 4 }}>
                  {m.selectedDishIds.length}道
                </span>
              </button>
            ))}
            {group.members.length < group.maxMembers && (
              <button
                className="member-chip"
                style={{ border: '2px dashed #e8d9b5', background: 'transparent' }}
                onClick={() => {
                  const n = prompt('请输入新成员昵称：', `成员${group.members.length + 1}`);
                  if (n?.trim()) joinMember(n.trim());
                }}
              >
                <span className="member-avatar" style={{ background: '#fff3cf', color: 'var(--primary-dark)' }}>
                  +
                </span>
                <span style={{ color: 'var(--text-soft)' }}>添加成员</span>
              </button>
            )}
          </div>

          <h3 className="section-title" style={{ marginTop: 22 }}>
            套餐清单
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-soft)', marginLeft: 'auto' }}>
              共 {state.merged.length} 种 · {totalCount} 份
            </span>
          </h3>

          {state.merged.length === 0 ? (
            <div className="empty-hint">
              <span className="big">🍴</span>
              还没有人点菜，去左侧勾选你想吃的吧～
            </div>
          ) : (
            <>
              <div className="merged-list">
                {state.merged.map((m) => (
                  <MergedRow key={m.dish.id} item={m} memberCount={totalMembers} />
                ))}
              </div>
              <div className="total-line">
                <span>套餐原价</span>
                <strong>¥{originalTotal.toFixed(2)}</strong>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
