import { useState, useEffect, useRef } from "react";

interface NoteDrawerProps {
  open: boolean;
  paragraphText: string;
  existingNote: string;
  onSave: (note: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const MAX_NOTE_LENGTH = 500;

export default function NoteDrawer({
  open,
  paragraphText,
  existingNote,
  onSave,
  onDelete,
  onClose,
}: NoteDrawerProps) {
  const [noteText, setNoteText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setNoteText(existingNote);
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 320);
    }
  }, [open, existingNote]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleSave = () => {
    onSave(noteText);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <>
      <div
        className={`note-drawer-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`note-drawer ${open ? "open" : ""}`}>
        <div className="drawer-header">
          <h3 className="drawer-title">
            {existingNote ? "编辑笔记" : "添加笔记"}
          </h3>
          <button
            className="drawer-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="drawer-body">
          <div>
            <div className="note-label">选中段落</div>
            <div className="paragraph-preview">{paragraphText}</div>
          </div>

          <div>
            <div className="note-label">
              <span>我的笔记</span>
              <span className="char-count">
                {noteText.length} / {MAX_NOTE_LENGTH}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              className="note-textarea"
              value={noteText}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= MAX_NOTE_LENGTH) {
                  setNoteText(value);
                }
              }}
              placeholder="在此输入您的阅读感悟、想法或批注…（双击段落可打开笔记）"
              maxLength={MAX_NOTE_LENGTH}
            />
          </div>
        </div>

        <div className="drawer-footer">
          {onDelete && (
            <button className="drawer-btn danger" onClick={handleDelete}>
              删除
            </button>
          )}
          <button className="drawer-btn secondary" onClick={onClose}>
            取消
          </button>
          <button className="drawer-btn primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </>
  );
}
