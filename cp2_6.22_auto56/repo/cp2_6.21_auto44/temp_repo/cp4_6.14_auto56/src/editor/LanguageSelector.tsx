import type { Language } from '../types';
import styles from './Editor.module.css';

interface LanguageSelectorProps {
  language: Language;
  onChange: (language: Language) => void;
}

const languages: { value: Language; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

export function LanguageSelector({ language, onChange }: LanguageSelectorProps) {
  return (
    <select
      className={styles.languageSelect}
      value={language}
      onChange={(e) => onChange(e.target.value as Language)}
    >
      {languages.map((lang) => (
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
