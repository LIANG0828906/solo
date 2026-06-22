export type Language = 'python' | 'javascript';
export type Theme = 'dark' | 'light';

export interface Snippet {
  id: string;
  name: string;
  code: string;
  language: Language;
  lastModified: string;
}

export interface ExecuteResponse {
  output: string;
  error: boolean;
}
