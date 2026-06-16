import { useState, useMemo } from 'react';
import { useWardrobeStore } from '../store';

interface ColumnItem {
  postIndex: number;
  height: number;
}

export default function SocialWall() {
  const socialPosts = useWardrobeStore((s) => s.socialPosts);
  const toggleLike = useWardrobeStore((s) => s.toggleLike);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [likeAnimId, setLikeAnimId] = useState<string | null>(null);

  const columns = useMemo(() => {
    const cols: ColumnItem[][] = [[], [], []];
    const colHeights = [0, 0, 0];

    socialPosts.forEach((post, index) => {
      const minHeight = Math.min(...colHeights);
      const minCol = colHeights.indexOf(minHeight);
      const height = 200 + Math.floor(Math.random() * 150);
      cols[minCol].push({ postIndex: index, height });
      colHeights[minCol] += height + 16;
    });

    return cols;
  }, [socialPosts]);

  const selectedPost = socialPosts.find((p) => p.id === selectedPostId);

  const handleLike = (postId: string) => {
    setLikeAnimId(postId);
    toggleLike(postId);
    setTimeout(() => setLikeAnimId(null), 300);
  };

  return (
    <div style={{ background: '#F5E6D3', minHeight: '100vh', padding: '24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#5C3A21', marginBottom: 24, textAlign: 'center' }}>
        穿搭社交墙
      </h1>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {columns.map((col, colIndex) => (
          <div key={colIndex} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {col.map(({ postIndex, height }) => {
              const post = socialPosts[postIndex];
              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(92,58,33,0.12)',
                    cursor: 'pointer',
                    background: '#fff',
                    animation: 'fadeIn 0.4s ease',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(92,58,33,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(92,58,33,0.12)';
                  }}
                >
                  <img
                    src={post.outfitPhoto}
                    alt="outfit"
                    style={{ width: '100%', height, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={post.avatar}
                      alt={post.userName}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#3E2723' }}>{post.userName}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 13, color: '#8D6E63' }}>
                      ❤️ {post.likes}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selectedPost && (
        <div
          onClick={() => setSelectedPostId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              maxWidth: 480,
              width: '90%',
              animation: 'flyIn 0.3s ease',
            }}
          >
            <img
              src={selectedPost.outfitPhoto}
              alt="outfit preview"
              style={{ width: '100%', maxHeight: 500, objectFit: 'cover', display: 'block' }}
            />
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src={selectedPost.avatar}
                alt={selectedPost.userName}
                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#3E2723' }}>{selectedPost.userName}</span>
              <button
                onClick={() => handleLike(selectedPost.id)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  fontSize: 28,
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  animation: likeAnimId === selectedPost.id ? 'bounce 0.3s ease' : 'none',
                  color: selectedPost.liked ? '#E53935' : '#D0C4B5',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ❤️
              </button>
              <span style={{ fontSize: 14, color: '#8D6E63' }}>{selectedPost.likes}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
