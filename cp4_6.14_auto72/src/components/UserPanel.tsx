import React, { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { useDocStore, User } from '@/store/docStore';

/**
 * 用户管理模块（UserPanel）
 * 数据流向：
 *   - 从 store 读取 users、currentUserId
 *   - 调用 store.addUser() 添加新用户
 *   - 新增用户时 isNew=true，触发从底部滑入动画
 *   - 0.6s 后 isNew=false，动画结束
 *
 * 功能：
 *   - 在线用户列表（首字母圆形头像，32px直径）
 *   - 邀请新用户（输入昵称 + 邀请按钮）
 *   - 新增用户动画（从底部滑入 translateY + opacity）
 *   - 左侧面板宽度 280px
 */
const UserPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { users, currentUserId, addUser, showUserPanel } = useDocStore();
  const [inviteName, setInviteName] = useState('');

  const handleInvite = () => {
    if (!inviteName.trim()) return;
    addUser(inviteName.trim());
    setInviteName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInvite();
    }
  };

  const getInitial = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const isCurrentUser = (userId: string) => userId === currentUserId;

  return (
    <aside
      style={{
        width: 280,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
      className={showUserPanel ? 'md:flex' : 'hidden md:flex'}
    >
      <div
        style={{
          padding: '20px 16px 12px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Users size={18} color="#3b82f6" />
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
              color: '#1e293b',
            }}
          >
            在线成员
          </h3>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              color: '#64748b',
              backgroundColor: '#f1f5f9',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            {users.length} 人
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入昵称邀请加入"
            style={{
              flex: 1,
              height: 32,
              padding: '0 10px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#334155',
              minWidth: 0,
            }}
          />
          <button
            onClick={handleInvite}
            disabled={!inviteName.trim()}
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
            }}
            aria-label="邀请用户"
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">邀请</span>
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {users.map((user: User, index) => (
          <div
            key={user.id}
            className={user.isNew ? 'anim-slide-in-bottom' : ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 8,
              marginBottom: 4,
              backgroundColor: isCurrentUser(user.id)
                ? 'rgba(59, 130, 246, 0.08)'
                : 'transparent',
              transition: 'background-color 0.15s ease',
              animationFillMode: 'both',
              animationDelay: user.isNew ? `${index * 50}ms` : '0ms',
            }}
          >
            <div
              className="user-avatar"
              style={{ backgroundColor: user.color }}
            >
              {getInitial(user.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name}
                {isCurrentUser(user.id) && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      color: '#3b82f6',
                      fontWeight: 400,
                    }}
                  >
                    (我)
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  marginTop: 2,
                }}
              >
                阅读至 {user.positionPercent.toFixed(0)}%
              </div>
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.3)',
              }}
            />
          </div>
        ))}
      </div>

      {onClose && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: '100%',
              height: 32,
              fontSize: 13,
              color: '#64748b',
              backgroundColor: '#f1f5f9',
              borderRadius: 6,
            }}
          >
            关闭面板
          </button>
        </div>
      )}
    </aside>
  );
};

export default UserPanel;
