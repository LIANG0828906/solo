import React, { useState, useEffect, useCallback } from 'react';
import { fetchArtworks, likeArtwork, fetchComments, addComment } from '../utils/api';

interface Artwork {
  id: string;
  title: string;
  dimensions: string;
  year: number;
  imageBase64: string;
  likes: number;
  commentCount: number;
}

interface Comment {
  id: string;
  text: string;
  timestamp: string;
}

const GalleryScene: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  const loadArtworks = useCallback(async () => {
    try {
      const data = await fetchArtworks();
      setArtworks(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArtworks();
  }, [loadArtworks]);

  const handleLike = async (id: string) => {
    try {
      const result = await likeArtwork(id);
      setArtworks((prev) =>
        prev.map((a) => (a.id === id ? { ...a, likes: result.likes } : a))
      );
    } catch {
      // ignore
    }
  };

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    setCommentText('');
    try {
      const data = await fetchComments(id);
      setComments(data);
    } catch {
      setComments([]);
    }
  };

  const handleAddComment = async () => {
    if (!selectedId || !commentText.trim()) return;
    try {
      const newComment = await addComment(selectedId, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      setArtworks((prev) =>
        prev.map((a) =>
          a.id === selectedId ? { ...a, commentCount: a.commentCount + 1 } : a
        )
      );
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#E0E0E0' }}>
        Loading gallery...
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
      }}>
        {artworks.map((artwork) => (
          <div
            key={artwork.id}
            onClick={() => handleSelect(artwork.id)}
            style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: selectedId === artwork.id ? '0 0 0 2px #6366F1' : 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(99,102,241,0.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = selectedId === artwork.id ? '0 0 0 2px #6366F1' : 'none';
            }}
          >
            {artwork.imageBase64 && (
              <img
                src={artwork.imageBase64}
                alt={artwork.title}
                style={{
                  width: '100%',
                  height: '220px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            )}
            <div style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 4px', color: '#E0E0E0', fontSize: '16px' }}>
                {artwork.title}
              </h3>
              <p style={{ margin: '0 0 12px', color: '#999', fontSize: '13px' }}>
                {artwork.dimensions} &middot; {artwork.year}
              </p>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(artwork.id);
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    color: '#E0E0E0',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  ❤️ {artwork.likes}
                </button>
                <span style={{ color: '#999', fontSize: '13px' }}>
                  💬 {artwork.commentCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedId(null)}
        >
          <div
            style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const artwork = artworks.find((a) => a.id === selectedId);
              if (!artwork) return null;
              return (
                <>
                  {artwork.imageBase64 && (
                    <img
                      src={artwork.imageBase64}
                      alt={artwork.title}
                      style={{
                        width: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        marginBottom: '16px',
                      }}
                    />
                  )}
                  <h2 style={{ color: '#E0E0E0', marginTop: 0 }}>{artwork.title}</h2>
                  <p style={{ color: '#999' }}>
                    {artwork.dimensions} &middot; {artwork.year} &middot; ❤️ {artwork.likes} likes
                  </p>

                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ color: '#E0E0E0', fontSize: '16px' }}>Comments</h3>
                    {comments.length === 0 ? (
                      <p style={{ color: '#888', fontSize: '14px' }}>No comments yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        {comments.map((c) => (
                          <div
                            key={c.id}
                            style={{
                              backgroundColor: '#333',
                              borderRadius: '8px',
                              padding: '10px 14px',
                            }}
                          >
                            <p style={{ margin: 0, color: '#E0E0E0', fontSize: '14px' }}>{c.text}</p>
                            <span style={{ color: '#888', fontSize: '12px' }}>
                              {new Date(c.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment();
                        }}
                        placeholder="Add a comment..."
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: '1px solid #444',
                          borderRadius: '8px',
                          backgroundColor: '#333',
                          color: '#E0E0E0',
                          fontSize: '14px',
                        }}
                      />
                      <button
                        onClick={handleAddComment}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#6366F1',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedId(null)}
                    style={{
                      marginTop: '16px',
                      padding: '8px 20px',
                      backgroundColor: '#444',
                      color: '#E0E0E0',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Close
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryScene;
