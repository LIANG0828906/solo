import type { Note } from '../types';

const CODE_RE = /```([\s\S]*?)```/g;
const HEADING_RE = /^(#{1,6})\s+(.*)$/gm;
const BOLD_RE = /\*\*([^*]+)\*\*/g;
const ITALIC_RE = /\*([^*]+)\*/g;
const QUOTE_RE = /^>\s?(.*)$/gm;
const LIST_RE = /^[-*]\s+(.*)$/gm;
const OLIST_RE = /^\d+\.\s+(.*)$/gm;
const LINK_RE = /\[\[([^\]]+)\]\]/g;
const TAG_RE = /(^|\s)#([^\s#]+)(?=\s|$|[.,!?;:，。！？；：])/g;
const HEADING_PROTECT_RE = /^(#{1,6})(\s)/gm;
const INLINE_CODE_RE = /`([^`]+)`/g;
const HR_RE = /^---+$/gm;

const JS_KEYWORDS = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'import', 'from', 'export', 'default', 'class', 'new', 'for', 'while', 'async', 'await', 'try', 'catch'];
const TS_KEYWORDS = ['interface', 'type', 'public', 'private', 'protected', 'implements', 'extends'];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function highlightCode(code: string, lang: string): string {
  let html = escapeHtml(code.trimEnd());
  const keywords = lang === 'ts' || lang === 'typescript' ? [...JS_KEYWORDS, ...TS_KEYWORDS] : JS_KEYWORDS;
  for (const kw of keywords) {
    const re = new RegExp(`\\b${kw}\\b`, 'g');
    html = html.replace(re, `<span style="color:#c792ea">${kw}</span>`);
  }
  html = html.replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span style="color:#c3e88d">$1</span>');
  html = html.replace(/(\/\/.*$)/gm, '<span style="color:#546e7a;font-style:italic">$1</span>');
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f78c6c">$1</span>');
  return html;
}

interface RenderOptions {
  onLinkClick?: (title: string) => void;
  onTagClick?: (tag: string) => void;
  notes: Note[];
}

export function renderMarkdown(md: string, opts: RenderOptions): string {
  const codeBlocks: string[] = [];
  const linkTokens: Array<{ token: string; html: string }> = [];
  const tagTokens: Array<{ token: string; html: string }> = [];
  let processed = md;

  processed = processed.replace(CODE_RE, (_, inner) => {
    const idx = codeBlocks.length;
    codeBlocks.push(inner);
    return `__CODEBLOCK${idx}__`;
  });

  processed = processed.replace(HEADING_PROTECT_RE, (_, hashes, space) => {
    return `__HEADING${hashes.length}__${space}`;
  });

  processed = processed.replace(LINK_RE, (_m, title) => {
    const titleTrim = title.trim();
    const exists = opts.notes.some((n) => n.title.trim() === titleTrim);
    const color = exists ? '#4a90d9' : '#e94560';
    const onClickAttr = opts.onLinkClick
      ? ` data-dg-link="${encodeURIComponent(titleTrim)}"`
      : '';
    const html = `<a class="dg-link" data-title="${escapeHtml(titleTrim)}"${onClickAttr} style="color:${color};text-decoration:none;border-bottom:2px solid ${color};cursor:pointer;transition:opacity 150ms" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1">${escapeHtml(titleTrim)}</a>`;
    const token = `__LINK${linkTokens.length}__`;
    linkTokens.push({ token, html });
    return token;
  });

  processed = processed.replace(TAG_RE, (_m, prefix, tag) => {
    const onClickAttr = opts.onTagClick
      ? ` data-dg-tag="${encodeURIComponent(tag)}"`
      : '';
    const html = `<span class="dg-tag" data-tag="${escapeHtml(tag)}"${onClickAttr} style="display:inline-block;background:#4a90d9;color:#ffffff;padding:1px 8px;border-radius:4px;font-size:12px;margin:0 2px;cursor:pointer;transition:transform 150ms,opacity 150ms" onmouseover="this.style.opacity=0.85;this.style.transform='translateY(-1px)'" onmouseout="this.style.opacity=1;this.style.transform='none'">#${escapeHtml(tag)}</span>`;
    const token = `__TAG${tagTokens.length}__`;
    tagTokens.push({ token, html });
    return prefix + token;
  });

  processed = processed.replace(/__HEADING(\d+)__/g, (_m, num) => {
    return '#'.repeat(parseInt(num, 10));
  });

  processed = escapeHtml(processed);

  processed = processed.replace(HEADING_RE, (_m, hashes: string, text: string) => {
    const level = hashes.length;
    const post = processInline(text, opts);
    return `<h${level} style="color:#e0e0e0;margin:${level <= 2 ? '20px 0 12px' : '14px 0 8px'};font-weight:${level <= 2 ? 700 : 600};line-height:1.3;border-bottom:${level <= 2 ? '1px solid rgba(74,144,217,0.15)' : 'none'};padding-bottom:${level <= 2 ? '6px' : '0'}">${post}</h${level}>`;
  });

  processed = processed.replace(HR_RE, '<hr style="border:none;border-top:1px solid rgba(74,144,217,0.2);margin:20px 0" />');

  let inList = false;
  const lines = processed.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const listMatch = line.match(/^[-*]\s+(.*)$/);
    const olistMatch = line.match(/^\d+\.\s+(.*)$/);
    const quoteMatch = line.match(/^&gt;\s?(.*)$/);
    if (listMatch) {
      if (!inList) { out.push('<ul style="padding-left:22px;margin:8px 0;line-height:1.8">'); inList = true; }
      out.push(`<li style="margin:4px 0">${processInline(listMatch[1], opts)}</li>`);
      continue;
    }
    if (olistMatch) {
      if (!inList) { out.push('<ol style="padding-left:22px;margin:8px 0;line-height:1.8">'); inList = true; }
      out.push(`<li style="margin:4px 0">${processInline(olistMatch[1], opts)}</li>`);
      continue;
    }
    if (inList) { out.push('</ul></ol>'); inList = false; }
    if (quoteMatch) {
      out.push(`<blockquote style="border-left:3px solid #4a90d9;padding:8px 14px;margin:12px 0;background:rgba(74,144,217,0.06);border-radius:0 4px 4px 0;color:#a8b5d1;font-style:italic">${processInline(quoteMatch[1], opts)}</blockquote>`);
      continue;
    }
    if (line.startsWith('__CODEBLOCK')) continue;
    if (line.trim() === '') {
      out.push('');
      continue;
    }
    out.push(`<p style="margin:10px 0;line-height:1.8;color:#d0d5e0">${processInline(line, opts)}</p>`);
  }
  if (inList) out.push('</ul></ol>');
  processed = out.join('\n');

  processed = processed.replace(/__CODEBLOCK(\d+)__/g, (_m, idx) => {
    const inner = codeBlocks[Number(idx)] || '';
    const newlineIdx = inner.indexOf('\n');
    const first = newlineIdx >= 0 ? inner.slice(0, newlineIdx) : '';
    const rest = newlineIdx >= 0 ? inner.slice(newlineIdx + 1) : '';
    const lang = first.trim().toLowerCase();
    const code = rest || inner;
    const highlighted = highlightCode(code, lang);
    const langLabel = lang ? `<div style="font-size:11px;color:#4a90d9;margin-bottom:6px;opacity:0.7">${escapeHtml(lang)}</div>` : '';
    return `<pre style="background:#0d1b2a;border:1px solid rgba(74,144,217,0.15);border-radius:6px;padding:14px 16px;margin:14px 0;overflow-x:auto;font-size:13px;line-height:1.6">${langLabel}<code>${highlighted}</code></pre>`;
  });

  for (const { token, html } of linkTokens) {
    processed = processed.split(escapeHtml(token)).join(html);
  }
  for (const { token, html } of tagTokens) {
    processed = processed.split(escapeHtml(token)).join(html);
  }

  return processed;
}

function processInline(text: string, opts: RenderOptions): string {
  let s = text;
  s = s.replace(INLINE_CODE_RE, '<code style="background:rgba(74,144,217,0.12);color:#82aaff;padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>');
  s = s.replace(BOLD_RE, '<strong style="color:#fff;font-weight:600">$1</strong>');
  s = s.replace(ITALIC_RE, '<em style="color:#c5d0e6">$1</em>');
  return s;
}

export function attachPreviewInteractions(
  container: HTMLElement,
  opts: { onLinkClick?: (title: string) => void; onTagClick?: (tag: string) => void },
) {
  container.querySelectorAll('a.dg-link').forEach((a) => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const t = a.getAttribute('data-title');
      if (t && opts.onLinkClick) opts.onLinkClick(t);
    });
  });
  container.querySelectorAll('span.dg-tag').forEach((s) => {
    s.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const t = s.getAttribute('data-tag');
      if (t && opts.onTagClick) opts.onTagClick(t);
    });
  });
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}
