import { useState, useEffect } from 'react';
import { Trash2, Music, Calendar, Play } from 'lucide-react';
import { useGalleryStore } from '@/store/galleryStore';
import { fetchUserInfo, deleteAudio } from '@/api/mockApi';
import EmotionTag from '@/components/EmotionTag';
import RippleButton from '@/components/RippleButton';

export default function ProfilePage() {
  const { userInfo, audioList, removeAudio, setAudioList } = useGalleryStore();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserInfo = async () => {
      setIsLoading(true);
      try {
        const user = await fetchUserInfo();
        useGalleryStore.setState({ userInfo: user });
      } catch (error) {
        console.error('Failed to load user info:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserInfo();
  }, []);

  const userAudios = audioList.filter((a) => a.userId === userInfo.id);

  const handleDelete = async (audioId: string) => {
    try {
      await deleteAudio(audioId);
      removeAudio(audioId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete audio:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.content}>
          <div style={styles.loading}>加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <div style={styles.profileHeader}>
          <div style={styles.avatarContainer}>
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt={userInfo.nickname} style={styles.avatar} />
            ) : (
              <div style={styles.avatarFallback}>
                <span style={styles.avatarText}>
                  {userInfo.nickname.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div style={styles.userInfo}>
            <h1 style={styles.nickname}>{userInfo.nickname}</h1>
            <p style={styles.userStats}>
              <Music size={14} />
              <span>{userAudios.length} 首作品</span>
            </p>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>我的作品</h2>

          {userAudios.length === 0 ? (
            <div style={styles.emptyState}>
              <Music size={48} color="#2A2A44" />
              <p style={styles.emptyText}>还没有上传任何音频</p>
              <p style={styles.emptyHint}>去首页上传你的第一首作品吧</p>
            </div>
          ) : (
            <div style={styles.audioList}>
              {userAudios.map((audio) => (
                <div key={audio.id} style={styles.audioItem}>
                  <div style={styles.audioThumbnail}>
                    <img
                      src={audio.thumbnailData}
                      alt={audio.title}
                      style={styles.thumbnailImg}
                    />
                    <div style={styles.playIcon}>
                      <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                    </div>
                  </div>
                  <div style={styles.audioInfo}>
                    <h3 style={styles.audioTitle}>{audio.title}</h3>
                    <div style={styles.audioMeta}>
                      <EmotionTag emotion={audio.emotion} size="small" />
                      <span style={styles.metaItem}>
                        <Play size={12} />
                        {audio.playCount} 次播放
                      </span>
                      <span style={styles.metaItem}>
                        <Calendar size={12} />
                        {formatDate(audio.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    style={styles.deleteButton}
                    onClick={() => setDeleteConfirmId(audio.id)}
                    title="删除"
                  >
                    <Trash2 size={18} color="#FF6B6B" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {deleteConfirmId && (
          <div style={styles.modalOverlay} onClick={() => setDeleteConfirmId(null)}>
            <div
              style={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={styles.modalTitle}>确认删除</h3>
              <p style={styles.modalText}>
                确定要删除这个音频作品吗？此操作不可撤销。
              </p>
              <div style={styles.modalActions}>
                <RippleButton
                  variant="secondary"
                  onClick={() => setDeleteConfirmId(null)}
                  style={styles.modalButton}
                >
                  取消
                </RippleButton>
                <RippleButton
                  variant="danger"
                  onClick={() => handleDelete(deleteConfirmId)}
                  style={styles.modalButton}
                >
                  删除
                </RippleButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    backgroundColor: '#0B0E17',
    padding: '40px 20px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '80px 0',
    color: '#888899',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '48px',
    paddingBottom: '32px',
    borderBottom: '1px solid #2A2A44',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '2px solid #6C63FF',
    boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)',
    objectFit: 'cover',
  },
  avatarFallback: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '2px solid #6C63FF',
    background: 'linear-gradient(135deg, #6C63FF, #4A42D1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)',
  },
  avatarText: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    margin: '0 0 8px 0',
  },
  userStats: {
    fontSize: '14px',
    color: '#888899',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#FFFFFF',
    margin: '0 0 24px 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '64px 0',
    backgroundColor: '#1A1A2E',
    borderRadius: '12px',
    border: '1px solid #2A2A44',
  },
  emptyText: {
    fontSize: '16px',
    color: '#FFFFFF',
    margin: '16px 0 8px 0',
  },
  emptyHint: {
    fontSize: '14px',
    color: '#888899',
    margin: 0,
  },
  audioList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  audioItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#1A1A2E',
    borderRadius: '12px',
    border: '1px solid #2A2A44',
    transition: 'border-color 0.2s ease',
  },
  audioThumbnail: {
    position: 'relative',
    width: '80px',
    height: '60px',
    borderRadius: '8px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(108, 99, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '2px',
  },
  audioInfo: {
    flex: 1,
    minWidth: 0,
  },
  audioTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#FFFFFF',
    margin: '0 0 8px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  audioMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  metaItem: {
    fontSize: '12px',
    color: '#888899',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  deleteButton: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1A1A2E',
    borderRadius: '8px',
    padding: '32px',
    maxWidth: '400px',
    width: '90%',
    border: '1px solid #FF6B6B',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#FFFFFF',
    margin: '0 0 16px 0',
  },
  modalText: {
    fontSize: '14px',
    color: '#888899',
    margin: '0 0 24px 0',
    lineHeight: 1.6,
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: '10px 20px',
    fontSize: '14px',
  },
};
