import Link from 'next/link';
import type { Letter } from '@/types';

interface RecommendationBarProps {
  letters: Letter[];
  loading: boolean;
}

export default function RecommendationBar({ letters, loading }: RecommendationBarProps) {
  return (
    <aside
      style={{
        width: 280,
        flexShrink: 0,
      }}
      className="recommend-aside"
    >
      <div
        style={{
          position: 'sticky',
          top: 80,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-kaiti)',
            fontSize: '1.1rem',
            color: '#2C1810',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '2px solid #A67C52',
            display: 'inline-block',
          }}
        >
          为你推荐
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 80,
                  borderRadius: 8,
                  background: '#FDF9F0',
                  opacity: 0.5,
                }}
              />
            ))
          ) : letters.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: 'center',
                color: '#8B7355',
                fontSize: '0.85rem',
              }}
            >
              暂无推荐内容
            </div>
          ) : (
            letters.map((letter) => (
              <Link href={`/letter/${letter.id}`} key={letter.id}>
                <div
                  style={{
                    height: 80,
                    borderRadius: 8,
                    background: '#FDF9F0',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderLeft: '0px solid #4A6B5D',
                  }}
                  className="rec-card"
                >
                  <h4
                    style={{
                      fontSize: '0.9rem',
                      color: '#2C1810',
                      fontWeight: 500,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4,
                    }}
                  >
                    {letter.title}
                  </h4>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {letter.tags
                      .split(',')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '0.7rem',
                            color: '#5C4A39',
                            background: '#E8E0D6',
                            padding: '2px 8px',
                            borderRadius: 10,
                          }}
                        >
                          {tag.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .recommend-aside {
          display: block;
        }
        @media (max-width: 768px) {
          .recommend-aside {
            display: none;
          }
        }
        .rec-card:hover {
          border-left-width: 5px !important;
          padding-left: 9px !important;
          transform: translateX(2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
      `}</style>
    </aside>
  );
}
