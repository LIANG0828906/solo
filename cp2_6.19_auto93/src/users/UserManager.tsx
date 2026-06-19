import { useEffect, useRef, useState } from 'react';

export type OnlineUser = {
  id: string;
  name: string;
  avatarColor: string;
  avatarPattern: number[];
};

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

function mixColor(color: string, mix: string, weight: number): string {
  const hex = color.replace('#', '');
  const r1 = parseInt(hex.substring(0, 2), 16);
  const g1 = parseInt(hex.substring(2, 4), 16);
  const b1 = parseInt(hex.substring(4, 6), 16);
  const mixHex = mix.replace('#', '');
  const r2 = parseInt(mixHex.substring(0, 2), 16);
  const g2 = parseInt(mixHex.substring(2, 4), 16);
  const b2 = parseInt(mixHex.substring(4, 6), 16);
  const r = Math.round(r1 * (1 - weight) + r2 * weight);
  const g = Math.round(g1 * (1 - weight) + g2 * weight);
  const b = Math.round(b1 * (1 - weight) + b2 * weight);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

type AvatarProps = {
  user: OnlineUser;
  size?: number;
};

function Avatar({ user, size = 32 }: AvatarProps) {
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

    const radius = size * 0.18;
    const cellSize = size / 5;
    const bgColor = mixColor(user.avatarColor, '#FFFFFF', 0.8);
    const borderColor = mixColor(user.avatarColor, '#000000', 0.15);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = user.avatarColor;

    for (let i = 0; i < user.avatarPattern.length; i++) {
      if (!user.avatarPattern[i]) continue;
      const row = Math.floor(i / 5);
      const col = i % 5;
      const x = col * cellSize;
      const y = row * cellSize;
      const shapeIndex = (row * 5 + col + user.avatarPattern[i]) % 4;
      const pad = cellSize * 0.12;
      const cx = x + cellSize / 2;
      const cy = y + cellSize / 2;
      const r = (cellSize - pad * 2) / 2;

      ctx.save();
      ctx.beginPath();
      switch (shapeIndex) {
        case 0:
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          break;
        case 1:
          ctx.moveTo(cx, y + pad);
          ctx.lineTo(x + cellSize - pad, y + cellSize - pad);
          ctx.lineTo(x + pad, y + cellSize - pad);
          ctx.closePath();
          break;
        case 2:
          ctx.moveTo(cx, y + pad);
          ctx.lineTo(x + cellSize - pad, cy);
          ctx.lineTo(cx, y + cellSize - pad);
          ctx.lineTo(x + pad, cy);
          ctx.closePath();
          break;
        case 3:
        default: {
          const rr = cellSize * 0.18;
          const x0 = x + pad;
          const y0 = y + pad;
          const w = cellSize - pad * 2;
          const h = cellSize - pad * 2;
          ctx.moveTo(x0 + rr, y0);
          ctx.lineTo(x0 + w - rr, y0);
          ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + rr);
          ctx.lineTo(x0 + w, y0 + h - rr);
          ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - rr, y0 + h);
          ctx.lineTo(x0 + rr, y0 + h);
          ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - rr);
          ctx.lineTo(x0, y0 + rr);
          ctx.quadraticCurveTo(x0, y0, x0 + rr, y0);
          ctx.closePath();
          break;
        }
      }
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }, [user, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, borderRadius: size * 0.18, display: 'block' }}
    />
  );
}

type UserManagerProps = {
  currentUser: OnlineUser;
  onlineUsers: OnlineUser[];
  onUpdateUsers?: (users: OnlineUser[]) => void;
};

type AnimatedUser = OnlineUser & {
  leaving?: boolean;
  entering?: boolean;
};

export default function UserManager({
  currentUser,
  onlineUsers,
}: UserManagerProps) {
  const allUsers = [currentUser, ...onlineUsers];
  const [animatedUsers, setAnimatedUsers] = useState<AnimatedUser[]>(allUsers);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const currentIds = new Set(allUsers.map((u) => u.id));
    const prevIds = new Set(animatedUsers.map((u) => u.id));
    const added = allUsers.filter((u) => !prevIds.has(u.id));
    const removedIds = animatedUsers.filter((u) => !currentIds.has(u.id) && !u.leaving).map((u) => u.id);

    if (added.length === 0 && removedIds.length === 0) {
      const changed = animatedUsers.some((u, idx) => {
        const match = allUsers.find((a) => a.id === u.id);
        return !match || idx !== allUsers.findIndex((a) => a.id === u.id);
      });
      if (changed) {
        setAnimatedUsers([
          ...animatedUsers.filter((u) => u.leaving),
          ...allUsers.map((u) => ({ ...u })),
        ]);
      }
      return;
    }

    timersRef.current.forEach((t, id) => {
      if (removedIds.includes(id) || added.find((a) => a.id === id)) {
        clearTimeout(t);
        timersRef.current.delete(id);
      }
    });

    setAnimatedUsers((prev) => {
      const withoutRemoved = prev.map((u) =>
        removedIds.includes(u.id) ? { ...u, leaving: true } : u
      );
      const withAdded = [
        ...withoutRemoved.filter((u) => !u.leaving || !currentIds.has(u.id)),
        ...added.map((u) => ({ ...u, entering: true, leaving: false })),
      ];
      return withAdded;
    });

    if (added.length > 0) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setAnimatedUsers((prev) =>
            prev.map((u) => (added.find((a) => a.id === u.id) ? { ...u, entering: false } : u))
          );
        });
      });
    }

    removedIds.forEach((id) => {
      const timer = setTimeout(() => {
        setAnimatedUsers((prev) => prev.filter((u) => u.id !== id));
        timersRef.current.delete(id);
      }, 300);
      timersRef.current.set(id, timer);
    });
  }, [allUsers]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const displayUsers = animatedUsers.filter(
    (u) => u.id === currentUser.id || allUsers.find((a) => a.id === u.id) || u.leaving
  );

  const orderedUsers: AnimatedUser[] = [];
  allUsers.forEach((u) => {
    const match = displayUsers.find((d) => d.id === u.id);
    if (match) orderedUsers.push(match);
  });
  displayUsers.forEach((u) => {
    if (u.leaving && !orderedUsers.find((o) => o.id === u.id)) {
      orderedUsers.push(u);
    }
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 50,
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
        在线用户 ({allUsers.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {orderedUsers.map((user) => {
          const isLeaving = user.leaving;
          const isEntering = user.entering;
          return (
            <div
              key={user.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 4,
                borderRadius: 4,
                transition: 'opacity 300ms ease, transform 300ms ease',
                opacity: isLeaving || isEntering ? 0 : 1,
                transform: isLeaving || isEntering ? 'scale(0.8)' : 'scale(1)',
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
          );
        })}
      </div>
    </div>
  );
}
