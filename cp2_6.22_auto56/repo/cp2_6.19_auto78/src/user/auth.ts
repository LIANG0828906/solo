export interface User {
  id: string;
  name: string;
  role: 'employee' | 'admin';
  avatar: string;
}

const USER_KEY = 'creative_current_user';

const defaultUsers: User[] = [
  {
    id: 'admin1',
    name: '管理员',
    role: 'admin',
    avatar: '',
  },
  {
    id: 'emp1',
    name: '张三',
    role: 'employee',
    avatar: '',
  },
];

const generateAvatar = (name: string): string => {
  const colors = [
    ['#1abc9c', '#16a085'],
    ['#3498db', '#2980b9'],
    ['#9b59b6', '#8e44ad'],
    ['#e74c3c', '#c0392b'],
    ['#f39c12', '#e67e22'],
  ];
  const index = name.charCodeAt(0) % colors.length;
  const [c1, c2] = colors[index];
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
};

export const authService = {
  getCurrentUser(): User {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    
    const defaultUser: User = {
      id: 'emp1',
      name: '张三',
      role: 'employee',
      avatar: generateAvatar('张三'),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  },

  login(userId: string): User | null {
    const user = defaultUsers.find(u => u.id === userId);
    if (user) {
      const userWithAvatar = { ...user, avatar: generateAvatar(user.name) };
      localStorage.setItem(USER_KEY, JSON.stringify(userWithAvatar));
      return userWithAvatar;
    }
    return null;
  },

  loginAsAdmin(): User {
    const admin: User = {
      id: 'admin1',
      name: '管理员',
      role: 'admin',
      avatar: generateAvatar('管理员'),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(admin));
    return admin;
  },

  loginAsEmployee(): User {
    const employee: User = {
      id: 'emp1',
      name: '张三',
      role: 'employee',
      avatar: generateAvatar('张三'),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(employee));
    return employee;
  },

  logout(): void {
    localStorage.removeItem(USER_KEY);
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user.role === 'admin';
  },

  isEmployee(): boolean {
    const user = this.getCurrentUser();
    return user.role === 'employee';
  },

  hasRole(role: 'employee' | 'admin'): boolean {
    const user = this.getCurrentUser();
    return user.role === role;
  },

  updateUser(updates: Partial<User>): User {
    const current = this.getCurrentUser();
    const updated = { ...current, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  },
};
