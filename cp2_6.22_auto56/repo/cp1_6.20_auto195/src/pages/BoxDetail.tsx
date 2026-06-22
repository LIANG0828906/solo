import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookCard from '../components/BookCard';
import { Book } from '../types';

interface BoxDetail {
  id: string;
  name: string;
  creator: string;
  creatorAvatar: string;
  emoji: string;
  recommendation: string;
  books: Book[];
  coverColor: string;
}

const mockBoxDetails: Record<string, BoxDetail> = {
  '1': {
    id: '1',
    name: '治愈系书单',
    creator: '小温暖',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=warm',
    emoji: '🌸',
    recommendation: '这些书陪伴我度过了最难的时光，希望也能温暖你。在每个疲惫的夜晚，翻开书页，让文字治愈你的心灵。',
    coverColor: '#f8e8d0',
    books: [
      { id: 'b1', title: '解忧杂货店', author: '东野圭吾', description: '一个关于命运、爱与温柔的故事' },
      { id: 'b2', title: '小王子', author: '安托万·德·圣-埃克苏佩里', description: '所有大人都曾是孩子，愿你永远保持童心' },
      { id: 'b3', title: '遇见未知的自己', author: '张德芬', description: '一场关于身心灵的修行之旅' },
      { id: 'b4', title: '偷影子的人', author: '马克·李维', description: '温暖而浪漫的奇幻故事' },
      { id: 'b5', title: '海边的卡夫卡', author: '村上春树', description: '关于命运、成长与自我寻找' },
    ],
  },
  '2': {
    id: '2',
    name: '推理迷必读',
    creator: '侦探控',
    creatorAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=detective',
    emoji: '🔍',
    recommendation: '每一本都让你欲罢不能，真相永远在最后一页。挑战你的智商，享受解谜的乐趣！',
    coverColor: '#e8d8c8',
    books: [
      { id: 'b6', title: '白夜行', author: '东野圭吾', description: '一段跨越十九年的悲情故事' },
      { id: 'b7', title: '嫌疑人X的献身', author: '东野圭吾', description: '完美犯罪背后的纯粹爱情' },
      { id: 'b8', title: '无人生还', author: '阿加莎·克里斯蒂', description: '孤岛杀人案的经典之作' },
      { id: 'b9', title: '东方快车谋杀案', author: '阿加莎·克里斯蒂', description: '波洛探案的巅峰之作' },
      { id: 'b10', title: '福尔摩斯探案集', author: '柯南·道尔', description: '侦探小说的不朽经典' },
      { id: 'b11', title: '沉默的羔羊', author: '托马斯·哈里斯', description: '心理惊悚的巅峰之作' },
      { id: 'b12', title: '消失的爱人', author: '吉莉安·弗琳', description: '婚姻背后的惊悚真相' },
      { id: 'b13', title: '恶意', author: '东野圭吾', description: '人性深处的恶意与嫉妒' },
    ],
  },
};

const BoxDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [box, setBox] = useState<BoxDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [visibleBooks, setVisibleBooks] = useState<string[]>([]);

  useEffect(() => {
    if (id && mockBoxDetails[id]) {
      setBox(mockBoxDetails[id]);
      const bookIds = mockBoxDetails[id].books.map((b) => b.id);
      bookIds.forEach((bookId, index) => {
        setTimeout(() => {
          setVisibleBooks((prev) => [...prev, bookId]);
        }, index * 100);
      });
    }
  }, [id]);

  const handlePickUp = () => {
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (message.trim() && message.length <= 200) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowModal(false);
        setShowSuccess(true);
        setShowEnvelope(true);
        setTimeout(() => {
          setShowEnvelope(false);
          setShowSuccess(false);
          navigate('/wall');
        }, 2000);
      }, 1000);
    }
  };

  const handleButtonPress = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.transform = 'scale(0.95)';
  };

  const handleButtonRelease = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.transform = 'scale(1)';
  };

  const goBack = () => {
    navigate('/plaza');
  };

  if (!box) {
    return (
      <div style={styles.loadingContainer}>
        <p style={styles.loadingText}>加载中...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button onClick={goBack} style={styles.backButton}>
        ← 返回广场
      </button>

      <div style={styles.mainContent} className="box-detail-content">
        <div style={styles.leftSection}>
          <div style={{ ...styles.boxHeader, backgroundColor: box.coverColor }}>
            <span style={styles.boxEmoji}>{box.emoji}</span>
            <h1 style={styles.boxTitle}>{box.name}</h1>
            <div style={styles.creatorInfo}>
              <img src={box.creatorAvatar} alt="" style={styles.creatorAvatar} />
              <span style={styles.creatorName}>{box.creator}</span>
            </div>
            <p style={styles.recommendation}>"{box.recommendation}"</p>
          </div>

          <div style={styles.booksSection}>
            <h2 style={styles.sectionTitle}>📚 书箱中的书籍</h2>
            <div style={styles.booksList}>
              {box.books.map((book) => (
                <div
                  key={book.id}
                  style={{
                    ...styles.bookItem,
                    opacity: visibleBooks.includes(book.id) ? 1 : 0,
                    transform: visibleBooks.includes(book.id) ? 'translateY(0)' : 'translateY(20px)',
                  }}
                >
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.rightSection}>
          <div style={styles.actionCard}>
            <div style={styles.actionIcon}>🎁</div>
            <h3 style={styles.actionTitle}>捞起书箱</h3>
            <p style={styles.actionDesc}>
              写下你的感悟，让这份温暖传递下去
            </p>
            <button
              onClick={handlePickUp}
              onMouseDown={handleButtonPress}
              onMouseUp={handleButtonRelease}
              onMouseLeave={handleButtonRelease}
              onTouchStart={handleButtonPress}
              onTouchEnd={handleButtonRelease}
              style={styles.pickUpButton}
            >
              🌟 捞起书箱
            </button>
          </div>

          <div style={styles.statsCard}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{box.books.length}</span>
              <span style={styles.statLabel}>本书籍</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statNumber}>∞</span>
              <span style={styles.statLabel}>份温暖</span>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>✍️ 写下你的感悟</h3>
            <p style={styles.modalHint}>分享这本书箱带给你的感受（限200字）</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 200))}
              placeholder="写下你想说的话..."
              style={styles.textarea}
              maxLength={200}
            />
            <div style={styles.charCount}>
              <span style={{ color: message.length >= 180 ? '#c9a227' : '#a08060' }}>
                {message.length}/200
              </span>
            </div>
            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowModal(false)}
                style={styles.cancelButton}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || isSubmitting}
                style={{
                  ...styles.submitButton,
                  backgroundColor: message.trim() && !isSubmitting ? '#8b5e3c' : '#c4a882',
                  cursor: message.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? '提交中...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEnvelope && (
        <div style={styles.envelopeContainer}>
          <div style={styles.envelope}>✉️</div>
        </div>
      )}

      {showSuccess && (
        <div style={styles.successToast}>
          ✅ 发送成功！正在飞向留言墙...
        </div>
      )}

      <style>{`
        @keyframes flyToWall {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-30%, -150%) scale(1.2) rotate(-15deg);
            opacity: 1;
          }
          100% {
            transform: translate(100vw, -100vh) scale(0.5) rotate(30deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    background: 'linear-gradient(135deg, #faf3e0 0%, #f0e4c8 100%)',
  } as React.CSSProperties,
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #faf3e0 0%, #f0e4c8 100%)',
  },
  loadingText: {
    fontSize: '18px',
    color: '#8b5e3c',
  },
  backButton: {
    marginBottom: '20px',
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#8b5e3c',
    border: '1px solid #d4a574',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '30px',
  } as React.CSSProperties,
  leftSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '25px',
  },
  rightSection: {
    position: 'sticky' as const,
    top: '20px',
    alignSelf: 'flex-start',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  boxHeader: {
    padding: '40px 30px',
    borderRadius: '20px',
    textAlign: 'center' as const,
  },
  boxEmoji: {
    fontSize: '72px',
    display: 'block',
    marginBottom: '16px',
  },
  boxTitle: {
    margin: '0 0 12px 0',
    fontSize: '32px',
    color: '#3b2e1f',
    fontWeight: 700,
  },
  creatorInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  creatorAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#d4a574',
  },
  creatorName: {
    fontSize: '15px',
    color: '#6b5a42',
    fontWeight: 500,
  },
  recommendation: {
    margin: 0,
    fontSize: '15px',
    color: '#5a4a32',
    fontStyle: 'italic' as const,
    lineHeight: 1.8,
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  booksSection: {
    backgroundColor: '#fffef8',
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '0 4px 20px rgba(139, 94, 60, 0.08)',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    color: '#3b2e1f',
    fontWeight: 600,
  },
  booksList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  bookItem: {
    transition: 'opacity 0.5s ease, transform 0.5s ease',
  },
  actionCard: {
    backgroundColor: '#fffef8',
    borderRadius: '16px',
    padding: '30px',
    textAlign: 'center' as const,
    boxShadow: '0 4px 20px rgba(139, 94, 60, 0.08)',
  },
  actionIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  actionTitle: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    color: '#3b2e1f',
    fontWeight: 600,
  },
  actionDesc: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#8b5e3c',
    lineHeight: 1.6,
  },
  pickUpButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'linear-gradient(135deg, #8b5e3c 0%, #a06a42 100%)',
    background: 'linear-gradient(135deg, #8b5e3c 0%, #a06a42 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
    fontFamily: 'inherit',
    boxShadow: '0 4px 15px rgba(139, 94, 60, 0.3)',
  } as React.CSSProperties,
  statsCard: {
    backgroundColor: '#fffef8',
    borderRadius: '16px',
    padding: '25px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(139, 94, 60, 0.08)',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#8b5e3c',
  },
  statLabel: {
    fontSize: '13px',
    color: '#a08060',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: '#e8dcc4',
  },
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
    maxWidth: '500px',
    width: '100%',
    padding: '30px',
    animation: 'slideUp 0.3s ease',
  } as React.CSSProperties,
  modalTitle: {
    margin: '0 0 8px 0',
    fontSize: '22px',
    color: '#3b2e1f',
    fontWeight: 600,
    textAlign: 'center' as const,
  },
  modalHint: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#8b5e3c',
    textAlign: 'center' as const,
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    padding: '15px',
    fontSize: '15px',
    border: '2px solid #e8dcc4',
    borderRadius: '12px',
    backgroundColor: '#fff9ed',
    color: '#3b2e1f',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    lineHeight: 1.6,
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.3s ease',
  } as React.CSSProperties,
  charCount: {
    textAlign: 'right' as const,
    marginTop: '8px',
    marginBottom: '20px',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#8b5e3c',
    border: '1px solid #d4a574',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  submitButton: {
    flex: 1,
    padding: '12px',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  envelopeContainer: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 2000,
    pointerEvents: 'none' as const,
    animation: 'flyToWall 2s ease forwards',
  },
  envelope: {
    fontSize: '64px',
    filter: 'drop-shadow(0 4px 15px rgba(139, 94, 60, 0.3))',
  },
  successToast: {
    position: 'fixed' as const,
    top: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#8b5e3c',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: '25px',
    fontSize: '15px',
    fontWeight: 500,
    zIndex: 3000,
    animation: 'fadeInDown 0.3s ease',
    boxShadow: '0 4px 20px rgba(139, 94, 60, 0.3)',
  },
};

export default BoxDetail;
