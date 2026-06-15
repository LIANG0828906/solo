import { useEffect, useRef, useCallback, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useDocStore } from './store/useDocStore';
import { useSocket } from './hooks/useSocket';
import { useDocStore as store } from './store/useDocStore';

const CURSOR_COLORS = [
  '#e74c3c', '#3498db', '#9b59b6', '#f39c12',
  '#1abc9c', '#e67e22', '#2ecc71', '#e91e63',
];

export default function Editor() {
  const quillRef = useRef<ReactQuill | null>(null);
  const isLocalChange = useRef(false);
  const [content, setContent] = useState<Record<string, unknown>>({ ops: [{ insert: '\n' }] });
  const [fadeKey, setFadeKey] = useState(0);

  const activeDocId = useDocStore((s) => s.activeDocId);
  const documents = useDocStore((s) => s.documents);
  const onlineUsers = useDocStore((s) => s.onlineUsers);
  const currentUser = useDocStore((s) => s.currentUser);
  const isFullscreen = useDocStore((s) => s.isFullscreen);
  const { getSocket } = useSocket();

  const activeDoc = documents.find((d) => d.id === activeDocId);

  useEffect(() => {
    if (activeDocId) {
      setFadeKey((k) => k + 1);
    }
  }, [activeDocId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleContent = (data: { docId: string; content: Record<string, unknown> }) => {
      if (data.docId === activeDocId) {
        isLocalChange.current = true;
        setContent(data.content);
        const quill = quillRef.current?.getEditor();
        if (quill) {
          quill.setContents(data.content as any);
        }
        isLocalChange.current = false;
      }
    };

    const handleDelta = (data: { docId: string; delta: Record<string, unknown>; userId: string }) => {
      if (data.docId === activeDocId && data.userId !== socket.id) {
        const quill = quillRef.current?.getEditor();
        if (quill) {
          isLocalChange.current = true;
          quill.updateContents(data.delta as any);
          isLocalChange.current = false;
        }
      }
    };

    socket.on('document-content', handleContent);
    socket.on('delta', handleDelta);

    return () => {
      socket.off('document-content', handleContent);
      socket.off('delta', handleDelta);
    };
  }, [activeDocId, getSocket]);

  const handleChange = useCallback(
    (_value: string, _delta: any, _source: any, editor: any) => {
      if (_source === 'user' && !isLocalChange.current) {
        const socket = getSocket();
        if (socket && activeDocId) {
          socket.emit('delta', { docId: activeDocId, delta: _delta });
          setContent(editor.getContents());
        }
      }
    },
    [activeDocId, getSocket]
  );

  const handleSelectionChange = useCallback(
    (range: any) => {
      const socket = getSocket();
      if (socket && activeDocId && range) {
        socket.emit('cursor', {
          docId: activeDocId,
          cursor: { index: range.index, length: range.length },
        });
      }
    },
    [activeDocId, getSocket]
  );

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'code-block'],
      ['clean'],
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'strike', 'blockquote',
    'list', 'link', 'code-block',
  ];

  if (!activeDocId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-navy-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-navy-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p className="text-navy-300 text-sm">选择或创建一个文档开始编辑</p>
        </div>
      </div>
    );
  }

  const remoteUsers = onlineUsers.filter(
    (u) => u.userId !== currentUser?.userId && u.cursor
  );

  return (
    <div className={`flex-1 flex flex-col bg-white relative ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      <div key={fadeKey} className="flex-1 flex flex-col" style={{ animation: 'fadeIn 0.3s ease' }}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content as any}
          onChange={handleChange as any}
          onChangeSelection={handleSelectionChange}
          modules={modules}
          formats={formats}
          className="flex-1 flex flex-col"
          placeholder="开始编写..."
        />
      </div>

      {/* Remote cursors overlay */}
      {remoteUsers.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {remoteUsers.map((user) => {
            const quill = quillRef.current?.getEditor();
            if (!quill || !user.cursor) return null;

            try {
              const startBounds = quill.getBounds(user.cursor.index);
              const endBounds = user.cursor.length > 0
                ? quill.getBounds(user.cursor.index + user.cursor.length)
                : null;

              return (
                <div key={user.userId}>
                  <div
                    className="remote-cursor"
                    style={{
                      left: `${startBounds.left}px`,
                      top: `${startBounds.top}px`,
                      height: `${startBounds.height}px`,
                      backgroundColor: user.color,
                    }}
                  >
                    <div
                      className="remote-cursor-label"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.nickname}
                    </div>
                  </div>
                  {endBounds && user.cursor.length > 0 && (
                    <div
                      className="remote-selection"
                      style={{
                        left: `${startBounds.left}px`,
                        top: `${startBounds.top}px`,
                        width: `${endBounds.right - startBounds.left}px`,
                        height: `${Math.max(startBounds.height, endBounds.height)}px`,
                        backgroundColor: user.color,
                      }}
                    />
                  )}
                </div>
              );
            } catch {
              return null;
            }
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
