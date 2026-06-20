export const COLORS = {
  bgPrimary: '#1a1a2e',
  bgCard: 'rgba(38, 38, 60, 0.9)',
  textPrimary: '#e0e0e0',
  textSecondary: '#a0a0b0',
  accent: '#ffb347',
  accentLight: '#ffc870',
  accentDark: '#e69a2e',
  draftGradient: 'linear-gradient(135deg, #6b7280, #4b5563)',
  publishedGradient: 'linear-gradient(135deg, #ffb347, #ff8c00)',
  timelineLine: 'linear-gradient(180deg, #ffb347, #6366f1)',
  waveformColor: '#60a5fa',
  waveformGlow: 'rgba(96, 165, 250, 0.6)',
};

export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

export const AUDIO = {
  sampleRate: 44100,
  maxPreviewDuration: 30,
  fadeDuration: 0.3,
};

export const LAYOUT = {
  sidebarWidth: 260,
  mobileBreakpoint: 768,
  borderRadius: 12,
};

export const MILESTONE_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  writing: { label: '写词', icon: 'pen-line', color: '#60a5fa' },
  arrangement: { label: '编曲', icon: 'music', color: '#a78bfa' },
  recording: { label: '录音', icon: 'mic', color: '#f472b6' },
  mixing: { label: '混音', icon: 'sliders-horizontal', color: '#34d399' },
  release: { label: '发布', icon: 'rocket', color: '#ffb347' },
};

export const STORAGE_KEYS = {
  works: 'tracktales_works',
  votes: 'tracktales_votes',
  appState: 'tracktales_app_state',
  lastWorkId: 'tracktales_last_work_id',
};
