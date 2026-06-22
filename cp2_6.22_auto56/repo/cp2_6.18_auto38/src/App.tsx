import React, { useState, useEffect } from 'react';
import { useWishStore } from './store';
import { WishList } from './components/WishList';
import { Navbar, PageType } from './components/Navbar';
import { CreateWishModal } from './components/CreateWishModal';
import { Ranking } from './components/Ranking';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('my-wishes');
  const [modalOpen, setModalOpen] = useState(false);
  const { getMyWishes, getCommunityWishes, favoriteIds, wishes } = useWishStore();

  const myWishes = getMyWishes();
  const communityWishes = getCommunityWishes();
  const favoriteWishes = wishes.filter((w) => favoriteIds.includes(w.id));

  const renderPage = () => {
    switch (currentPage) {
      case 'my-wishes':
        return (
          <div>
            <PageHeader
              title="📋 我的愿望清单"
              subtitle="管理和追踪你自己的愿望目标，拖拽卡片调整顺序"
              action={
                <ActionButton onClick={() => setModalOpen(true)}>
                  <span style={{ fontSize: 16 }}>+</span>
                  创建新愿望
                </ActionButton>
              }
              stats={[
                { label: '总愿望', value: myWishes.length, icon: '📝', color: '#6C63FF' },
                {
                  label: '进行中',
                  value: myWishes.filter((w) => w.progress > 0 && w.progress < 100).length,
                  icon: '⏳',
                  color: '#F39C12'
                },
                {
                  label: '已完成',
                  value: myWishes.filter((w) => w.progress === 100).length,
                  icon: '✅',
                  color: '#2ECC71'
                },
                {
                  label: '已收藏',
                  value: favoriteWishes.filter((w) => w.isOwn).length,
                  icon: '❤️',
                  color: '#E74C3C'
                }
              ]}
            />
            <WishList
              wishes={myWishes}
              enableDrag={true}
              emptyText="还没有愿望清单，点击右上角「创建新愿望」开始吧！"
            />
          </div>
        );

      case 'community':
        return (
          <div>
            <PageHeader
              title="🌐 社区愿望广场"
              subtitle="浏览他人的愿望清单，找到志同道合的伙伴，收藏你喜欢的愿望"
              stats={[
                { label: '社区愿望', value: communityWishes.length, icon: '🌍', color: '#6C63FF' },
                {
                  label: '我的收藏',
                  value: favoriteWishes.filter((w) => !w.isOwn).length,
                  icon: '⭐',
                  color: '#F39C12'
                },
                {
                  label: '总收藏',
                  value: communityWishes.reduce((sum, w) => sum + w.favorites, 0),
                  icon: '❤️',
                  color: '#E74C3C'
                },
                {
                  label: '总评论',
                  value: communityWishes.reduce((sum, w) => sum + w.comments, 0),
                  icon: '💬',
                  color: '#3498DB'
                }
              ]}
            />
            <WishList
              wishes={communityWishes}
              enableDrag={false}
              emptyText="社区暂无愿望清单"
            />
          </div>
        );

      case 'ranking':
        return <Ranking />;

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(90deg, #E8F0FE 0%, #F0E6FF 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navbar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onCreateWish={() => setModalOpen(true)}
      />

      <main
        style={{
          paddingTop: 60,
          minHeight: '100vh'
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '32px 24px'
          }}
        >
          {renderPage()}
        </div>
      </main>

      <CreateWishModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  stats: { label: string; value: number; icon: string; color: string }[];
}

function PageHeader({ title, subtitle, action, stats }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: '#2c3e50', fontWeight: 700 }}>
            {title}
          </h1>
          <p style={{ margin: '8px 0 0', color: '#7f8c8d', fontSize: 14, lineHeight: 1.6 }}>
            {subtitle}
          </p>
        </div>
        {action}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          className: 'stats-grid'
        }}
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 4px 16px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0
              }}
            >
              {stat.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: stat.color,
                  lineHeight: 1.2
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: '#95a5a6', marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px',
        border: 'none',
        borderRadius: 8,
        backgroundColor: '#6C63FF',
        color: '#fff',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 2px 8px rgba(108, 99, 255, 0.3)',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A52D5';
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          '0 4px 12px rgba(108, 99, 255, 0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6C63FF';
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          '0 2px 8px rgba(108, 99, 255, 0.3)';
      }}
    >
      {children}
    </button>
  );
}
