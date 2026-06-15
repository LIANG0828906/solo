import { useEffect, useRef, memo } from 'react';
import { X, User, Tag } from 'lucide-react';
import type { Artwork, Comment } from '@/data/mockData';
import { CommentSection } from './CommentSection';

interface ArtworkModalProps {
  artwork: Artwork | null;
  comments: Comment[];
  onClose: () => void;
  onAddComment: (data: { artworkId: string; username: string; content: string }) => void;
}

export const ArtworkModal = memo(function ArtworkModal({ artwork, comments, onClose, onAddComment }: ArtworkModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!artwork) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [artwork, onClose]);

  if (!artwork) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal artwork-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="关闭">
          <X size={22} strokeWidth={2} />
        </button>

        <div className="artwork-modal__grid">
          <div className="artwork-modal__image-col">
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="artwork-modal__image"
            />
          </div>

          <div className="artwork-modal__info-col">
            <div className="artwork-modal__header">
              <h2 className="artwork-modal__title">{artwork.title}</h2>
              <div className="artwork-modal__meta">
                <span className="artwork-modal__meta-item">
                  <User size={16} strokeWidth={1.5} />
                  {artwork.artist}
                </span>
                <span className="artwork-modal__meta-item">
                  <Tag size={16} strokeWidth={1.5} />
                  作品 #{artwork.id.slice(-3)}
                </span>
              </div>
            </div>

            <div className="artwork-modal__description">
              <h5>作品描述</h5>
              <p>{artwork.description}</p>
            </div>

            <div className="artwork-modal__comments">
              <CommentSection
                comments={comments}
                onSubmit={({ username, content }) =>
                  onAddComment({ artworkId: artwork.id, username, content })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
