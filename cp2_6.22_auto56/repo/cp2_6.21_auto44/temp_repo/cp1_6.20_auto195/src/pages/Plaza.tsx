import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface BookBox {
  id: string;
  name: string;
  creator: string;
  creatorAvatar: string;
  emoji: string;
  recommendation: string;
  books: number;
  coverColor: string;
}

const mockBoxes: BookBox[] = [
  {
    id: '1',
    name: '治愈系书单',
    creator: '小温暖',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=warm',
    emoji: '🌸',
    recommendation: '这些书陪伴我度过了最难的时光，希望也能温暖你',
    books: 5,
    coverColor: '#f8e8d0',
  },
  {
    id: '2',
    name: '推理迷必读',
    creator: '侦探控',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=detective',
    emoji: '🔍',
    recommendation: '每一本都让你欲罢不能，真相永远在最后一页',
    books: 8,
    coverColor: '#e8d8c8',
  },
  {
    id: '3',
    name: '经典文学馆',
    creator: '书虫老文',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=classic',
    emoji: '📖',
    recommendation: '经过时间沉淀的文字，永远值得细细品味',
    books: 12,
    coverColor: '#f0e4d4',
  },
  {
    id: '4',
    name: '科幻大世界',
    creator: '未来行者',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=scifi',
    emoji: '🚀',
    recommendation: '想象力的边界在哪里？这些书会告诉你答案',
    books: 6,
    coverColor: '#e6d9c9',
  },
  {
    id: '5',
    name: '人生智慧录',
    creator: '思考者',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=wisdom',
    emoji: '💡',
    recommendation: '关于人生、关于爱、关于存在的思考与感悟',
    books: 9,
    coverColor: '#f5ebdd',
  },
  {
    id: '6',
    name: '诗与远方',
    creator: '浪漫诗人',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=poetry',
    emoji: '🌙',
    recommendation: '在诗歌中寻找灵魂的栖息之所',
    books: 4,
    coverColor: '#fae8d8',
  },
  {
    id: '7',
    name: '商业思维',
    creator: '创业者阿明',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=business',
    emoji: '💼',
    recommendation: '从这些书中学习商业的本质与底层逻辑',
    books: 7,
    coverColor: '#ede0d0',
  },
  {
    id: '8',
    name: '儿童文学精选',
    creator: '童书妈妈',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=kids',
    emoji: '🎈',
    recommendation: '适合孩子也适合大人的温暖故事',
    books: 10,
    coverColor: '#fff0e0',
  },
  {
    id: '9',
    name: '历史的回响',
    creator: '历史爱好者',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=history',
    emoji: '🏛️',
    recommendation: '读懂历史，才能理解现在，看清未来',
    books: 11,
    coverColor: '#e0d0b8',
  },
  {
    id: '10',
    name: '心理学入门',
    creator: '心理探索者',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=psych',
    emoji: '🧠',
    recommendation: '了解自己，理解他人，从这里开始',
    books: 6,
    coverColor: '#f5e5d5',
  },
  {
    id: '11',
    name: '艺术之美',
    creator: '审美达人',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=art',
    emoji: '🎨',
    recommendation: '提升审美，感受艺术带来的精神愉悦',
    books: 5,
    coverColor: '#f8e5d8',
  },
  {
    id: '12',
    name: '旅行文学',
    creator: '背包客小雨',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=travel',
    emoji: '✈️',
    recommendation: '身体和灵魂，总有一个要在路上',
    books: 8,
    coverColor: '#ecddcc',
  },
  {
    id: '13',
    name: '哲学启蒙',
    creator: '爱智者',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=philosophy',
    emoji: '🏺',
    recommendation: '未经审视的人生不值得度过',
    books: 7,
    coverColor: '#e5d8c5',
  },
  {
    id: '14',
    name: '美食与生活',
    creator: '美食家小李',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=food',
    emoji: '🍜',
    recommendation: '美食是最直接的幸福感来源',
    books: 4,
    coverColor: '#fbe8d8',
  },
  {
    id: '15',
    name: '成长路上',
    creator: '追光者',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=growth',
    emoji: '🌱',
    recommendation: '每一次成长，都值得被记录',
    books: 9,
    coverColor: '#f2e5d5',
  },
];

