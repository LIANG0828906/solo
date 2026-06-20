const TEAM_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#84CC16',
  '#6366F1',
  '#14B8A6',
  '#F43F5E',
];

export const generateTeamColor = (index: number): string => {
  return TEAM_COLORS[index % TEAM_COLORS.length];
};

export const getColorByTeamId = (teamId: string, teams: { id: string; color: string }[]): string => {
  const team = teams.find(t => t.id === teamId);
  return team?.color || '#9CA3AF';
};

export const lightenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

export const darkenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

export const getStatusColor = (status: 'available' | 'occupied' | 'maintenance'): string => {
  const colors = {
    available: '#10B981',
    occupied: '#EF4444',
    maintenance: '#F59E0B',
  };
  return colors[status];
};

export const getStatusBgColor = (status: 'available' | 'occupied' | 'maintenance'): string => {
  const colors = {
    available: 'rgba(16, 185, 129, 0.1)',
    occupied: 'rgba(239, 68, 68, 0.1)',
    maintenance: 'rgba(245, 158, 11, 0.1)',
  };
  return colors[status];
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
