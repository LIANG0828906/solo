import React, { useRef, useEffect, useState, useCallback } from 'react';
import { NoteData, Theme, NoteImage } from '../types';
import { noteStore } from '../core/NoteStore';
import { Bold, Italic, Underline, List, Image, Trash2 } from 'lucide-react';

interface NoteEditorProps {
  nodeId: string | null;
  nodeTitle: string;
  theme: Theme;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ nodeId, nodeTitle, theme }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<NoteData | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [displayKey, setDisplayKey] = useState(0);

  useEffect(() => {
    if (!nodeId) {
      setNote(null);
      return;
    }

    setIsFading(true);
    const timer = setTimeout(() => {
      const noteData = noteStore.getNote(nodeId);
      setNote(noteData || null);
      setDisplayKey((prev) => prev + 1);
      setIsFading(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [nodeId]);

  useEffect(() => {
    if (!nodeId) return;

    const handleNoteUpdated = (updatedNote: NoteData) => {
      if (updatedNote.nodeId === nodeId) {
        setNote({ ...updatedNote });
      }
    };

    noteStore.eventBus.on('note:updated', handleNoteUpdated);

    return () => {
      noteStore.eventBus.off('note:updated', handleNoteUpdated);
    };
  }, [nodeId]);

  useEffect(() => {
    if (editorRef.current && note && !isFading) {
      if (editorRef.current.innerHTML !== note.content) {
        editorRef.current.innerHTML = note.content;
      }
    }
  }, [note, isFading, displayKey]);

  const handleContentChange = useCallback(() => {
    if (!nodeId || !editorRef.current) return;
    const content = editorRef.current.innerHTML;
    noteStore.updateContent(nodeId, content);
  }, [nodeId]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentChange();
    editorRef.current?.focus();
  }, [handleContentChange]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!nodeId) return;
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const dataUrl = await noteStore.compressImage(file);

        const img = document.createElement('img');
        img.onload = () => {
          noteStore.addImage(nodeId, dataUrl, img.width, img.height);
          const imgHtml = `<img src="${dataUrl}" style="max-width: 100%; height: auto; margin: 8px 0; border-radius: 4px;" />`;
          document.execCommand('insertHTML', false, imgHtml);
          handleContentChange();
        };
        img.src = dataUrl;
      } catch (error) {
        console.error('Failed to upload image:', error);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [nodeId, handleContentChange]
  );

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = useCallback(
    (imageId: string) => {
      if (!nodeId) return;
      noteStore.removeImage(nodeId, imageId);
    },
    [nodeId]
  );

  if (!nodeId) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.panelBg,
          color: theme.panelText,
          transition: 'background-color 0.6s ease, color 0.6s ease',
          borderLeft: `1px solid ${theme.nodeStroke}`,
        }}
      >
        <p style={{ opacity: 0.5, fontSize: '14px' }}>请选择一个节点查看笔记</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.panelBg,
        color: theme.panelText,
        transition: 'background-color 0.6s ease, color 0.6s ease',
        borderLeft: `1px solid ${theme.nodeStroke}`,
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.nodeStroke}`,
          transition: 'border-color 0.6s ease',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            opacity: isFading ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        >
          {nodeTitle || '笔记'}
        </h3>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 12px',
          borderBottom: `1px solid ${theme.nodeStroke}`,
          transition: 'border-color 0.6s ease',
        }}
      >
        <ToolbarButton onClick={() => execCommand('bold')} theme={theme} title="加粗">
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('italic')} theme={theme} title="斜体">
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('underline')} theme={theme} title="下划线">
          <Underline size={16} />
        </ToolbarButton>
        <div
          style={{
            width: '1px',
            background: theme.nodeStroke,
            margin: '4px 8px',
            transition: 'background-color 0.6s ease',
          }}
        />
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} theme={theme} title="列表">
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={handleImageButtonClick} theme={theme} title="插入图片">
          <Image size={16} />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          opacity: isFading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          suppressContentEditableWarning
          style={{
            minHeight: '200px',
            outline: 'none',
            fontSize: '14px',
            lineHeight: 1.6,
            color: theme.panelText,
            transition: 'color 0.6s ease',
          }}
          data-placeholder="开始输入笔记内容..."
        />
      </div>

      {note && note.images.length > 0 && (
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${theme.nodeStroke}`,
            transition: 'border-color 0.6s ease',
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.6 }}>
            图片附件 ({note.images.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {note.images.map((img: NoteImage) => (
              <div
                key={img.id}
                style={{
                  position: 'relative',
                  width: '60px',
                  height: '60px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={img.dataUrl}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <button
                  onClick={() => removeImage(img.id)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${theme.panelText}40;
          pointer-events: none;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 8px 0;
        }
        [contenteditable] ul {
          margin: 8px 0;
          padding-left: 24px;
        }
        [contenteditable] li {
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
};

interface ToolbarButtonProps {
  onClick: () => void;
  theme: Theme;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, theme, title, children }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        background: isHovered ? `${theme.lineColor}20` : 'transparent',
        color: theme.panelText,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease, color 0.6s ease',
      }}
    >
      {children}
    </button>
  );
};
