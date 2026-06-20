import { THEME } from '@/config/gameConfig'

export const cyberTheme = {
  ...THEME,
  shadows: {
    neonCyan: `0 0 4px ${THEME.colors.neonCyan}, 0 0 12px ${THEME.colors.neonCyan}88`,
    neonPurple: `0 0 4px ${THEME.colors.neonPurple}, 0 0 12px ${THEME.colors.neonPurple}88`,
    neonRed: `0 0 4px ${THEME.colors.neonRed}, 0 0 12px ${THEME.colors.neonRed}88`,
    inset: `inset 0 0 20px rgba(0, 255, 255, 0.08)`
  },
  clipPaths: {
    sharpCutLeft: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)',
    sharpCutRight: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
    sharpCutAll:
      'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
    notched:
      'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
  },
  breakpoints: {
    tablet: 1024,
    mobile: 768
  }
} as const

export type CyberTheme = typeof cyberTheme
