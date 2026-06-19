import { useEffect, useRef, useState } from 'react';
import type { OnlineUser as OnlineUserType } from '@/broadcast/channel';

export type OnlineUser = OnlineUserType;

const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
];

const RANDOM_NAMES = [
  '画家',
  '画师',
  '艺术',
  '绘梦',
  '调色',
  '素描',
  '水彩',
  '油彩',
  '涂鸦',
  '墨韵',
];

export function generateUserId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function generateUserName(): string {
  const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${name}_${suffix}`;
}

export function generateAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function generateAvatarPattern(): number[] {
  const leftHalf: number[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      leftHalf.push(Math.random() > 0.5 ? 1 : 0);
    }
  }
  const pattern: number[] = [];
  for (let row = 0; row < 5; row++) {
    const rowStart = row * 3;
    pattern.push(leftHalf[rowStart]);
    pattern.push(leftHalf[rowStart + 1]);
    pattern.push(leftHalf[rowStart + 2]);
    pattern.push(leftHalf[rowStart + 1]);
    pattern.push(leftHalf[rowStart]);
  }
  return pattern;
}

type UserManagerProps = {
  currentUser: OnlineUser;
  onlineUsers: OnlineUser[];
  onUpdateUsers: (users: OnlineUser[]) => void;
};

function Avatar({ user, size = 32 }: { user: OnlineUser; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cellSize = size / 5;
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = user.avatarColor;

    for (let i = 0; i < user.avatarPattern.length; i++) {
      if (user.avatarPattern[i]) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }, [user, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, borderRadius: 4 }}
    />
  );
}

export default function UserManager({
  currentUser,
  onlineUsers,
}: UserManagerProps) {
  const [visibleUsers, setVisibleUsers] = useState<OnlineUser[]>(onlineUsers);
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(onlineUsers.map((u) => u.id));
    const prevIds = prevIdsRef.current;
    const added = onlineUsers.filter((u) => !prevIds.has(u.id));
    const removed = Array.from(prevIds).filter(
      (id) => !currentIds.has(id)
    );

    if (added.length > 0 || removed.length > 0) {
      setVisibleUsers(onlineUsers);
    } else {
      setVisibleUsers(onlineUsers);
    }

    prevIdsRef.current = currentIds;
  }, [onlineUsers]);

  return (
    <div
      className="fixed top-4 right-4 z-50"
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 180,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#6b7280',
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        在线用户 ({visibleUsers.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 4,
              borderRadius: 4,
              transition: 'opacity 300ms ease, transform 300ms ease',
              opacity: 1,
              background: user.id === currentUser.id ? '#f0f9ff' : 'transparent',
            }}
          >
            <Avatar user={user} size={32} />
            <div
              style={{
                fontSize: 13,
                color: '#374151',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name}
              {user.id === currentUser.id && (
                <span style={{ fontSize: 10, color: '#60a5fa', marginLeft: 4 }}>
                  (我)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
