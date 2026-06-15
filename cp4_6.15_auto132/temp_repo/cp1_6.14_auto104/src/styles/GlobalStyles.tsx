import { Global, css } from '@emotion/react'
import { cyberTheme } from './theme'

const globalStyles = css`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body,
  #root {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  body {
    font-family: ${cyberTheme.fonts.body};
    font-weight: 500;
    font-size: 15px;
    color: ${cyberTheme.colors.textPrimary};
    background: ${cyberTheme.colors.bgDeep};
    background-image: radial-gradient(
        circle at 20% 10%,
        rgba(139, 0, 255, 0.12) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 90%,
        rgba(0, 255, 255, 0.08) 0%,
        transparent 50%
      ),
      linear-gradient(135deg, ${cyberTheme.colors.bgDeep} 0%, ${cyberTheme.colors.bgLight} 100%);
    background-attachment: fixed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    user-select: none;
  }

  #root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: linear-gradient(
        0deg,
        transparent 24%,
        rgba(0, 255, 255, 0.02) 25%,
        rgba(0, 255, 255, 0.02) 26%,
        transparent 27%,
        transparent 74%,
        rgba(0, 255, 255, 0.02) 75%,
        rgba(0, 255, 255, 0.02) 76%,
        transparent 77%,
        transparent
      ),
      linear-gradient(
        90deg,
        transparent 24%,
        rgba(0, 255, 255, 0.02) 25%,
        rgba(0, 255, 255, 0.02) 26%,
        transparent 27%,
        transparent 74%,
        rgba(0, 255, 255, 0.02) 75%,
        rgba(0, 255, 255, 0.02) 76%,
        transparent 77%,
        transparent
      );
    background-size: 60px 60px;
    animation: gridPulse 8s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes gridPulse {
    0%, 100% {
      opacity: 0.6;
      background-size: 60px 60px;
    }
    50% {
      opacity: 1;
      background-size: 64px 64px;
    }
  }

  @keyframes scanSweep {
    0% { transform: translateX(-120%); }
    100% { transform: translateX(120%); }
  }

  @keyframes glowPulse {
    0%, 100% { filter: brightness(1) drop-shadow(0 0 4px currentColor); }
    50% { filter: brightness(1.4) drop-shadow(0 0 12px currentColor); }
  }

  @keyframes flicker {
    0%, 100% { opacity: 1; }
    45% { opacity: 1; }
    47% { opacity: 0.4; }
    49% { opacity: 1; }
    72% { opacity: 1; }
    74% { opacity: 0.6; }
    76% { opacity: 1; }
  }

  @keyframes shake {
    0%, 100% { transform: translate(0, 0); }
    20% { transform: translate(-3px, 2px); }
    40% { transform: translate(3px, -2px); }
    60% { transform: translate(-2px, -2px); }
    80% { transform: translate(2px, 2px); }
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${cyberTheme.fonts.display};
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1.2;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    color: inherit;
    outline: none;
  }

  button:focus-visible {
    outline: 2px solid ${cyberTheme.colors.neonCyan};
    outline-offset: 2px;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: ${cyberTheme.colors.bgDeep};
  }

  ::-webkit-scrollbar-thumb {
    background: ${cyberTheme.colors.neonCyan}44;
    clip-path: polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${cyberTheme.colors.neonCyan}88;
  }

  .text-glow-cyan {
    text-shadow: 0 0 6px ${cyberTheme.colors.neonCyan}, 0 0 16px ${cyberTheme.colors.neonCyan}99;
  }

  .text-glow-red {
    text-shadow: 0 0 6px ${cyberTheme.colors.neonRed}, 0 0 16px ${cyberTheme.colors.neonRed}99;
  }
`

export const GlobalStyles = () => <Global styles={globalStyles} />
