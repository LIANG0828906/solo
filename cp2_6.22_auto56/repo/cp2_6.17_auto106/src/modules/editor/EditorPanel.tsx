import { useRef, useEffect } from 'react';
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, rectangularSelection, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, bracketMatching, HighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { tags } from '@lezer/highlight';
import type { Language, Theme } from '@/types';

interface EditorPanelProps {
  code: string;
  language: Language;
  theme: Theme;
  onCodeChange: (code: string) => void;
}

const darkThemeSpec = EditorView.theme({
  '&': {
    fontSize: '14px',
    fontFamily: 'Consolas, monospace',
    lineHeight: '1.6',
    backgroundColor: '#1E1E2E',
    color: '#E0E0F0',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#6C63FF',
    padding: '8px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#6C63FF',
    borderLeftWidth: '2px',
  },
  '.cm-gutters': {
    backgroundColor: '#1A1A2E',
    borderRight: '1px solid #2D2D4A',
    color: '#6A6A8E',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#2D2D4A',
    color: '#A0A0C0',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(108, 99, 255, 0.25)',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(108, 99, 255, 0.3)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(108, 99, 255, 0.3)',
    color: '#FFFFFF',
  },
});

const lightThemeSpec = EditorView.theme({
  '&': {
    fontSize: '14px',
    fontFamily: 'Consolas, monospace',
    lineHeight: '1.6',
    backgroundColor: '#FAFAFA',
    color: '#333333',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#6C63FF',
    padding: '8px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#6C63FF',
    borderLeftWidth: '2px',
  },
  '.cm-gutters': {
    backgroundColor: '#F0F0F5',
    borderRight: '1px solid #E0E0E0',
    color: '#999999',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#E8E8F0',
    color: '#555555',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(108, 99, 255, 0.28)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(108, 99, 255, 0.25)',
    color: '#000000',
  },
});

const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#FF79C6' },
  { tag: tags.operator, color: '#FF79C6' },
  { tag: tags.special(tags.string), color: '#FF79C6' },
  { tag: tags.comment, color: '#6272A4', fontStyle: 'italic' },
  { tag: tags.string, color: '#F1FA8C' },
  { tag: tags.number, color: '#BD93F9' },
  { tag: tags.bool, color: '#BD93F9' },
  { tag: tags.name, color: '#50FA7B' },
  { tag: tags.function(tags.variableName), color: '#50FA7B' },
  { tag: tags.variableName, color: '#8BE9FD' },
  { tag: tags.typeName, color: '#8BE9FD' },
  { tag: tags.className, color: '#8BE9FD' },
  { tag: tags.propertyName, color: '#FFB86C' },
  { tag: tags.attributeName, color: '#50FA7B' },
  { tag: tags.punctuation, color: '#F8F8F2' },
  { tag: tags.separator, color: '#F8F8F2' },
  { tag: tags.meta, color: '#F8F8F2' },
  { tag: tags.definition(tags.variableName), color: '#8BE9FD' },
  { tag: tags.definition(tags.propertyName), color: '#8BE9FD' },
  { tag: tags.definition(tags.function(tags.variableName)), color: '#50FA7B' },
  { tag: tags.self, color: '#FF79C6' },
  { tag: tags.constant(tags.variableName), color: '#BD93F9' },
  { tag: tags.bracket, color: '#F8F8F2' },
  { tag: tags.tagName, color: '#FF79C6' },
  { tag: tags.null, color: '#BD93F9' },
  { tag: tags.unit, color: '#BD93F9' },
  { tag: tags.modifier, color: '#FF79C6' },
  { tag: tags.namespace, color: '#8BE9FD' },
  { tag: tags.macroName, color: '#50FA7B' },
  { tag: tags.regexp, color: '#F1FA8C' },
]);

const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#D63384' },
  { tag: tags.operator, color: '#D63384' },
  { tag: tags.special(tags.string), color: '#D63384' },
  { tag: tags.comment, color: '#6C8A76', fontStyle: 'italic' },
  { tag: tags.string, color: '#B8860B' },
  { tag: tags.number, color: '#8A2BE2' },
  { tag: tags.bool, color: '#8A2BE2' },
  { tag: tags.name, color: '#228B22' },
  { tag: tags.function(tags.variableName), color: '#228B22' },
  { tag: tags.variableName, color: '#1E90FF' },
  { tag: tags.typeName, color: '#1E90FF' },
  { tag: tags.className, color: '#1E90FF' },
  { tag: tags.propertyName, color: '#D2691E' },
  { tag: tags.attributeName, color: '#228B22' },
  { tag: tags.punctuation, color: '#333333' },
  { tag: tags.separator, color: '#333333' },
  { tag: tags.meta, color: '#333333' },
  { tag: tags.definition(tags.variableName), color: '#1E90FF' },
  { tag: tags.definition(tags.propertyName), color: '#1E90FF' },
  { tag: tags.definition(tags.function(tags.variableName)), color: '#228B22' },
  { tag: tags.self, color: '#D63384' },
  { tag: tags.constant(tags.variableName), color: '#8A2BE2' },
  { tag: tags.bracket, color: '#333333' },
  { tag: tags.tagName, color: '#D63384' },
  { tag: tags.null, color: '#8A2BE2' },
  { tag: tags.unit, color: '#8A2BE2' },
  { tag: tags.modifier, color: '#D63384' },
  { tag: tags.namespace, color: '#1E90FF' },
  { tag: tags.macroName, color: '#228B22' },
  { tag: tags.regexp, color: '#B8860B' },
]);

export function EditorPanel({ code, language, theme, onCodeChange }: EditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const highlightCompartment = useRef(new Compartment());
  const onCodeChangeRef = useRef(onCodeChange);
  onCodeChangeRef.current = onCodeChange;

  const getThemeExtensions = (t: Theme) => [
    t === 'dark' ? darkThemeSpec : lightThemeSpec,
    syntaxHighlighting(t === 'dark' ? darkHighlightStyle : lightHighlightStyle, { fallback: true }),
  ];

  useEffect(() => {
    if (!editorRef.current) return;

    const initialTheme = getThemeExtensions(theme);

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        drawSelection(),
        rectangularSelection(),
        bracketMatching(),
        closeBrackets(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
        languageCompartment.current.of(
          language === 'javascript' ? javascript() : python()
        ),
        themeCompartment.current.of(initialTheme[0]),
        highlightCompartment.current.of(initialTheme[1]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onCodeChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: languageCompartment.current.reconfigure(
          language === 'javascript' ? javascript() : python()
        ),
      });
    }
  }, [language]);

  useEffect(() => {
    if (viewRef.current) {
      const ext = getThemeExtensions(theme);
      viewRef.current.dispatch({
        effects: [
          themeCompartment.current.reconfigure(ext[0]),
          highlightCompartment.current.reconfigure(ext[1]),
        ],
      });
    }
  }, [theme]);

  useEffect(() => {
    if (viewRef.current) {
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== code) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: code },
        });
      }
    }
  }, [code]);

  const isDark = theme === 'dark';

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: isDark ? '#1E1E2E' : '#FAFAFA',
        border: `1px solid ${isDark ? '#2D2D4A' : '#DDDDDD'}`,
        borderRadius: '8px',
        transition: 'all 0.3s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#6C63FF';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = isDark ? '#2D2D4A' : '#DDDDDD';
      }}
    >
      <div ref={editorRef} style={{ height: '100%' }} />
    </div>
  );
}
