export const SCENE_CONFIG = {
  sunRadius: 5,
  minDistance: 5,
  maxDistance: 150,
  maxBoundary: 300,
  orbitLineWidth: 0.02,
  orbitOpacity: 0.3,
  labelFontSize: 12,
  labelOffset: 1.5,
  defaultCameraPosition: [0, 40, 120] as [number, number, number],
  highQualitySegments: 64,
  lowQualitySegments: 16,
};

export const ANIMATION_CONFIG = {
  baseOrbitSpeed: 0.05,
  baseRotationSpeed: 0.5,
  glowPulseSpeed: 0.5,
  minGlowScale: 1,
  maxGlowScale: 1.3,
};

export const UI_CONFIG = {
  panelWidth: 320,
  mobileBreakpoint: 768,
  desktopBreakpoint: 1024,
  transitionDuration: 300,
  mobileDrawerHeight: '40vh',
};

export const COLORS = {
  background: '#0B0B1A',
  panelBg: 'rgba(15, 23, 42, 0.85)',
  panelBorder: 'rgba(255, 255, 255, 0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  accent: '#3B82F6',
  accentLight: '#60A5FA',
  trackBg: '#1E293B',
  infoBg: '#1E2A4A',
  sunGlowInner: '#FFD700',
  sunGlowOuter: '#FF4500',
};
