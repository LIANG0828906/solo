export interface ThemeColors {
  background: string;
  text: string;
  keyword: string;
  string: string;
  comment: string;
  number: string;
  function: string;
  variable: string;
  operator: string;
  punctuation: string;
  lineNumber: string;
  headerBackground: string;
  accent: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  previewBg: string;
}

export const FONTS = [
  {
    id: 'fira-code',
    name: 'Fira Code',
    value: "'Fira Code', monospace",
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    value: "'JetBrains Mono', monospace",
  },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    value: "'Source Code Pro', monospace",
  },
] as const;

export type FontId = (typeof FONTS)[number]['id'];

export const THEMES: Theme[] = [
  {
    id: 'monokai',
    name: 'Monokai',
    previewBg: '#1a1a14',
    colors: {
      background: '#272822',
      text: '#F8F8F2',
      keyword: '#F92672',
      string: '#E6DB74',
      comment: '#75715E',
      number: '#AE81FF',
      function: '#A6E22E',
      variable: '#FD971F',
      operator: '#F92672',
      punctuation: '#F8F8F2',
      lineNumber: '#64748B',
      headerBackground: '#1E1F1C',
      accent: '#E6DB74',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    previewBg: '#1e1f2b',
    colors: {
      background: '#282A36',
      text: '#F8F8F2',
      keyword: '#FF79C6',
      string: '#F1FA8C',
      comment: '#6272A4',
      number: '#BD93F9',
      function: '#50FA7B',
      variable: '#8BE9FD',
      operator: '#FF79C6',
      punctuation: '#F8F8F2',
      lineNumber: '#64748B',
      headerBackground: '#21222C',
      accent: '#BD93F9',
    },
  },
  {
    id: 'github',
    name: 'GitHub',
    previewBg: '#e6e8eb',
    colors: {
      background: '#FFFFFF',
      text: '#24292F',
      keyword: '#CF222E',
      string: '#0A3069',
      comment: '#6E7781',
      number: '#0550AE',
      function: '#8250DF',
      variable: '#953800',
      operator: '#CF222E',
      punctuation: '#24292F',
      lineNumber: '#8C959F',
      headerBackground: '#F6F8FA',
      accent: '#0969DA',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    previewBg: '#242932',
    colors: {
      background: '#2E3440',
      text: '#D8DEE9',
      keyword: '#81A1C1',
      string: '#A3BE8C',
      comment: '#616E88',
      number: '#B48EAD',
      function: '#88C0D0',
      variable: '#D08770',
      operator: '#81A1C1',
      punctuation: '#D8DEE9',
      lineNumber: '#64748B',
      headerBackground: '#252A33',
      accent: '#88C0D0',
    },
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    previewBg: '#f0e7cc',
    colors: {
      background: '#FDF6E3',
      text: '#586E75',
      keyword: '#859900',
      string: '#2AA198',
      comment: '#93A1A1',
      number: '#D33682',
      function: '#268BD2',
      variable: '#B58900',
      operator: '#859900',
      punctuation: '#586E75',
      lineNumber: '#93A1A1',
      headerBackground: '#EEE8D5',
      accent: '#268BD2',
    },
  },
];
