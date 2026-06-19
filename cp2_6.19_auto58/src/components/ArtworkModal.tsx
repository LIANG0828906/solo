import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useGalleryStore } from '../store/galleryStore';

interface ArtworkModalProps {}

const ArtworkModal: React.FC<ArtworkModalProps> = () => {
  const selectedArtwork = useGalleryStore((state) => state.selectedArtwork);
  const setSelectedArtwork = useGalleryStore((state) => state.setSelectedArtwork);

  useEffect(() => {
    if (selectedArtwork) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedArtwork]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedArtwork) {
        setSelectedArtwork(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArtwork, setSelectedArtwork]);

  if (!selectedArtwork) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={() => setSelectedArtwork(null)}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl max-h-[90vh] flex flex-col"
        style={{
          animation: 'scaleIn 0.3s ease-out',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800 truncate">
            {selectedArtwork.description}
          </h3>
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-all duration-300 active:scale-95"
            onClick={() => setSelectedArtwork(null)}
            aria-label="关闭"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center bg-gray-50 rounded-xl p-4">
            <img
              src={selectedArtwork.originalUrl}
              alt={selectedArtwork.description}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">
              {selectedArtwork.description}
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ArtworkModal;
