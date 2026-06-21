export interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  html: string;
  css: string;
  javascript: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateSnippetRequest {
  name: string;
  description: string;
  html: string;
  css: string;
  javascript: string;
}

export interface ConsoleMessage {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
}
