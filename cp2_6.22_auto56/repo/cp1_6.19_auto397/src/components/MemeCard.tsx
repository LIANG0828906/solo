import React, { useState } from 'react';
import { useGalleryStore, type Meme } from '../store/galleryStore';
import './MemeCard.css';

interface MemeCardProps {
  meme: Meme;
  onClick?: () => void;
}

const MemeCard: React.FC<MemeCardProps> = ({ meme, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const likeMeme = useGalleryStore((state) => state.likeMeme);
  const likedMemes = useGalleryStore((state) => state.likedMemes);

  const isLiked = likedMemes[meme.id];

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    await likeMeme(meme.id);
    setTimeout(() => setIsLiking(false), 200);
  };

  return (
    <div className="meme-card" onClick={onClick}>
      <div className="meme-card-image-wrap">
        {!imageLoaded && <div className="meme-card-skeleton" />}
        <img
          src={meme.imageUrl}
          alt={meme.description || '表情包'}
          className={`meme-card-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        <div className="meme-card-stats">
          <button
            className={`meme-card-like ${isLiked ? 'liked' : ''} ${isLiking ? 'liking' : ''}`}
            onClick={handleLike}
          >
            <span className="heart">{isLiked ? '❤️' : '🤍'}</span>
            <span>{meme.likes}</span>
          </button>
          <div className="meme-card-comments">
            <span>💬</span>
            <span>{meme.commentsCount}</span>
          </div>
        </div>
      </div>
      <div className="meme-card-footer">
        <img
          src={meme.authorAvatar}
          alt={meme.author}
          className="meme-card-avatar"
        />
        <span className="meme-card-author">{meme.author}</span>
      </div>
    </div>
  );
};

export default MemeCard;
