export interface Snippet {
  id: string;
  title: string;
  content: string;
  language: string;
  createdAt: number;
  expiresAt: number | null;
  favorite: boolean;
  shareId: string;
}

export type ThemeName = 'monokai' | 'dracula' | 'github';

export type Expiration = '1h' | '24h' | '7d' | 'never';

export const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'php', label: 'PHP' },
  { value: 'go', label: 'Go' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
] as const;

export const EXPIRATION_OPTIONS: { value: Expiration; label: string }[] = [
  { value: '1h', label: '1 小时' },
  { value: '24h', label: '24 小时' },
  { value: '7d', label: '7 天' },
  { value: 'never', label: '永不过期' },
];

export function getExpirationMs(expiration: Expiration): number | null {
  switch (expiration) {
    case '1h': return Date.now() + 60 * 60 * 1000;
    case '24h': return Date.now() + 24 * 60 * 60 * 1000;
    case '7d': return Date.now() + 7 * 24 * 60 * 60 * 1000;
    case 'never': return null;
  }
}