const Plaza: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBox, setSelectedBox] = useState<BookBox | null>(null);
  const navigate = useNavigate();
  const itemsPerPage = 10;

  const filteredBoxes = useMemo(() => {
    if (!searchTerm.trim()) return mockBoxes;
    const term = searchTerm.toLowerCase();
    return mockBoxes.filter(
      (box) =>
        box.name.toLowerCase().includes(term) ||
        box.creator.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredBoxes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBoxes = filteredBoxes.slice(startIndex, startIndex + itemsPerPage);

  const handleBoxClick = (box: BookBox) => {
    setSelectedBox(box);
  };

  const handleViewDetail = () => {
    if (selectedBox) {
      navigate(`/box/${selectedBox.id}`);
    }
  };

  const goToWall = () => {
    navigate('/wall');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.pageTitle}>📚 书箱广场</h1>
          <button onClick={goToWall} style={styles.wallButton}>
            💌 留言墙
          </button>
        </div>
        <div style={styles.searchContainer}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="搜索书箱名称或创建者..."
            style={styles.searchInput}
          />
          <span style={styles.searchIcon}>🔍</span>
        </div>
      </div>

      <div style={styles.grid} className="plaza-grid">
        {paginatedBoxes.map((box, index) => (
          <div
            key={box.id}
            onClick={() => handleBoxClick(box)}
            style={{
              ...styles.boxCard,
              backgroundColor: box.coverColor,
              animationDelay: `${index * 0.05}s`,
            }}
            className="box-card"
          >
            <div style={styles.boxEmoji}>{box.emoji}</div>
            <h3 style={styles.boxName}>{box.name}</h3>
            <p style={styles.boxInfo}>{box.books} 本书</p>
            <div style={styles.creatorRow}>
              <img src={box.creatorAvatar} alt="" style={styles.creatorAvatar} />
              <span style={styles.creatorName}>{box.creator}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredBoxes.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>没有找到相关书箱</p>
        </div>
      )}

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              ...styles.pageButton,
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            上一页
          </button>
          <div style={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  ...styles.pageNumber,
                  backgroundColor: currentPage === page ? '#8b5e3c' : 'transparent',
                  color: currentPage === page ? '#fff' : '#8b5e3c',
                }}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              ...styles.pageButton,
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            下一页
          </button>
        </div>
      )}

      {selectedBox && (
        <div style={styles.modalOverlay} onClick={() => setSelectedBox(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, backgroundColor: selectedBox.coverColor }}>
              <span style={styles.modalEmoji}>{selectedBox.emoji}</span>
              <button
                onClick={() => setSelectedBox(null)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalContent}>
              <h2 style={styles.modalTitle}>{selectedBox.name}</h2>
              <div style={styles.modalCreator}>
                <img src={selectedBox.creatorAvatar} alt="" style={styles.modalAvatar} />
                <span style={styles.modalCreatorName}>{selectedBox.creator}</span>
              </div>
              <p style={styles.modalRecommendation}>
                "{selectedBox.recommendation.slice(0, 20)}..."
              </p>
              <p style={styles.modalBooksCount}>
                📚 包含 {selectedBox.books} 本精选好书
              </p>
              <button onClick={handleViewDetail} style={styles.viewDetailButton}>
                查看详情
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .box-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(139, 94, 60, 0.25);
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
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(139, 94, 60, 0.02) 2px,
        rgba(139, 94, 60, 0.02) 4px
      ),
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
    marginBottom: '20px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '28px',
    color: '#3b2e1f',
    fontWeight: 700,
  },
  wallButton: {
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
  searchContainer: {
    position: 'relative' as const,
    maxWidth: '500px',
  },
  searchInput: {
    width: '100%',
    padding: '14px 50px 14px 20px',
    fontSize: '15px',
    border: '2px solid #e8dcc4',
    borderRadius: '12px',
    backgroundColor: '#fffef8',
    color: '#3b2e1f',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  searchIcon: {
    position: 'absolute' as const,
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
  },
  grid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,
  boxCard: {
    padding: '25px 20px',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center' as const,
    boxShadow: '0 4px 15px rgba(139, 94, 60, 0.1)',
    animation: 'fadeInUp 0.5s ease forwards',
    opacity: 0,
  } as React.CSSProperties,
  boxEmoji: {
    fontSize: '48px',
    marginBottom: '12px',
    display: 'block',
  },
  boxName: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#3b2e1f',
  },
  boxInfo: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    color: '#8b5e3c',
  },
  creatorRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  creatorAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#d4a574',
  },
  creatorName: {
    fontSize: '13px',
    color: '#6b5a42',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#a08060',
  },
  pagination: {
    maxWidth: '1200px',
    margin: '40px auto 0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  pageButton: {
    padding: '10px 20px',
    backgroundColor: '#fffef8',
    color: '#8b5e3c',
    border: '1px solid #e8dcc4',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  pageNumbers: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  pageNumber: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid #e8dcc4',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.3s ease',
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
    maxWidth: '400px',
    width: '100%',
    overflow: 'hidden',
    animation: 'slideUp 0.3s ease',
  } as React.CSSProperties,
  modalHeader: {
    padding: '40px 30px 20px',
    textAlign: 'center' as const,
    position: 'relative' as const,
  },
  modalEmoji: {
    fontSize: '64px',
  },
  closeButton: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#8b5e3c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  modalContent: {
    padding: '25px 30px 30px',
    textAlign: 'center' as const,
  },
  modalTitle: {
    margin: '0 0 16px 0',
    fontSize: '24px',
    color: '#3b2e1f',
    fontWeight: 700,
  },
  modalCreator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  modalAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#d4a574',
  },
  modalCreatorName: {
    fontSize: '15px',
    color: '#8b5e3c',
    fontWeight: 500,
  },
  modalRecommendation: {
    margin: '0 0 16px 0',
    fontSize: '15px',
    color: '#6b5a42',
    fontStyle: 'italic' as const,
    lineHeight: 1.6,
  },
  modalBooksCount: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#a08060',
  },
  viewDetailButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#8b5e3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,
};

export default Plaza;
