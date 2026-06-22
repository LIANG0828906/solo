import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCard from '../components/BookCard';
import { Book } from '../types';

interface Message {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  likes: number;
  liked: boolean;
  boxName: string;
  createdAt: string;
}

const mockMessages: Message[] = [
  {
    id: 'm1',
    author: '小温暖',
    authorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=warm',
    content: '《解忧杂货店》真的太治愈了！每次心情不好的时候都会翻一翻，浪矢爷爷的话总能让人感到温暖。希望这本书也能治愈你。',
    likes: 42,
    liked: false,
    boxName: '治愈系书单',
    createdAt: '2024-01-15',
  },
  {
    id: 'm2',
    author: '侦探控',
    authorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=detective',
    content: '《白夜行》的结局让我震惊了好久！东野圭吾真的太会写了，那种绝望又深刻的爱情，让人久久不能平静。',
    likes: 86,
    liked: true,
    boxName: '推理迷必读',
    createdAt: '2024-01-14',
  },
  {
    id: 'm3',
    author: '书虫老文',
    authorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=classic',
    content: '重读《小王子》，发现每次都有新的感悟。"真正重要的东西，用眼睛是看不见的。" 希望我们都能保持那颗童心。',
    likes: 128,
    liked: false,
    boxName: '经典文学馆',
    createdAt: '2024-01-13',
  },
  {
    id: 'm4',
    author: '未来行者',
    authorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=scifi',
    content: '《三体》不仅仅是一本科幻小说，它让我重新思考人类文明、宇宙法则和生命的意义。强烈推荐给所有对未知充满好奇的人！',
    likes: 256,
    liked: true,
    boxName: '科幻大世界',
    createdAt: '2024-01-12',
  },
  {
    id: 'm5',
    author: '思考者',
    authorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=wisdom',
    content: '《活着》教会我：人是为活着本身而活着，而不是为了活着之外的任何事物所活着。余华的文字看似平淡，却有千钧之力。',
    likes: 167,
    liked: false,
    boxName: '人生智慧录',
    createdAt: '2024-01-11',
  },
  {
    id: 'm6',
    author: '浪漫诗人',
    authorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=poetry',
    content: '海子的诗里有一种纯粹的力量。"面朝大海，春暖花开"，每次读到都会让人心生向往，却又带着一丝淡淡的忧伤。',
    likes: 78,
    liked: false,
    boxName: '诗与远方',
    createdAt: '2024-01-10',
  },
  {
    id: 'm7',
    author: '创业者阿明',
    authorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=business',
    content: '《穷查理宝典》彻底改变了我的思维方式。查理·芒格的智慧值得每一个追求成长的人反复研读。',
    likes: 93,
    liked: true,
    boxName: '商业思维',
    createdAt: '2024-01-09',
  },
  {
    id: 'm8',
    author: '童书妈妈',
    authorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=kids',
    content: '给女儿读《夏洛的网》，自己先被感动哭了。关于友谊、关于生命、关于爱，这本小书里藏着最朴素也最深刻的道理。',
    likes: 61,
    liked: false,
    boxName: '儿童文学精选',
    createdAt: '2024-01-08',
  },
];

const recommendedBooks: Book[] = [
  { id: 'r1', title: '百年孤独', author: '加西亚·马尔克斯', description: '魔幻现实主义的巅峰之作' },
  { id: 'r2', title: '了不起的盖茨比', author: '菲茨杰拉德', description: '爵士时代的华丽挽歌' },
  { id: 'r3', title: '追风筝的人', author: '卡勒德·胡赛尼', description: '关于救赎与友情的动人故事' },
];

const matchRates = [95, 87, 79];

