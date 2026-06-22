import { useState, useCallback, useRef, useEffect } from 'react';
import RoomScene from '@/modules/room/RoomScene';
import GalleryPanel from '@/modules/gallery/GalleryPanel';
import ShareButton from '@/modules/share/ShareButton';
import { useAppStore, Frame, Note } from '@/store/appStore';
import { X, Trash2, StickyNote } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [modalFrame, setModalFrame] = useState<Frame | null>(null);
  const [modalClosing, setModalClosing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    frameId: string;
    x: number;
    y: number;
  } | null>(null);
  const [noteDialogFrame, setNoteDialogFrame] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const frames = useAppStore((s) => s.frames);
  const notes = useAppStore((s) => s.notes);
  const removeFrame = useAppStore((s) => s.removeFrame);
  const addNote = useAppStore((s) => s.addNote);

  const handleFrameClick = useCallback((frameId: string) => {
    const frame = frames.find((f) => f.id === frameId);
    if (frame) {
      setModalFrame(frame);
      setModalClosing(false);
    }
  }, [frames]);

  const closeModal = useCallback(() => {
    setModalClosing(true);
    setTimeout(() => {
      setModalFrame(null);
      setModalClosing(false);
    }, 320);
  }, []);

  const handleFrameContextMenu = useCallback((frameId: string, x: number, y: number) => {
    setContextMenu({ frameId, x, y });
  }, []);

  const handleDeleteFrame = useCallback(() => {
    if (contextMenu) {
      removeFrame(contextMenu.frameId);
      setContextMenu(null);
    }
  }, [contextMenu, removeFrame]);

  const handleAddNote = useCallback(() => {
    if (contextMenu) {
      setNoteDialogFrame(contextMenu.frameId);
      setNoteInput('');
      setContextMenu(null);
    }
  }, [contextMenu]);

  const handleSaveNote = useCallback(() => {
    if (noteDialogFrame && noteInput.trim()) {
      const note: Note = {
        id: uuidv4(),
        frameId: noteDialogFrame,
        content: noteInput.trim(),
        createdAt: new Date().toISOString(),
      };
      addNote(note);
    }
    setNoteDialogFrame(null);
    setNoteInput('');
  }, [noteDialogFrame, noteInput, addNote]);

  useEffect(() => {
    const onClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('mousedown', onClickOutside);
    }
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [contextMenu]);

  useEffect(() => {
    if (noteDialogFrame && noteInputRef.current) {
      setTimeout(() => noteInputRef.current?.focus(), 50);
    }
  }, [noteDialogFrame]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return iso;
    }
  };

  const frameNotes = modalFrame ? notes.filter((n) => n.frameId === modalFrame.id) : [];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8DFD6] flex">
      <GalleryPanel />

      <div className="flex-1 relative h-full">
        <RoomScene
          onFrameClick={handleFrameClick}
          onFrameContextMenu={handleFrameContextMenu}
        />
        <ShareButton />

        <div className="absolute top-4 right-28 md:right-28 z-20 flex items-center gap-2 text-xs text-[#5C524A] bg-[#F5F0EB]/85 backdrop-blur px-3 py-2 rounded-lg shadow-sm border border-[#D9D0C7]">
          <div className="flex items-center gap-1"><kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#D9D0C7]">W</kbd><kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#D9D0C7]">A</kbd><kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#D9D0C7]">S</kbd><kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#D9D0C7]">D</kbd></div>
          <span>移动</span>
          <span className="text-[#B8AFA6]">·</span>
          <div className="flex items-center gap-1"><kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#D9D0C7]">Shift</kbd></div>
          <span>加速</span>
          <span className="text-[#B8AFA6] hidden md:inline">·</span>
          <span className="hidden md:inline">左键拖拽视角/拖动画框</span>
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 min-w-[140px] bg-[#F5F0EB] border border-[#D9D0C7] rounded-xl shadow-xl overflow-hidden animate-[fadeIn_150ms_ease-out]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleAddNote}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#5C524A] hover:bg-[#E8DFD6] transition-colors duration-200"
          >
            <StickyNote className="w-4 h-4 text-[#C4A882]" />
            添加便签
          </button>
          <button
            onClick={handleDeleteFrame}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#B05050] hover:bg-[#F0DCD6] transition-colors duration-200 border-t border-[#D9D0C7]"
          >
            <Trash2 className="w-4 h-4" />
            删除画框
          </button>
        </div>
      )}

      {noteDialogFrame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={() => setNoteDialogFrame(null)} />
          <div className="relative w-[340px] max-w-[92vw] bg-[#FFF9C4] rounded-xl shadow-2xl p-5 border-2 border-[#E6D54A]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[#5C524A] flex items-center gap-1.5">
                <StickyNote className="w-4 h-4 text-[#C4A882]" />
                写一张便签
              </h3>
              <button
                onClick={() => setNoteDialogFrame(null)}
                className="text-[#8B7355] hover:text-[#5C524A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              ref={noteInputRef}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="记下灵感、注释、想法..."
              rows={4}
              className="w-full resize-none rounded-lg border border-[#E6D54A] bg-[#FFFEF2] p-3 text-[#333] placeholder:text-[#B8A890] focus:outline-none focus:ring-2 focus:ring-[#C4A882] focus:border-transparent text-base"
              style={{ fontFamily: '"Ma Shan Zheng", "Caveat", cursive' }}
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setNoteDialogFrame(null)}
                className="px-4 py-2 rounded-lg text-sm text-[#5C524A] hover:bg-[#F0E7D8] transition-colors duration-200"
              >
                取消
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteInput.trim()}
                className="px-4 py-2 rounded-lg text-sm text-white bg-[#C4A882] hover:bg-[#B09370] disabled:bg-[#D9D0C7] disabled:cursor-not-allowed transition-colors duration-200"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {modalFrame && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out ${
            modalClosing ? 'bg-black/0 backdrop-blur-0' : 'bg-black/40 backdrop-blur-md'
          }`}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ transitionTimingFunction: modalClosing ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            className={`relative w-[min(620px,92vw)] max-h-[88vh] overflow-auto bg-[#F5F0EB]/95 rounded-2xl shadow-2xl border border-[#D9D0C7] transition-all duration-[350ms] ${
              modalClosing ? 'scale-75 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
            }`}
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[#F5F0EB] text-[#5C524A] hover:bg-[#E8DFD6] shadow-md transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <div className="w-full rounded-xl overflow-hidden bg-white border border-[#D9D0C7] shadow-inner p-3 mb-5">
                <div className="w-full rounded-lg overflow-hidden bg-[#F0E7D8]">
                  <img
                    src={modalFrame.imageUrl}
                    alt={modalFrame.fileName}
                    className="w-full h-auto max-h-[55vh] object-contain"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm text-[#5C524A]">
                  <span className="text-[#A99F95] w-16 shrink-0">文件名</span>
                  <span className="font-medium truncate">{modalFrame.fileName}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-[#5C524A]">
                  <span className="text-[#A99F95] w-16 shrink-0">添加日期</span>
                  <span className="font-medium">{formatDate(modalFrame.addedAt)}</span>
                </p>
                {frameNotes.length > 0 && (
                  <div className="pt-3 mt-2 border-t border-[#D9D0C7]">
                    <p className="text-xs text-[#A99F95] mb-2">便签</p>
                    <div className="grid gap-2">
                      {frameNotes.map((n) => (
                        <div
                          key={n.id}
                          className="px-3 py-2 rounded-lg bg-[#FFF9C4] border border-[#E6D54A] text-[#333] text-sm"
                          style={{ fontFamily: '"Ma Shan Zheng", "Caveat", cursive' }}
                        >
                          {n.content}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
