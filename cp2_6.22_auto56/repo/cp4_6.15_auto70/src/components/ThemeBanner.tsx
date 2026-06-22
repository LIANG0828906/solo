import { ThemeType, THEME_LABELS } from '../words';
import './ThemeBanner.css';

interface ThemeBannerProps {
  theme: ThemeType;
}

export default function ThemeBanner({ theme }: ThemeBannerProps) {
  return (
    <div className="theme-banner" key={theme}>
      <span className="theme-ribbon">
        {THEME_LABELS[theme]}
      </span>
    </div>
  );
}
