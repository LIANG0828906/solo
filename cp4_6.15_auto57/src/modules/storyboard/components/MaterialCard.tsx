import { useState, useCallback } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { ZoomIn, Trash2, MessageSquare, X, Check } from 'lucide-react';
import type { Material } from '@/utils/helpers';

interface MaterialCardProps {
  material: Material;
  index: number;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  readOnly?: boolean;
}

export default function MaterialCard({ material, index, onDelete, onUpdateNote, readOnly }: MaterialCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState(material.note);
  const [showZoom, setShowZoom] = useState(false);

  const handleImageLoad = useCallback(() => setLoaded(true), []);

  const handleSaveNote = () => {
    onUpdateNote(material.id, noteText);
    setShowNoteModal(false);
  };

  return (
    <>
      <Draggable draggableId={material.id} index={index} isDragDisabled={readOnly}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`group relative rounded-xl overflow-hidden bg-[#1a1a2e] shadow-lg transition-all duration-300 ${
              snapshot.isDragging ? 'scale-105 rotate-1 shadow-2xl shadow-purple-500/30' : 'hover:-translate-y-1 hover:shadow-xl'
            }`}
          >
            {!loaded && (
              <div className="aspect-[4/3] w-full animate-pulse bg-gradient-to-br from-[#2a2a4a] to-[#1a1a2e] rounded-t-xl" />
            )}
            <img
              src={material.imageUrl}
              alt=""
              className={`w-full object-cover aspect-[4/3] transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
              onLoad={handleImageLoad}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" fill="%23333"><rect width="200" height="150"/><text x="50%" y="50%" fill="%23666" font-size="14" text-anchor="middle" dy=".3em">Image Error</text></svg>'
                );
                setLoaded(true);
              }}
            />
            {!readOnly && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setShowZoom(true)}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-all duration-200 backdrop-blur-sm"
                  title="放大查看"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={() => onDelete(material.id)}
                  className="p-2 rounded-full bg-white/20 hover:bg-red-500/80 text-white transition-all duration-200 backdrop-blur-sm"
                  title="删除"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => { setNoteText(material.note); setShowNoteModal(true); }}
                  className="p-2 rounded-full bg-white/20 hover:bg-purple-500/80 text-white transition-all duration-200 backdrop-blur-sm"
                  title="添加备注"
                >
                  <MessageSquare size={18} />
                </button>
              </div>
            )}
            {material.note && (
              <div className="px-3 py-2 bg-[#1a1a2e] border-t border-white/5">
                <p className="text-xs text-gray-400 line-clamp-2 font-light">{material.note}</p>
              </div>
            )}
          </div>
        )}
      </Draggable>

      {showZoom && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fadeIn"
          onClick={() => setShowZoom(false)}
        >
          <img
            src={material.imageUrl}
            alt=""
            className="max-w-full max-h-full rounded-xl shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowNoteModal(false)}>
          <div
            className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/10 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-lg" style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}>素材备注</h3>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="为这张素材添加备注..."
              className="w-full h-32 bg-[#0f0f1a] text-white rounded-lg p-3 text-sm resize-none border border-white/10 focus:border-purple-500/50 focus:outline-none transition-colors placeholder:text-gray-600"
              style={{ fontFamily: 'Noto Sans SC, sans-serif' }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 transition-all duration-200 text-sm flex items-center gap-1"
              >
                <Check size={16} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
