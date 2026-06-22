import React from 'react';
import { themes } from '../styles/themes';
import type { Theme } from '../styles/themes';

interface ThemeSwitcherProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
  navbarText: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange, navbarText }) => {
  return (
    <div className="theme-switcher">
      <span className="theme-switcher-label" style={{ color: navbarText }}>
        主题:
      </span>
      {themes.map((theme: Theme) => (
        <div
          key={theme.id}
          className={`theme-swatch ${currentTheme === theme.id ? 'active' : ''}`}
          style={{
            background: theme.preview,
            color: navbarText,
          }}
          onClick={() => onThemeChange(theme.id)}
          title={theme.name}
        />
      ))}
    </div>
  );
};

export default ThemeSwitcher;
