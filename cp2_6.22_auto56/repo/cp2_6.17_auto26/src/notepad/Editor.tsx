import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor as TipTapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { useStore } from '@/store';
import { extractConcepts } from '@/knowledge/ConceptExtractor';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MessageSquare, History, Lightbulb } from 'lucide-react';
import type { User } from '@/types';

const CONCEPT_EXTRACT_DEBOUNCE = 3000;
const remoteCursorPluginKey = new PluginKey('remote-cursors');

function createCursorExtension(otherUsers: User[], editorRef: React.MutableRefObject<TipTapEditor | null>) {
  return Extension.create({
    name: 'remote-cursors',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: remoteCursorPluginKey,
          props: {
            decorations() {
              const editor = editorRef.current;
              if (!editor || !editor.state) return DecorationSet.empty;

              const decorations: Decoration[] = [];
              const { doc } = editor.state;

              otherUsers
                .filter((u) => u.cursorPosition !== null && u.cursorPosition !== undefined)
                .forEach((user) => {
                  const pos = Math.min(user.cursorPosition!, doc.content.size - 1);
                  if (pos < 0) return;

                  try {
                    const widget = document.createElement('span');
                    widget.className = 'remote-cursor-widget';
                    widget.style.cssText = `
                      position: relative;
                      display: inline-block;
                      width: 2px;
                      height: 1.4em;
                      background-color: ${user.color};
                      box-shadow: 0 0 8px ${user.color};
                      vertical-align: text-bottom;
                      margin: 0 -1px;
                      z-index: 100;
                      pointer-events: none;
                    `;

                    const label = document.createElement('span');
                    label.textContent = user.name;
                    label.style.cssText = `
                      position: absolute;
                      top: -18px;
                      left: 0;
                      background-color: ${user.color};
                      color: white;
                      font-size: 10px;
                      line-height: 1;
                      padding: 2px 6px;
                      border-radius: 4px;
                      white-space: nowrap;
                      transform: translateX(-50%);
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                      font-weight: 500;
                      pointer-events: none;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    `;
                    widget.appendChild(label);

                    decorations.push(
                      Decoration.widget(pos, widget, {
                        side: 1,
                        key: `cursor-${user.id}`,
                      })
                    );
                  } catch (e) {
                  }
                });

              try {
                return DecorationSet.create(doc, decorations);
              } catch (e) {
                return DecorationSet.empty;
              }
            },
          },
        }),
      ];
    },
  });
}

