import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { EditorState, StateEffect, type Range } from '@codemirror/state';
import { EditorView, keymap, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { yCollab } from 'y-codemirror.next';
import type { Awareness } from 'y-protocols/awareness';
import { useTheme } from '@/hooks/useTheme';
import { useYjsStore } from '@/hooks/useYjsStore';
import type { IComment } from '@/shared/types';

interface EditorProps {
  doc: Y.Doc;
  awareness?: Awareness | null;
  onSave?: () => void;
}

const tokyoNightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#1a1b26',
      color: '#a9b1d6',
    },
    '.cm-content': {
      caretColor: '#7aa2f7',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#7aa2f7',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: '#33467c',
    },
    '.cm-panels': {
      backgroundColor: '#24283b',
      color: '#a9b1d6',
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: '2px solid #3b4261',
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: '2px solid #3b4261',
    },
    '.cm-searchMatch': {
      backgroundColor: '#3d59a1',
      outline: '1px solid #7aa2f7',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#7aa2f7',
      color: '#1a1b26',
    },
    '.cm-activeLine': {
      backgroundColor: '#1e2030',
    },
    '.cm-selectionMatch': {
      backgroundColor: '#2a2f4a',
    },
    '.cm-matchingBracket, .cm-nonmatchingBracket': {
      backgroundColor: '#3b4261',
      outline: '1px solid #565f89',
    },
    '.cm-gutters': {
      backgroundColor: '#1a1b26',
      color: '#565f89',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#1e2030',
      color: '#a9b1d6',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#565f89',
    },
    '.cm-tooltip': {
      border: '1px solid #3b4261',
      backgroundColor: '#24283b',
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: '#3b4261',
      borderBottomColor: '#3b4261',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#33467c',
        color: '#a9b1d6',
      },
    },
  },
  { dark: true }
);

const tokyoDayTheme = EditorView.theme({
  '&': {
    backgroundColor: '#f5f5f0',
    color: '#343b44',
  },
  '.cm-content': {
    caretColor: '#2e7de9',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#2e7de9',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#b7cff7',
  },
  '.cm-panels': {
    backgroundColor: '#ffffff',
    color: '#343b44',
  },
  '.cm-panels.cm-panels-top': {
    borderBottom: '2px solid #d5d5d0',
  },
  '.cm-panels.cm-panels-bottom': {
    borderTop: '2px solid #d5d5d0',
  },
  '.cm-searchMatch': {
    backgroundColor: '#b7cff7',
    outline: '1px solid #2e7de9',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#2e7de9',
    color: '#ffffff',
  },
  '.cm-activeLine': {
    backgroundColor: '#e9e9e4',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#c6c0a6',
  },
  '.cm-matchingBracket, .cm-nonmatchingBracket': {
    backgroundColor: '#b5b5ac',
    outline: '1px solid #8b919a',
  },
  '.cm-gutters': {
    backgroundColor: '#f5f5f0',
    color: '#8b919a',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e9e9e4',
    color: '#343b44',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#8b919a',
  },
  '.cm-tooltip': {
    border: '1px solid #d5d5d0',
    backgroundColor: '#ffffff',
  },
  '.cm-tooltip .cm-tooltip-arrow:before': {
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  '.cm-tooltip .cm-tooltip-arrow:after': {
    borderTopColor: '#d5d5d0',
    borderBottomColor: '#d5d5d0',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#b7cff7',
      color: '#343b44',
    },
  },
});

const commentHighlightTheme = EditorView.baseTheme({
  '.comment-highlight': {
    backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
    borderBottom: '2px solid var(--accent)',
    transition: 'background-color 300ms ease',
  },
});

function commentHighlighter(comments: IComment[]) {
  return EditorView.decorations.of((view) => {
    const decorations: Range<Decoration>[] = [];
    comments.forEach((comment) => {
      if (comment.resolved) return;
      const { from, to } = comment;
      if (from < 0 || to > view.state.doc.length || from >= to) return;
      decorations.push(
        Decoration.mark({
          class: 'comment-highlight',
          attributes: { 'data-comment-id': comment.id },
        }).range(from, to)
      );
    });
    return Decoration.set(decorations.sort((a, b) => a.from - b.from));
  });
}

function buildEditorExtensions(
  ydoc: Y.Doc,
  awareness: Awareness | undefined | null,
  isDark: boolean,
  comments: IComment[]
) {
  const ytext = ydoc.getText('content');
  const extensions = [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ spellcheck: 'true' }),
    keymap.of([
      {
        key: 'Mod-s',
        preventDefault: true,
        run: () => {
          window.dispatchEvent(new CustomEvent('editor-save'));
          return true;
        },
      },
    ]),
    commentHighlighter(comments),
    commentHighlightTheme,
  ];

  if (awareness) {
    extensions.push(yCollab(ytext, awareness));
  }

  if (isDark) {
    extensions.push(tokyoNightTheme);
  } else {
    extensions.push(tokyoDayTheme);
  }

  return extensions;
}

export default function Editor({ doc, awareness, onSave }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { isDark } = useTheme();
  const { comments, setSelectedTextRange } = useYjsStore();

  useEffect(() => {
    if (!containerRef.current || !doc) return;

    const state = EditorState.create({
      doc: doc.getText('content').toString(),
      extensions: buildEditorExtensions(doc, awareness, isDark, comments),
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    const updateListener = ViewPlugin.fromClass(
      class {
        update(update: ViewUpdate) {
          if (update.selectionSet && awareness) {
            const sel = update.state.selection.main;
            awareness.setLocalStateField('cursor', {
              position: sel.head,
              selectionFrom: sel.from,
              selectionTo: sel.to,
            });
            if (!sel.empty) {
              setSelectedTextRange({ from: sel.from, to: sel.to });
            }
          }
        }
      }
    );

    view.dispatch({
      effects: [
        StateEffect.appendConfig.of([updateListener]),
      ],
    });

    const handleSave = () => {
      onSave?.();
    };
    window.addEventListener('editor-save', handleSave);

    const handleScrollTo = (e: Event) => {
      const customEvent = e as CustomEvent<{ pos: number }>;
      const pos = customEvent.detail?.pos;
      if (pos === undefined || pos < 0) return;
      const line = view.state.doc.lineAt(Math.min(pos, view.state.doc.length));
      view.dispatch({
        effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
      });
    };
    window.addEventListener('editor-scroll-to', handleScrollTo);

    const handleHighlightRange = (e: Event) => {
      const customEvent = e as CustomEvent<{ from: number; to: number }>;
      const { from, to } = customEvent.detail;
      if (from === undefined || to === undefined) return;
      view.dispatch({
        selection: { anchor: from, head: to },
        effects: [
          EditorView.scrollIntoView(from, { y: 'center' }),
        ],
      });
      view.focus();
    };
    window.addEventListener('editor-highlight-range', handleHighlightRange);

    return () => {
      window.removeEventListener('editor-save', handleSave);
      window.removeEventListener('editor-scroll-to', handleScrollTo);
      window.removeEventListener('editor-highlight-range', handleHighlightRange);
      view.destroy();
      viewRef.current = null;
    };
  }, [doc, awareness]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !doc) return;

    view.dispatch({
      effects: [
        StateEffect.reconfigure.of(buildEditorExtensions(doc, awareness, isDark, comments)),
      ],
    });
  }, [isDark, comments, doc, awareness]);

  return (
    <div className="w-11/12 max-w-full mx-auto h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 w-full h-full overflow-hidden rounded-lg border border-border-light dark:border-border-dark shadow-lg"
      />
    </div>
  );
}
