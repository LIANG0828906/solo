export const theme = {
  colors: {
    primary: '#3498DB',
    secondary: '#2ECC71',
    danger: '#E74C3C',
    sidebarBg: '#2C3E50',
    sidebarText: '#FFFFFF',
    actionItemOverdue: '#FFF0F0',
    cardShadow: 'rgba(0,0,0,0.1)',
    statusPending: '#95A5A6',
    statusInProgress: '#2ECC71',
    statusOverdue: '#E74C3C',
    statusCompleted: '#95A5A6',
  },
  layout: {
    sidebarWidth: 260,
    cardRadius: 10,
    tagRadius: 6,
  },
  animations: {
    elasticSnap: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    transitionFast: '0.2s ease',
    transitionMedium: '0.3s ease',
    transitionSlow: '0.5s ease',
  },
  fonts: {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

export type Theme = typeof theme;
