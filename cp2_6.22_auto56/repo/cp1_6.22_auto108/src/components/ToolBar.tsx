import { useState } from 'react';
import type { Language } from '../utils/codeProcessor';
import './ToolBar.css';

interface ToolBarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onMinify: () => void;
  onFormat: () => void;
}

const languages: { value: Language; label: string; icon: string }[] = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'css', label: 'CSS', icon: '🎨' },
  { value: 'html', label: 'HTML', icon: '🌐' },
];

export default function ToolBar({ language, onLanguageChange, onMinify, onFormat }: ToolBarProps) {
  const [minifyActive, setMinifyActive] = useState(false);
  const [formatActive, setFormatActive] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleMinifyClick = () => {
    setMinifyActive(true);
    setTimeout(() => setMinifyActive(false), 200);
    onMinify();
  };

  const handleFormatClick = () => {
    setFormatActive(true);
    setTimeout(() => setFormatActive(false), 200);
    onFormat();
  };

  const currentLang = languages.find((l) => l.value === language) || languages[0];

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className={`language-selector ${dropdownOpen ? 'open' : ''}`}>
          <button
            className="language-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          >
            <span className="language-icon">{currentLang.icon}</span>
            <span className="language-label">{currentLang.label}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          {dropdownOpen && (
            <div className="dropdown-menu">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  className={`dropdown-item ${lang.value === language ? 'active' : ''}`}
                  onClick={() => {
                    onLanguageChange(lang.value);
                    setDropdownOpen(false);
                  }}
                >
                  <span className="language-icon">{lang.icon}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="toolbar-right">
        <button
          className={`action-button minify-button ${minifyActive ? 'active' : ''}`}
          onClick={handleMinifyClick}
        >
          压缩
        </button>
        <button
          className={`action-button format-button ${formatActive ? 'active' : ''}`}
          onClick={handleFormatClick}
        >
          格式化
        </button>
      </div>
    </div>
  );
}
