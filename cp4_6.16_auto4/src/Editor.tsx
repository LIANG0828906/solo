import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useDocStore } from './store/useDocStore';
import { useSocket } from './hooks/useSocket';

export interface EditorHandle {
  getContent: () => Record<string, unknown>;
  getTitle: () => string;
}

const Editor = forwardRef<EditorHandle>((_props, ref) => {
  const quillRef = useRef<ReactQuill | null>(null);
  const isLocalChange = useRef(false);
  const cursorLayerRef = useRef<HTMLDivElement | null>(null);
  const [fadeKey, setFadeKey] = useState(0);

  const activeDocId = useDocStore((s) => s.activeDocId);
  const documents = useDocStore((s) => s.documents);
  const onlineUsers = useDocStore((s) => s.onlineUsers);
  const currentUser = useDocStore((s) => s.currentUser);
  const isFullscreen = useDocStore((s) => s.isFullscreen);
  const { getSocket } = useSocket();

  const activeDoc = documents.find((d) => d.id === activeDocId);

  useImperativeHandle(ref, () => ({
    getContent: () => {
      const quill = quillRef.current?.getEditor();
      return quill ? quill.getContents() : { ops: [] };
    },
    getTitle: () => activeDoc?.title || 'untitled',
  }), [activeDoc]);

  useEffect(() => {
    if (activeDocId) {
      setFadeKey((k) => k + 1);
    }
  }, [activeDocId]);

  const renderCursors = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    const layer = cursorLayerRef.current;
    if (!quill || !layer) return;

    while (layer.firstChild) {
      layer.removeChild(layer.firstChild);
    }

    const remoteUsers = onlineUsers.filter(
      (u) => u.userId !== currentUser?.userId && u.cursor
    );

    remoteUsers.forEach((user) => {
      if (!user.cursor) return;
      try {
        const range = user.cursor;
        const startBounds = quill.getBounds(range.index);

        const cursor = document.createElement('div');
        cursor.style.cssText = `
          position: absolute;
          left: ${startBounds.left}px;
          top: ${startBounds.top}px;
          width: 2px;
          height: ${startBounds.height}px;
          background-color: ${user.color};
          pointer-events: none;
          z-index: 20;
          animation: cursorBlink 1.2s ease-in-out infinite;
        `;

        const label = document.createElement('div');
        label.textContent = user.nickname;
        label.style.cssText = `
          position: absolute;
          top: -18px;
          left: 1px;
          font-size: 10px;
          padding: 1px 5px;
          border-radius: 3px;
          color: white;
          white-space: nowrap;
          background-color: ${user.color};
          transform: translateX(-50%);
          line-height: 1.4;
        `;
        cursor.appendChild(label);
        layer.appendChild(cursor);

        if (range.length > 0) {
          const endBounds = quill.getBounds(range.index + range.length);
          const selection = document.createElement('div');
          selection.style.cssText = `
            position: absolute;
            left: ${startBounds.left}px;
            top: ${startBounds.top}px;
            width: ${endBounds.right - startBounds.left}px;
            height: ${Math.max(startBounds.height, endBounds.height)}px;
            background-color: ${user.color};
            opacity: 0.2;
            pointer-events: none;
            z-index: 15;
          `;
          layer.appendChild(selection);
        }
      } catch {
        // ignore
      }
    });
  }, [onlineUsers, currentUser]);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const container = quill.container as HTMLElement;
    if (!container) return;

    const layer = document.createElement('div');
    layer.className = 'remote-cursor-layer';
    layer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      overflow: hidden;
    `;
    container.appendChild(layer);
    cursorLayerRef.current = layer;

    const handleScroll = () => renderCursors();
    quill.on('selection-change', handleScroll);
    const editorRoot = quill.root;
    editorRoot.addEventListener('scroll', handleScroll);

    renderCursors();

    return () => {
      quill.off('selection-change', handleScroll);
      editorRoot.removeEventListener('scroll', handleScroll);
      if (layer.parentNode) {
        layer.parentNode.removeChild(layer);
      }
      cursorLayerRef.current = null;
    };
  }, [activeDocId, renderCursors]);

  useEffect(() => {
    renderCursors();
  }, [onlineUsers, renderCursors]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeDocId) return;

    const handleContent = (data: { docId: string; content: Record<string, unknown> }) => {
      if (data.docId !== activeDocId) return;
      const quill = quillRef.current?.getEditor();
      if (quill) {
        isLocalChange.current = true;
        quill.setContents(data.content as any, 'silent');
        isLocalChange.current = false;
        setTimeout(() => renderCursors(), 0);
      }
    };

    const handleDelta = (data: { docId: string; delta: Record<string, unknown>; userId: string }) => {
      if (data.docId !== activeDocId || data.userId === socket.id) return;
      const quill = quillRef.current?.getEditor();
      if (quill) {
        isLocalChange.current = true;
        quill.updateContents(data.delta as any, 'silent');
        isLocalChange.current = false;
        setTimeout(() => renderCursors(), 0);
      }
    };

    const handleCursor = (_data: { docId: string; cursor: { index: number; length: number }; userId: string }) => {
      setTimeout(() => renderCursors(), 0);
    };

    socket.on('document-content', handleContent);
    socket.on('delta', handleDelta);
    socket.on('cursor', handleCursor);

    return () => {
      socket.off('document-content', handleContent);
      socket.off('delta', handleDelta);
      socket.off('cursor', handleCursor);
    };
  }, [activeDocId, getSocket, renderCursors]);

  const handleChange = useCallback(
    (_delta: any, _source: any) => {
      if (_source === 'user' && !isLocalChange.current) {
        const socket = getSocket();
        if (socket && activeDocId) {
          socket.emit('delta', { docId: activeDocId, delta: _delta });
        }
        setTimeout(() => renderCursors(), 0);
      }
    },
    [activeDocId, getSocket, renderCursors]
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

  return (
    <div className={`flex-1 flex flex-col bg-white relative ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      <div key={fadeKey} className="flex-1 flex flex-col" style={{ animation: 'fadeIn 0.3s ease' }}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          onChange={handleChange as any}
          onChangeSelection={handleSelectionChange}
          modules={modules}
          formats={formats}
          className="flex-1 flex flex-col"
          placeholder="开始编写..."
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .ql-container.ql-snow {
          position: relative;
        }
      `}</style>
    </div>
  );
});

Editor.displayName = 'Editor';

export default Editor;