export function Editor() {
  const {
    note,
    setNoteContent,
    addAnnotation,
    setSelectedText,
    selectedText,
    highlightPosition,
    currentUser,
    otherUsers,
    setConceptsAndEdges,
    rightPanelMode,
    setRightPanelMode,
  } = useStore();

  const { sendMessage } = useWebSocket();
  const editorRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<number | null>(null);
  const tiptapEditorRef = useRef<TipTapEditor | null>(null);

  const CursorExtension = useMemo(() => {
    return createCursorExtension(otherUsers, tiptapEditorRef);
  }, [otherUsers]);

  const initialContent = useMemo(() => note.content, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CursorExtension,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();

      setNoteContent(text, html);

      sendMessage({
        type: 'edit',
        payload: { content: text, html },
        userId: currentUser.id,
      });

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = window.setTimeout(() => {
        const result = extractConcepts(text, note.id);
        setConceptsAndEdges(result.concepts, result.edges);
      }, CONCEPT_EXTRACT_DEBOUNCE);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection;

      sendMessage({
        type: 'cursor',
        payload: { position: from },
        userId: currentUser.id,
      });

      if (!empty && to - from > 0) {
        const text = editor.state.doc.textBetween(from, to);
        setSelectedText({ text, from, to });
      } else {
        setSelectedText(null);
      }
    },
    onBlur: ({ editor }) => {
      sendMessage({
        type: 'cursor',
        payload: { position: null },
        userId: currentUser.id,
      });
    },
    onFocus: ({ editor }) => {
      const { from } = editor.state.selection;
      sendMessage({
        type: 'cursor',
        payload: { position: from },
        userId: currentUser.id,
      });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] p-6',
      },
    },
  });

  useEffect(() => {
    tiptapEditorRef.current = editor;
    return () => {
      tiptapEditorRef.current = null;
    };
  }, [editor]);

  useEffect(() => {
    if (editor) {
      editor.view.dispatch(editor.state.tr);
    }
  }, [otherUsers, editor]);

  useEffect(() => {
    if (editor && !editor.isFocused) {
      const currentContent = editor.getText();
      if (note.content !== currentContent && note.content) {
        const { from } = editor.state.selection;
        editor.commands.setContent(note.content, false);
        try {
          editor.commands.setTextSelection(Math.min(from, note.content.length));
        } catch (e) {
        }
      }
    }
  }, [note.content, editor]);

  useEffect(() => {
    if (highlightPosition !== null && editor) {
      try {
        editor.commands.focus();
        editor.commands.setTextSelection(highlightPosition);

        const resolved = editor.state.doc.resolve(highlightPosition);
        const paraStart = resolved.start(resolved.depth);
        const paraEnd = resolved.end(resolved.depth);

        const domStart = editor.view.domAtPos(paraStart);
        const domEnd = editor.view.domAtPos(paraEnd);

        let targetElement: HTMLElement | null = null;

        if (domStart?.node) {
          let el: HTMLElement | null = domStart.node.nodeType === 1
            ? (domStart.node as HTMLElement)
            : (domStart.node.parentElement as HTMLElement);

          while (el && !el.matches('p, h1, h2, h3, li')) {
            el = el.parentElement;
          }
          targetElement = el;
        }

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

          targetElement.classList.add('highlight-paragraph');
          setTimeout(() => {
            if (targetElement) {
              targetElement.classList.remove('highlight-paragraph');
            }
          }, 500);
        }
      } catch (e) {
        console.error('Highlight error:', e);
      }
    }
  }, [highlightPosition, editor]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (note.content.trim()) {
        const result = extractConcepts(note.content, note.id);
        setConceptsAndEdges(result.concepts, result.edges);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleAddAnnotation = useCallback(() => {
    if (!selectedText) return;

    addAnnotation({
      noteId: note.id,
      text: '',
      selectedText: selectedText.text,
      from: selectedText.from,
      to: selectedText.to,
      author: currentUser.name,
      authorColor: currentUser.color,
    });

    setSelectedText(null);
    setRightPanelMode('annotations');
  }, [selectedText, note.id, currentUser, addAnnotation, setSelectedText, setRightPanelMode]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#16213E] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#0F3460] bg-[#0F3460]/50">
        <div className="flex items-center gap-2">
          <span className="text-[#E0E0E0] font-medium">协作笔记编辑器</span>
          <div className="flex items-center gap-1 ml-4">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentUser.color }}
            />
            <span className="text-xs text-[#E0E0E0]/70">
              {currentUser.name}
            </span>
          </div>
          {otherUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: user.color }}
              />
              <span className="text-xs text-[#E0E0E0]/70">{user.name}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddAnnotation}
            disabled={!selectedText}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
              selectedText
                ? 'bg-[#E94560] text-white hover:bg-[#E94560]/80 hover:scale-105'
                : 'bg-[#16213E] text-[#E0E0E0]/50 cursor-not-allowed'
            }`}
          >
            <MessageSquare size={14} />
            添加批注
          </button>

          <div className="flex bg-[#16213E] rounded-lg p-0.5">
            <button
              onClick={() => setRightPanelMode('annotations')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                rightPanelMode === 'annotations'
                  ? 'bg-[#0F3460] text-white'
                  : 'text-[#E0E0E0]/70 hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              批注
            </button>
            <button
              onClick={() => setRightPanelMode('knowledge')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                rightPanelMode === 'knowledge'
                  ? 'bg-[#0F3460] text-white'
                  : 'text-[#E0E0E0]/70 hover:text-white'
              }`}
            >
              <Lightbulb size={14} />
              图谱
            </button>
            <button
              onClick={() => setRightPanelMode('history')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                rightPanelMode === 'history'
                  ? 'bg-[#0F3460] text-white'
                  : 'text-[#E0E0E0]/70 hover:text-white'
              }`}
            >
              <History size={14} />
              历史
            </button>
          </div>
        </div>
      </div>

      <div
        ref={editorRef}
        className="flex-1 overflow-auto relative editor-container"
        style={{
          fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
          lineHeight: '1.6',
        }}
      >
        <EditorContent
          editor={editor}
          className="h-full"
        />
      </div>

      <style>{`
        .ProseMirror p {
          margin-bottom: 12px;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          margin-top: 24px;
          margin-bottom: 16px;
          color: #E0E0E0;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: '开始输入笔记内容...';
          float: left;
          color: rgba(224, 224, 224, 0.3);
          pointer-events: none;
          height: 0;
        }
        .highlight-paragraph {
          background-color: #F1C40F !important;
          color: #1A1A2E !important;
          transition: background-color 0.25s ease-in-out, color 0.25s ease-in-out;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
        }
        ::selection {
          background-color: rgba(233, 69, 96, 0.3);
        }
        .ProseMirror {
          position: relative;
        }
        .editor-container {
          position: relative;
        }
      `}</style>
    </div>
  );
}