const Wall: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const navigate = useNavigate();

  const handleLike = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              likes: msg.liked ? msg.likes - 1 : msg.likes + 1,
              liked: !msg.liked,
            }
          : msg
      )
    );
  };

  const goToPlaza = () => {
    navigate('/plaza');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.pageTitle}>💌 留言墙</h1>
          <div style={styles.headerButtons}>
            <button onClick={goToPlaza} style={styles.plazaButton}>
              📚 书箱广场
            </button>
            <button
              onClick={() => setShowRecommendModal(true)}
              style={styles.recommendButton}
            >
              🎯 我的推荐
            </button>
          </div>
        </div>
        <p style={styles.subtitle}>
          分享阅读感悟，让思想在这里碰撞
        </p>
      </div>

      <div style={styles.masonryGrid} className="masonry-grid">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            style={{
              ...styles.messageCard,
              animationDelay: `${index * 0.1}s`,
            }}
            className="message-card"
          >
            <div style={styles.cardHeader}>
              <img src={msg.authorAvatar} alt="" style={styles.avatar} />
              <div style={styles.authorInfo}>
                <span style={styles.authorName}>{msg.author}</span>
                <span style={styles.boxTag}>📦 {msg.boxName}</span>
              </div>
            </div>
            <p style={styles.messageContent}>{msg.content}</p>
            <div style={styles.cardFooter}>
              <span style={styles.date}>{msg.createdAt}</span>
              <button
                onClick={() => handleLike(msg.id)}
                style={{
                  ...styles.likeButton,
                  color: msg.liked ? '#e74c3c' : '#a08060',
                }}
              >
                {msg.liked ? '❤️' : '🤍'} {msg.likes}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showRecommendModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowRecommendModal(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>🎯 为你推荐</h2>
              <button
                onClick={() => setShowRecommendModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalContent}>
              <p style={styles.modalDesc}>
                根据你的阅读偏好，为你精选以下书籍
              </p>
              <div style={styles.recommendList}>
                {recommendedBooks.map((book, index) => (
                  <div key={book.id} style={styles.recommendItem}>
                    <BookCard book={book} matchRate={matchRates[index]} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .message-card:hover {
          transform: rotate(-2deg) translateY(-4px);
          box-shadow: 0 10px 30px rgba(139, 94, 60, 0.2);
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '30px 20px 80px',
    background: `
      radial-gradient(circle at 20% 80%, rgba(212, 165, 116, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 94, 60, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #faf3e0 0%, #f5ead5 100%)
    `,
  } as React.CSSProperties,
  header: {
    maxWidth: '1200px',
    margin: '0 auto 30px',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap' as const,
    gap: '15px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '28px',
    color: '#3b2e1f',
    fontWeight: 700,
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  plazaButton: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#8b5e3c',
    border: '1px solid #d4a574',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  recommendButton: {
    padding: '10px 20px',
    backgroundColor: '#8b5e3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  subtitle: {
    margin: 0,
    fontSize: '15px',
    color: '#8b5e3c',
  },
  masonryGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    columns: '3',
    columnGap: '20px',
  } as React.CSSProperties,
  messageCard: {
    backgroundColor: '#fef8e7',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    border: '2px dashed #e8dcc4',
    boxShadow: '0 4px 12px rgba(139, 94, 60, 0.08)',
    breakInside: 'avoid' as const,
    transition: 'all 0.3s ease',
    animation: 'fadeInUp 0.5s ease forwards',
    opacity: 0,
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#d4a574',
    flexShrink: 0,
  },
  authorInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    minWidth: 0,
  },
  authorName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#3b2e1f',
  },
  boxTag: {
    fontSize: '12px',
    color: '#8b5e3c',
  },
  messageContent: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#5a4a32',
    lineHeight: 1.8,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px dashed #e8dcc4',
  },
  date: {
    fontSize: '12px',
    color: '#a08060',
  },
  likeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 46, 31, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    animation: 'fadeIn 0.3s ease',
  } as React.CSSProperties,
  modal: {
    backgroundColor: '#fffef8',
    borderRadius: '20px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'hidden',
    animation: 'slideUp 0.3s ease',
  } as React.CSSProperties,
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '25px 30px',
    borderBottom: '1px solid #e8dcc4',
  },
  modalTitle: {
    margin: 0,
    fontSize: '22px',
    color: '#3b2e1f',
    fontWeight: 600,
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f0e4c8',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#8b5e3c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  modalContent: {
    padding: '25px 30px 30px',
    overflowY: 'auto' as const,
    maxHeight: 'calc(80vh - 80px)',
  },
  modalDesc: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#8b5e3c',
    textAlign: 'center' as const,
  },
  recommendList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  recommendItem: {
    animation: 'fadeInUp 0.5s ease forwards',
    opacity: 0,
  },
};

export default Wall;
