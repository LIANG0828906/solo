import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useStore } from '@/store';
import { extractConcepts } from '@/knowledge/ConceptExtractor';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MessageSquare, History, Lightbulb } from 'lucide-react';

const CONCEPT_EXTRACT_DEBOUNCE = 3000;
const VERSION_SAVE_INTERVAL = 10 * 60 * 1000;
const IDLE_VERSION_SAVE = 5 * 60 * 1000;

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
    addVersion,
    rightPanelMode,
    setRightPanelMode,
  } = useStore();

  const { sendMessage } = useWebSocket();
  const editorRef = useRef<HTMLDivElement>(null);
  const lastInputTime = useRef(Date.now());
  const debounceTimer = useRef<number | null>(null);
  const versionTimer = useRef<number | null>(null);

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
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();

      setNoteContent(text, html);
      lastInputTime.current = Date.now();

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
      if (!empty && to - from > 0) {
        const text = editor.state.doc.textBetween(from, to);
        setSelectedText({ text, from, to });

        sendMessage({
          type: 'cursor',
          payload: { position: from },
          userId: currentUser.id,
        });
      } else {
        setSelectedText(null);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] p-6',
      },
    },
  });

  useEffect(() => {
    if (editor && !editor.isFocused) {
      const currentContent = editor.getText();
      if (note.content !== currentContent && note.content) {
        editor.commands.setContent(note.content);
      }
    }
  }, [note.content, editor]);

  useEffect(() => {
    if (highlightPosition !== null && editor) {
      editor.commands.focus();
      editor.commands.setTextSelection(highlightPosition);
      const node = editor.view.domAtPos(highlightPosition);
      if (node?.node?.parentElement) {
        const paragraph = node.node.parentElement.closest('p, h1, h2, h3');
        if (paragraph) {
          paragraph.classList.add('highlight-paragraph');
          setTimeout(() => {
            paragraph.classList.remove('highlight-paragraph');
          }, 500);
        }
      }
    }
  }, [highlightPosition, editor]);

  useEffect(() => {
    versionTimer.current = window.setInterval(() => {
      if (Date.now() - lastInputTime.current >= IDLE_VERSION_SAVE) {
        addVersion('自动保存 - 空闲时快照');
      }
    }, VERSION_SAVE_INTERVAL);

    return () => {
      if (versionTimer.current) {
        clearInterval(versionTimer.current);
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [addVersion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (note.content.trim()) {
        const result = extractConcepts(note.content, note.id);
        setConceptsAndEdges(result.concepts, result.edges);
      }
    }, 1000);

    return () => clearTimeout(timer);
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

  const renderRemoteCursors = useCallback(() => {
    return otherUsers
      .filter((u) => u.cursorPosition !== null)
      .map((user) => (
        <div
          key={user.id}
          className="remote-cursor"
          style={{
            position: 'absolute',
            left: '0',
            top: `${user.cursorPosition! * 0.8}px`,
            width: '2px',
            height: '20px',
            backgroundColor: user.color,
            boxShadow: `0 0 8px ${user.color}`,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '-20px',
              left: '0',
              backgroundColor: user.color,
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            {user.name}
          </span>
        </div>
      ));
  }, [otherUsers]);

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
        className="flex-1 overflow-auto relative"
        style={{
          fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
          lineHeight: '1.6',
        }}
      >
        {renderRemoteCursors()}
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
          content: attr(data-placeholder);
          float: left;
          color: rgba(224, 224, 224, 0.3);
          pointer-events: none;
          height: 0;
        }
        .highlight-paragraph {
          background-color: #F1C40F !important;
          color: #1A1A2E !important;
          transition: background-color 0.5s ease;
        }
        ::selection {
          background-color: rgba(233, 69, 96, 0.3);
        }
      `}</style>
    </div>
  );
}
