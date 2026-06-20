import type { Artist } from '../types';
import './ArtistList.css';

interface ArtistListProps {
  artists: Artist[];
  onBook: (artist: Artist) => void;
  loading?: boolean;
}

export default function ArtistList({ artists, onBook, loading }: ArtistListProps) {
  if (loading) {
    return (
      <div className="artist-list">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="artist-card skeleton">
            <div className="avatar-skeleton" />
            <div className="line-skeleton short" />
            <div className="line-skeleton" />
            <div className="line-skeleton" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="artist-list">
      {artists.map((artist) => (
        <div key={artist.id} className="artist-card">
          <div className="card-inner">
            <div
              className="artist-avatar"
              style={{ backgroundColor: artist.avatarColor }}
            >
              {artist.avatar}
            </div>
            <h3 className="artist-name">{artist.name}</h3>
            <span className="artist-specialty">{artist.specialty}</span>
            <p className="artist-intro">{artist.intro}</p>
            <button
              className="book-btn"
              onClick={() => onBook(artist)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              立即预约
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
