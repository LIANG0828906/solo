import { marked } from 'marked';

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string;
}

export function applyMarkdownStyles(): void {
  const styleId = 'markdown-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .markdown-body {
      color: #5d4037;
      line-height: 1.7;
      font-size: 15px;
    }
    .markdown-body h1 { 
      font-size: 2em; 
      margin-top: 0; 
      color: #bf360c; 
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #ffe0b2;
    }
    .markdown-body h2 { 
      font-size: 1.5em; 
      margin-top: 24px; 
      color: #bf360c; 
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 16px;
    }
    .markdown-body h3 { 
      font-size: 1.25em; 
      margin-top: 20px; 
      color: #e65100; 
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 12px;
    }
    .markdown-body h4 { 
      font-size: 1.1em; 
      margin-top: 16px; 
      color: #e65100; 
      font-weight: 600;
      line-height: 1.3;
      margin-bottom: 12px;
    }
    .markdown-body p {
      color: #5d4037;
      line-height: 1.7;
      margin-bottom: 12px;
    }
    .markdown-body ul { 
      list-style-type: disc; 
      color: #5d4037;
      line-height: 1.7;
      margin-bottom: 12px;
      padding-left: 24px;
    }
    .markdown-body ol { 
      list-style-type: decimal; 
      color: #5d4037;
      line-height: 1.7;
      margin-bottom: 12px;
      padding-left: 24px;
    }
    .markdown-body li { 
      margin-bottom: 8px; 
    }
    .markdown-body img { 
      max-width: 100%; 
      border-radius: 8px; 
      margin: 16px 0;
    }
    .markdown-body strong { 
      color: #bf360c; 
      font-weight: 700; 
    }
    .markdown-body em { 
      color: #6d4c41; 
      font-style: italic;
    }
    .markdown-body a {
      color: #e65100;
      text-decoration: none;
      border-bottom: 1px solid #ffcc80;
      transition: all 0.2s ease;
    }
    .markdown-body a:hover {
      color: #bf360c;
      border-bottom-color: #e65100;
    }
    .markdown-body blockquote {
      border-left: 4px solid #ff8a65;
      padding: 12px 16px;
      margin: 16px 0;
      background-color: #fff3e0;
      border-radius: 0 8px 8px 0;
      color: #6d4c41;
      font-style: italic;
    }
    .markdown-body blockquote p {
      margin-bottom: 0;
    }
    .markdown-body hr {
      border: none;
      height: 2px;
      background: linear-gradient(90deg, transparent, #ffcc80, transparent);
      margin: 24px 0;
    }
    .markdown-body code {
      background-color: #fff3e0;
      color: #e65100;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }
    .markdown-body pre {
      background-color: #2d2d2d;
      color: #f8f8f2;
      padding: 16px 20px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
      margin: 16px 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .markdown-body pre code {
      background-color: transparent;
      color: #f8f8f2;
      padding: 0;
      border-radius: 0;
      font-size: 14px;
    }
    .markdown-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }
    .markdown-body table th {
      background-color: #fff3e0;
      color: #e65100;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #ffcc80;
    }
    .markdown-body table td {
      padding: 12px 16px;
      border-bottom: 1px solid #ffe0b2;
      color: #5d4037;
    }
    .markdown-body table tr:nth-child(even) {
      background-color: #fffaf0;
    }
    .markdown-body table tr:hover {
      background-color: #fff8e1;
    }
    .markdown-body table tr:last-child td {
      border-bottom: none;
    }
  `;
  document.head.appendChild(style);
}

export function getMarkdownStyle(property: string): React.CSSProperties {
  return {};
}
