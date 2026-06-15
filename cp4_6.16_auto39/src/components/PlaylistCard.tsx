import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Playlist } from '../types';
import './PlaylistCard.css';

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link to={`/playlist/${playlist.id}`} className="playlist-card">
      <div className="playlist-card__cover" style={{ backgroundColor: playlist.coverColor }}>
        <div className="playlist-card__cover-overlay" />
        <span className="playlist-card__song-count">{playlist.songCount} 首</span>
      </div>
      <div className="playlist-card__content">
        <h3 className="playlist-card__title">{playlist.title}</h3>
        <p className="playlist-card__description">{playlist.description}</p>
        <div className="playlist-card__footer">
          <div className="playlist-card__creator">
            <div className="playlist-card__avatar">{playlist.creator.charAt(0)}</div>
            <span>{playlist.creator}</span>
          </div>
          <div className="playlist-card__stats">
            <span className="playlist-card__stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {playlist.commentCount}
            </span>
          </div>
        </div>
        <div className="playlist-card__time">
          更新于 {formatDistanceToNow(playlist.updatedAt, { addSuffix: true, locale: zhCN })}
        </div>
      </div>
    </Link>
  );
}
