import { marked } from 'marked';

const codeBlockStyles: React.CSSProperties = {
  backgroundColor: '#2d2d2d',
  color: '#f8f8f2',
  padding: '16px',
  borderRadius: '8px',
  overflowX: 'auto',
  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '12px 0'
};

const inlineCodeStyles: React.CSSProperties = {
  backgroundColor: '#fff3e0',
  color: '#e65100',
  padding: '2px 6px',
  borderRadius: '4px',
  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
  fontSize: '0.9em'
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  margin: '16px 0',
  borderRadius: '8px',
  overflow: 'hidden'
};

const thStyles: React.CSSProperties = {
  backgroundColor: '#fff3e0',
  color: '#e65100',
  padding: '12px',
  textAlign: 'left',
  fontWeight: '600',
  borderBottom: '2px solid #ffcc80'
};

const tdStyles: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid #ffe0b2',
  color: '#5d4037'
};

const trEvenStyles: React.CSSProperties = {
  backgroundColor: '#fffaf0'
};

const headingBaseStyles: React.CSSProperties = {
  color: '#bf360c',
  fontWeight: '700',
  lineHeight: '1.3',
  marginBottom: '16px'
};

const paragraphStyles: React.CSSProperties = {
  color: '#5d4037',
  lineHeight: '1.7',
  marginBottom: '12px'
};

const listStyles: React.CSSProperties = {
  color: '#5d4037',
  lineHeight: '1.7',
  marginBottom: '12px',
  paddingLeft: '24px'
};

const blockquoteStyles: React.CSSProperties = {
  borderLeft: '4px solid #ff8a65',
  padding: '12px 16px',
  margin: '16px 0',
  backgroundColor: '#fff3e0',
  borderRadius: '0 8px 8px 0',
  color: '#6d4c41',
  fontStyle: 'italic'
};

const linkStyles: React.CSSProperties = {
  color: '#e65100',
  textDecoration: 'none',
  borderBottom: '1px solid #ffcc80',
  transition: 'color 0.2s'
};

const hrStyles: React.CSSProperties = {
  border: 'none',
  height: '2px',
  background: 'linear-gradient(90deg, transparent, #ffcc80, transparent)',
  margin: '24px 0'
};

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string;
}

export function applyMarkdownStyles(): void {
  const styleId = 'markdown-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .markdown-body h1 { font-size: 2em; margin-top: 0; }
    .markdown-body h2 { font-size: 1.5em; margin-top: 24px; }
    .markdown-body h3 { font-size: 1.25em; margin-top: 20px; }
    .markdown-body h4 { font-size: 1.1em; margin-top: 16px; }
    .markdown-body ul { list-style-type: disc; }
    .markdown-body ol { list-style-type: decimal; }
    .markdown-body li { margin-bottom: 8px; }
    .markdown-body img { max-width: 100%; border-radius: 8px; }
    .markdown-body strong { color: #bf360c; font-weight: 700; }
    .markdown-body em { color: #6d4c41; }
  `;
  document.head.appendChild(style);
}

export function getMarkdownStyle(property: string): React.CSSProperties {
  const stylesMap: Record<string, React.CSSProperties> = {
    code: codeBlockStyles,
    'inline-code': inlineCodeStyles,
    table: tableStyles,
    th: thStyles,
    td: tdStyles,
    'tr-even': trEvenStyles,
    h1: { ...headingBaseStyles, fontSize: '2em', marginTop: '0' },
    h2: { ...headingBaseStyles, fontSize: '1.5em', marginTop: '24px' },
    h3: { ...headingBaseStyles, fontSize: '1.25em', marginTop: '20px' },
    h4: { ...headingBaseStyles, fontSize: '1.1em', marginTop: '16px' },
    p: paragraphStyles,
    'ul,ol': listStyles,
    blockquote: blockquoteStyles,
    a: linkStyles,
    hr: hrStyles
  };
  return stylesMap[property] || {};
}
