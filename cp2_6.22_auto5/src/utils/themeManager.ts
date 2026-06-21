import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { ThemeName } from '../types';

export function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute('data-theme', theme);
}

const monokaiColors = {
  foreground: '#f8f8f2',
  comment: '#75715e',
  string: '#e6db74',
  keyword: '#f92672',
  number: '#ae81ff',
  type: '#66d9ef',
  func: '#a6e22e',
  variable: '#f8f8f2',
  operator: '#f92672',
  property: '#a6e22e',
  tagName: '#f92672',
  attributeName: '#a6e22e',
  punctuation: '#f8f8f2',
  meta: '#f92672',
};

const monokaiTheme = EditorView.theme({
  '&': { backgroundColor: 'var(--editor-bg)', color: monokaiColors.foreground },
  '.cm-content': { caretColor: 'var(--editor-cursor)', fontFamily: "'JetBrains Mono', monospace" },
  '.cm-cursor': { borderLeftColor: 'var(--editor-cursor)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--editor-selection) !important',
  },
  '.cm-gutters': { backgroundColor: 'var(--editor-gutter-bg)', color: 'var(--editor-gutter-text)', borderRight: '1px solid var(--border)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--editor-active-line)' },
  '.cm-activeLine': { backgroundColor: 'var(--editor-active-line)' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(121, 192, 255, 0.3)', outline: '1px solid var(--accent)' },
}, { dark: true });

function makeMonokaiHighlight() {
  const rules: Array<{ tag: any; color?: string; fontStyle?: string; fontWeight?: string; textDecoration?: string }> = [
    { tag: t.comment, color: monokaiColors.comment, fontStyle: 'italic' },
    { tag: t.string, color: monokaiColors.string },
    { tag: t.number, color: monokaiColors.number },
    { tag: t.bool, color: monokaiColors.number },
    { tag: t.null, color: monokaiColors.number },
    { tag: t.keyword, color: monokaiColors.keyword },
    { tag: t.operator, color: monokaiColors.operator },
    { tag: t.typeName, color: monokaiColors.type },
    { tag: t.className, color: monokaiColors.type },
    { tag: t.labelName, color: monokaiColors.type },
    { tag: t.variableName, color: monokaiColors.func },
    { tag: t.propertyName, color: monokaiColors.property },
    { tag: t.tagName, color: monokaiColors.tagName },
    { tag: t.attributeName, color: monokaiColors.attributeName },
    { tag: t.punctuation, color: monokaiColors.punctuation },
    { tag: t.bracket, color: monokaiColors.punctuation },
    { tag: t.meta, color: monokaiColors.meta },
    { tag: t.heading, color: monokaiColors.keyword, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.link, color: monokaiColors.type, textDecoration: 'underline' },
    { tag: t.url, color: monokaiColors.type },
    { tag: t.inserted, color: '#a6e22e' },
    { tag: t.deleted, color: '#f92672' },
    { tag: t.changed, color: '#e6db74' },
  ].filter(r => r.tag != null);
  return HighlightStyle.define(rules as any);
}

const draculaColors = {
  foreground: '#f8f8f2',
  comment: '#6272a4',
  string: '#f1fa8c',
  keyword: '#ff79c6',
  number: '#bd93f9',
  type: '#8be9fd',
  func: '#50fa7b',
  variable: '#f8f8f2',
  operator: '#ff79c6',
  property: '#50fa7b',
  tagName: '#ff79c6',
  attributeName: '#50fa7b',
  punctuation: '#f8f8f2',
  meta: '#ff79c6',
};

const draculaTheme = EditorView.theme({
  '&': { backgroundColor: 'var(--editor-bg)', color: draculaColors.foreground },
  '.cm-content': { caretColor: 'var(--editor-cursor)', fontFamily: "'JetBrains Mono', monospace" },
  '.cm-cursor': { borderLeftColor: 'var(--editor-cursor)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--editor-selection) !important',
  },
  '.cm-gutters': { backgroundColor: 'var(--editor-gutter-bg)', color: 'var(--editor-gutter-text)', borderRight: '1px solid var(--border)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--editor-active-line)' },
  '.cm-activeLine': { backgroundColor: 'var(--editor-active-line)' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(139, 233, 253, 0.3)', outline: '1px solid var(--accent)' },
}, { dark: true });

function makeDraculaHighlight() {
  const rules: Array<{ tag: any; color?: string; fontStyle?: string; fontWeight?: string; textDecoration?: string }> = [
    { tag: t.comment, color: draculaColors.comment, fontStyle: 'italic' },
    { tag: t.string, color: draculaColors.string },
    { tag: t.number, color: draculaColors.number },
    { tag: t.bool, color: draculaColors.number },
    { tag: t.null, color: draculaColors.number },
    { tag: t.keyword, color: draculaColors.keyword },
    { tag: t.operator, color: draculaColors.operator },
    { tag: t.typeName, color: draculaColors.type },
    { tag: t.className, color: draculaColors.type },
    { tag: t.labelName, color: draculaColors.type },
    { tag: t.variableName, color: draculaColors.func },
    { tag: t.propertyName, color: draculaColors.property },
    { tag: t.tagName, color: draculaColors.tagName },
    { tag: t.attributeName, color: draculaColors.attributeName },
    { tag: t.punctuation, color: draculaColors.punctuation },
    { tag: t.bracket, color: draculaColors.punctuation },
    { tag: t.meta, color: draculaColors.meta },
    { tag: t.heading, color: draculaColors.keyword, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.link, color: draculaColors.type, textDecoration: 'underline' },
    { tag: t.url, color: draculaColors.type },
    { tag: t.inserted, color: '#50fa7b' },
    { tag: t.deleted, color: '#ff5555' },
    { tag: t.changed, color: '#f1fa8c' },
  ].filter(r => r.tag != null);
  return HighlightStyle.define(rules as any);
}

const githubColors = {
  foreground: '#24292e',
  comment: '#6a737d',
  string: '#032f62',
  keyword: '#d73a49',
  number: '#005cc5',
  type: '#6f42c1',
  func: '#6f42c1',
  variable: '#e36209',
  operator: '#d73a49',
  property: '#005cc5',
  tagName: '#22863a',
  attributeName: '#6f42c1',
  punctuation: '#24292e',
  meta: '#d73a49',
};

const githubTheme = EditorView.theme({
  '&': { backgroundColor: 'var(--editor-bg)', color: githubColors.foreground },
  '.cm-content': { caretColor: 'var(--editor-cursor)', fontFamily: "'JetBrains Mono', monospace" },
  '.cm-cursor': { borderLeftColor: 'var(--editor-cursor)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--editor-selection) !important',
  },
  '.cm-gutters': { backgroundColor: 'var(--editor-gutter-bg)', color: 'var(--editor-gutter-text)', borderRight: '1px solid var(--border)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--editor-active-line)' },
  '.cm-activeLine': { backgroundColor: 'var(--editor-active-line)' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(3, 102, 214, 0.2)', outline: '1px solid var(--accent)' },
}, { dark: false });

function makeGithubHighlight() {
  const rules: Array<{ tag: any; color?: string; fontStyle?: string; fontWeight?: string; textDecoration?: string }> = [
    { tag: t.comment, color: githubColors.comment, fontStyle: 'italic' },
    { tag: t.string, color: githubColors.string },
    { tag: t.number, color: githubColors.number },
    { tag: t.bool, color: githubColors.keyword },
    { tag: t.null, color: githubColors.keyword },
    { tag: t.keyword, color: githubColors.keyword },
    { tag: t.operator, color: githubColors.operator },
    { tag: t.typeName, color: githubColors.type },
    { tag: t.className, color: githubColors.type },
    { tag: t.labelName, color: githubColors.type },
    { tag: t.variableName, color: githubColors.func },
    { tag: t.propertyName, color: githubColors.property },
    { tag: t.tagName, color: githubColors.tagName },
    { tag: t.attributeName, color: githubColors.attributeName },
    { tag: t.punctuation, color: githubColors.punctuation },
    { tag: t.bracket, color: githubColors.punctuation },
    { tag: t.meta, color: githubColors.meta },
    { tag: t.heading, color: githubColors.keyword, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.link, color: githubColors.string, textDecoration: 'underline' },
    { tag: t.url, color: githubColors.string },
    { tag: t.inserted, color: '#22863a' },
    { tag: t.deleted, color: '#b31d28' },
    { tag: t.changed, color: '#e36209' },
  ].filter(r => r.tag != null);
  return HighlightStyle.define(rules as any);
}

const monokaiHighlight = makeMonokaiHighlight();
const draculaHighlight = makeDraculaHighlight();
const githubHighlight = makeGithubHighlight();

export function getEditorThemeExtension(theme: ThemeName) {
  switch (theme) {
    case 'monokai':
      return [monokaiTheme, syntaxHighlighting(monokaiHighlight)];
    case 'dracula':
      return [draculaTheme, syntaxHighlighting(draculaHighlight)];
    case 'github':
      return [githubTheme, syntaxHighlighting(githubHighlight)];
  }
}
