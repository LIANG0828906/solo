import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';

export type Language = 'javascript' | 'python' | 'html';

const LANGUAGE_MAP: Record<Language, string> = {
  javascript: 'javascript',
  python: 'python',
  html: 'markup',
};

export function highlightCode(code: string, language: Language): string {
  const grammarLang = LANGUAGE_MAP[language] || 'javascript';
  const grammar = Prism.languages[grammarLang];
  if (!grammar) {
    return escapeHtml(code);
  }
  return Prism.highlight(code, grammar, grammarLang);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
