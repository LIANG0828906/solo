import { useRef, useEffect } from 'react';
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, rectangularSelection, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import type { Language } from '@/types';

interface EditorPanelProps {
  code: string;
  language: Language;
  onCodeChange: (code: string) => void;
}

export function EditorPanel({ code, language, onCodeChange }: EditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());
  const onCodeChangeRef = useRef(onCodeChange);
  onCodeChangeRef.current = onCodeChange;

  useEffect(() => {
    if (!editorRef.current) return;

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
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
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
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onCodeChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.theme({
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
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== code) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: code },
        });
      }
    }
  }, [code]);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#1E1E2E',
        border: '1px solid #2D2D4A',
        borderRadius: '8px',
        transition: 'border-color 0.2s ease',
      }}
      onFocus={() => {
        const el = editorRef.current?.parentElement;
        if (el) el.style.borderColor = '#6C63FF';
      }}
      onBlur={() => {
        const el = editorRef.current?.parentElement;
        if (el) el.style.borderColor = '#2D2D4A';
      }}
    >
      <div ref={editorRef} style={{ height: '100%' }} />
    </div>
  );
}
