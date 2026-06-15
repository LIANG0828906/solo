import { useState, useCallback, memo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { ZoomIn, Trash2, MessageSquare, X, Check, GripVertical } from 'lucide-react';
import type { Material } from '@/utils/helpers';

interface MaterialCardProps {
  material: Material;
  index: number;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  readOnly?: boolean;
}

function MaterialCard({ material, index, onDelete, onUpdateNote, readOnly }: MaterialCardProps) {
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
            className={`group relative rounded-xl overflow-hidden bg-[#1a1a2e] shadow-md transition-all duration-300 ${
              snapshot.isDragging
                ? 'scale-[1.03] rotate-[1deg] shadow-2xl shadow-purple-500/30 ring-2 ring-purple-400/40'
                : 'hover:-translate-y-1 hover:shadow-xl'
            }`}
          >
            {!readOnly && (
              <div
                {...provided.dragHandleProps}
                className="absolute top-2 left-2 z-20 p-1.5 rounded-lg bg-black/40 text-white/70 hover:text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab active:cursor-grabbing"
                title="拖拽排序"
              >
                <GripVertical size={14} />
              </div>
            )}

            <div className="relative w-full overflow-hidden">
              {!loaded && (
                <div className="aspect-[4/3] w-full animate-pulse bg-gradient-to-br from-[#2a2a4a] via-[#202038] to-[#1a1a2e]" />
              )}
              <img
                src={material.imageUrl}
                alt=""
                className={`w-full object-cover aspect-[4/3] transition-all duration-500 ${
                  loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                }`}
                onLoad={handleImageLoad}
                onError={(e) => {
                  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23222233"/><text x="50%25" y="50%25" fill="%23555" font-size="14" text-anchor="middle" dy=".3em" font-family="sans-serif">图片加载失败</text></svg>`;
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent(svg);
                  setLoaded(true);
                }}
                draggable={false}
              />
            </div>

            {!readOnly && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-start justify-end gap-2 p-3 pt-10">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowZoom(true); }}
                  className="p-2 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all duration-200 backdrop-blur-sm"
                  title="放大查看"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(material.id); }}
                  className="p-2 rounded-full bg-white/15 hover:bg-red-500 text-white transition-all duration-200 backdrop-blur-sm"
                  title="删除素材"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNoteText(material.note);
                    setShowNoteModal(true);
                  }}
                  className="p-2 rounded-full bg-white/15 hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] text-white transition-all duration-200 backdrop-blur-sm"
                  title="添加备注"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            )}

            {material.note && (
              <div className="px-3 py-2.5 bg-gradient-to-b from-[#1a1a2e] to-[#141424] border-t border-white/5">
                <p className="text-xs text-gray-400 line-clamp-2 font-light leading-relaxed">
                  {material.note}
                </p>
              </div>
            )}
          </div>
        )}
      </Draggable>

      {showZoom && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-fadeIn"
          onClick={() => setShowZoom(false)}
        >
          <button
            onClick={() => setShowZoom(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
          >
            <X size={20} />
          </button>
          <img
            src={material.imageUrl}
            alt=""
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showNoteModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowNoteModal(false)}
        >
          <div
            className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-base" style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}>
                {material.note ? '编辑备注' : '添加备注'}
              </h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="为这张素材卡片写下你的灵感、想法或叙事说明..."
              rows={5}
              autoFocus
              className="w-full bg-[#0f0f1a] text-white rounded-xl p-4 text-sm resize-none border border-white/10 focus:border-[#667eea]/60 focus:outline-none transition-all placeholder:text-gray-600 leading-relaxed"
              style={{ fontFamily: 'Noto Sans SC, sans-serif' }}
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSaveNote}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 text-sm flex items-center gap-1.5 font-medium"
              >
                <Check size={15} />
                保存备注
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(MaterialCard);
