import React from 'react';
import { Theme, themes } from '../styles/themes';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const themeLabels: Record<string, string> = {
  classic: '经典商务',
  modern: '现代简约',
  creative: '活泼创意',
  vintage: '复古文艺'
};

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  return (
    <div style={styles.container}>
      <span style={styles.label}>主题：</span>
      <div style={styles.themeList}>
        {themes.map((theme) => (
          <button
            key={theme.name}
            onClick={() => onThemeChange(theme)}
            style={{
              ...styles.themeButton,
              background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)`,
              transform: currentTheme.name === theme.name ? 'scale(1.15)' : 'scale(1)',
              boxShadow: currentTheme.name === theme.name
                ? `0 0 0 3px #ffffff, 0 0 0 5px ${theme.primaryColor}`
                : '0 2px 8px rgba(0,0,0,0.15)'
            }}
            title={themeLabels[theme.name]}
          />
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  label: {
    fontSize: '14px',
    color: '#666',
    fontWeight: 500
  },
  themeList: {
    display: 'flex',
    gap: '10px'
  },
  themeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
    padding: 0
  }
};

export default ThemeSelector;
