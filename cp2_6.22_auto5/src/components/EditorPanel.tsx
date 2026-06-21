import { useRef, useEffect, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, rectangularSelection, crosshairCursor, highlightSpecialChars } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import { go } from '@codemirror/lang-go';
import { xml } from '@codemirror/lang-xml';
import { yaml } from '@codemirror/lang-yaml';
import { getEditorThemeExtension } from '../utils/themeManager';
import type { ThemeName } from '../types';

interface EditorPanelProps {
  content: string;
  language: string;
  theme: ThemeName;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

function getLanguageExtension(lang: string) {
  switch (lang) {
    case 'javascript': return javascript({ jsx: true });
    case 'typescript': return javascript({ jsx: true, typescript: true });
    case 'python': return python();
    case 'html': return html();
    case 'css': return css();
    case 'java': return java();
    case 'cpp': return cpp();
    case 'rust': return rust();
    case 'sql': return sql();
    case 'json': return json();
    case 'markdown': return markdown();
    case 'php': return php();
    case 'go': return go();
    case 'xml': return xml();
    case 'yaml': return yaml();
    default: return javascript();
  }
}

export default function EditorPanel({ content, language, theme, onChange, readOnly }: EditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const isInternalChange = useRef(false);

  onChangeRef.current = onChange;

  const lineCount = viewRef.current ? viewRef.current.state.doc.lines : 0;
  const charCount = viewRef.current ? viewRef.current.state.doc.length : 0;

  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        EditorView.allowMultipleSelections.of(true),
        indentWithTab(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        closeBrackets(),
        autocompletion(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...completionKeymap,
          ...lintKeymap,
        ]),
        langCompartment.current.of(getLanguageExtension(language)),
        themeCompartment.current.of(getEditorThemeExtension(theme)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChangeRef.current) {
            isInternalChange.current = true;
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!viewRef.current) return;
    const currentContent = viewRef.current.state.doc.toString();
    if (content !== currentContent && !isInternalChange.current) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      });
    }
    isInternalChange.current = false;
  }, [content]);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: langCompartment.current.reconfigure(getLanguageExtension(language)),
    });
  }, [language]);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: themeCompartment.current.reconfigure(getEditorThemeExtension(theme)),
    });
  }, [theme]);

  const currentLineCount = viewRef.current?.state.doc.lines ?? 0;
  const currentCharCount = viewRef.current?.state.doc.length ?? 0;
  const cursorPos = viewRef.current?.state.selection.main.head ?? 0;
  const cursorLine = viewRef.current ? 
    viewRef.current.state.doc.lineAt(cursorPos).number : 1;
  const cursorCol = viewRef.current ?
    cursorPos - viewRef.current.state.doc.lineAt(cursorPos).from + 1 : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="editor-container" ref={editorRef} />
      <div className="editor-statusbar">
        <div className="statusbar-left">
          <span className="status-item">行 {currentLineCount}</span>
          <span className="status-item">字符 {currentCharCount}</span>
        </div>
        <div className="statusbar-right">
          <span className="status-item">Ln {cursorLine}, Col {cursorCol}</span>
          <span className="status-item">{language.toUpperCase()}</span>
          <span className="status-item">UTF-8</span>
        </div>
      </div>
    </div>
  );
}
