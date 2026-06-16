import type { User, VisitedGallery } from '../shared/types';

const TOKEN_KEY = 'vg_auth_token';
const USER_KEY = 'vg_user_data';

interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

const generateAvatar = (seed: string): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  const letter = seed.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${color}" rx="40"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="36" fill="#FFFFFF" font-weight="bold">${letter}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const AuthService = {
  register: async (username: string, email: string, password: string): Promise<AuthResult> => {
    await new Promise((r) => setTimeout(r, 300));

    if (password.length < 6) {
      return { success: false, error: '密码长度至少6位' };
    }
    if (username.length < 2) {
      return { success: false, error: '用户名至少2个字符' };
    }

    const existingUsers = JSON.parse(localStorage.getItem('vg_users') || '[]');
    if (existingUsers.some((u: { email: string }) => u.email === email)) {
      return { success: false, error: '邮箱已被注册' };
    }

    const userId = crypto.randomUUID();
    const user: User = {
      id: userId,
      username,
      email,
      avatar: generateAvatar(username),
      createdAt: new Date().toISOString(),
      galleries: [],
      following: [],
      visitedGalleries: [],
    };

    existingUsers.push({ ...user, passwordHash: btoa(password) });
    localStorage.setItem('vg_users', JSON.stringify(existingUsers));

    const token = btoa(`${userId}:${Date.now()}`);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { success: true, user, token };
  },

  login: async (email: string, password: string): Promise<AuthResult> => {
    await new Promise((r) => setTimeout(r, 300));

    const existingUsers = JSON.parse(localStorage.getItem('vg_users') || '[]');
    const found = existingUsers.find(
      (u: { email: string; passwordHash: string }) =>
        u.email === email && u.passwordHash === btoa(password)
    );

    if (!found) {
      return { success: false, error: '邮箱或密码错误' };
    }

    const { passwordHash, ...user } = found;
    const token = btoa(`${user.id}:${Date.now()}`);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { success: true, user, token };
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (!token || !userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY) !== null;
  },

  updateUser: (updates: Partial<User>): User | null => {
    const current = AuthService.getCurrentUser();
    if (!current) return null;

    const updated: User = { ...current, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));

    const existingUsers = JSON.parse(localStorage.getItem('vg_users') || '[]');
    const idx = existingUsers.findIndex((u: { id: string }) => u.id === updated.id);
    if (idx >= 0) {
      existingUsers[idx] = { ...existingUsers[idx], ...updated };
      localStorage.setItem('vg_users', JSON.stringify(existingUsers));
    }

    return updated;
  },

  addVisitedGallery: (visited: VisitedGallery): void => {
    const current = AuthService.getCurrentUser();
    if (!current) return;
    const exists = current.visitedGalleries.some(v => v.galleryId === visited.galleryId);
    if (exists) {
      const updated = {
        ...current,
        visitedGalleries: current.visitedGalleries.map(v =>
          v.galleryId === visited.galleryId ? { ...v, visitedAt: new Date().toISOString() } : v
        ),
      };
      AuthService.updateUser(updated);
    } else {
      const all = [...current.visitedGalleries, visited].slice(-200);
      AuthService.updateUser({ ...current, visitedGalleries: all });
    }
  },

  followGallery: (galleryId: string): void => {
    const current = AuthService.getCurrentUser();
    if (!current) return;
    if (current.following.includes(galleryId)) return;
    AuthService.updateUser({
      ...current, following: [...current.following, galleryId] });
  },

  unfollowGallery: (galleryId: string): void => {
    const current = AuthService.getCurrentUser();
    if (!current) return;
    AuthService.updateUser({
      ...current,
      following: current.following.filter(id => id !== galleryId),
    });
  },

  isFollowing: (galleryId: string): boolean => {
    const current = AuthService.getCurrentUser();
    if (!current) return false;
    return current.following.includes(galleryId);
  },
};
