import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, MoreVertical, Link2, Star, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import { getBlob, blobToObjectUrl } from '@/utils/fileHelpers';
import type { Sketch } from '@/types';

interface SketchCardProps {
  sketch: Sketch;
  onClick: (sketch: Sketch) => void;
  onAnnotationClick: (sketch: Sketch) => void;
}

export default function SketchCard({ sketch, onClick, onAnnotationClick }: SketchCardProps) {
  const unreadCount = useProjectStore((s) => s.getUnreadCount(sketch.id));
  const deleteSketch = useProjectStore((s) => s.deleteSketch);
  const markAsFinal = useProjectStore((s) => s.markAsFinal);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let url = '';
    getBlob(sketch.thumbnailBlobKey).then((blob) => {
      if (blob) {
        url = blobToObjectUrl(blob);
        setThumbnailUrl(url);
      }
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [sketch.thumbnailBlobKey]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  }, []);

  const handleCloseMenu = useCallback(() => setShowMenu(false), []);

  const handleCopyLink = useCallback(() => {
    const annotations = useProjectStore.getState().getSketchAnnotations(sketch.id);
    if (annotations.length > 0) {
      navigator.clipboard.writeText(`${window.location.origin}/annotation/${sketch.id}`).catch(() => {});
    }
    setShowMenu(false);
  }, [sketch.id]);

  const handleMarkFinal = useCallback(() => {
    markAsFinal(sketch.id);
    setShowMenu(false);
  }, [markAsFinal, sketch.id]);

  const handleDelete = useCallback(() => {
    deleteSketch(sketch.id);
    setShowMenu(false);
  }, [deleteSketch, sketch.id]);

  return (
    <>
      <motion.div
        layout
        whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onClick(sketch)}
        onContextMenu={handleContextMenu}
        className="relative bg-white rounded-lg overflow-hidden cursor-pointer shadow-md"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        <div className="aspect-[4/3] bg-[#BDC3C7] overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={sketch.fileName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#95A5A6]">
              <Clock size={24} />
            </div>
          )}
        </div>

        {unreadCount > 0 && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-[#E74C3C] rounded-full flex items-center justify-center text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}

        {sketch.isFinal && (
          <div className="absolute top-2 left-2 w-5 h-5 bg-[#27AE60] rounded-full flex items-center justify-center text-white">
            <Star size={12} />
          </div>
        )}

        {sketch.isConfirmed && (
          <div className="absolute top-2 left-2 w-5 h-5 bg-[#27AE60] rounded-full flex items-center justify-center text-white">
            <Check size={12} />
          </div>
        )}

        <div className="px-3 py-2.5">
          <p className="text-sm font-medium text-[#2C3E50] truncate">
            {sketch.fileName}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-[#95A5A6]">
              {new Date(sketch.createdAt).toLocaleDateString('zh-CN')}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnnotationClick(sketch);
                }}
                className="text-xs text-[#E74C3C] hover:underline"
              >
                {unreadCount}条批注
              </button>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e as unknown as React.MouseEvent);
          }}
          className="absolute bottom-2.5 right-2 p-1 rounded hover:bg-[#ECF0F1] transition-colors duration-200 text-[#95A5A6]"
        >
          <MoreVertical size={14} />
        </button>
      </motion.div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleCloseMenu} />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-[#BDC3C7] py-1 min-w-[160px]"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#2C3E50] hover:bg-[#ECF0F1] transition-colors duration-200"
            >
              <Link2 size={14} />
              复制批注链接
            </button>
            <button
              onClick={handleMarkFinal}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#2C3E50] hover:bg-[#ECF0F1] transition-colors duration-200"
            >
              <Star size={14} />
              标记为终稿
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#E74C3C] hover:bg-[#FDEDEC] transition-colors duration-200"
            >
              <Trash2 size={14} />
              删除
            </button>
          </div>
        </>
      )}
    </>
  );
}
