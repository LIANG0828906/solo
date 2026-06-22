import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import StarRating from '../components/StarRating';
import type { User, Review, Book } from '../types';
import * as db from '../db';

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { currentUser, updateProfile } = useStore();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [reviewBooks, setReviewBooks] = useState<Record<string, Book>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newAvatarColor, setNewAvatarColor] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;
      setLoading(true);
      const user = await useStore.getState().getUserByUsername(username);
      if (user) {
        setProfileUser(user);
        const reviews = await useStore.getState().getUserReviews(user.id);
        setUserReviews(reviews);
        const booksMap: Record<string, Book> = {};
        for (const review of reviews) {
          if (!booksMap[review.bookId]) {
            const book = await db.getBookById(review.bookId);
            if (book) {
              booksMap[review.bookId] = book;
            }
          }
        }
        setReviewBooks(booksMap);
        setNewUsername(user.username);
        setNewAvatarColor(user.avatarColor);
      }
      setLoading(false);
    };
    loadProfile();
  }, [username]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `注册于 ${year}年${month}月${day}日`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleSaveProfile = async () => {
    if (!newUsername.trim()) return;
    const success = await updateProfile(newUsername.trim(), newAvatarColor);
    if (success) {
      setIsEditing(false);
      setProfileUser((prev) =>
        prev ? { ...prev, username: newUsername.trim(), avatarColor: newAvatarColor } : prev
      );
    }
  };

  const isOwner = currentUser && profileUser && currentUser.id === profileUser.id;

  const coverColors = ['#8B4513', '#A0522D', '#CD853F', '#B8860B', '#D2691E', '#8B7355'];

  if (loading) {
    return (
      <div className="page-container">
        <div>加载中...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="page-container">
        <div>用户不存在</div>
      </div>
    );
  }

  return (
    <div className="page-container profile-container">
      <div className="profile-header">
        <div
          className="avatar-lg"
          style={{ background: profileUser.avatarColor }}
        >
          {profileUser.username.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>{profileUser.username}</h2>
          <p>{formatDate(profileUser.createdAt)}</p>
        </div>
        {isOwner && (
          <button className="edit-btn" onClick={() => setIsEditing(true)}>
            编辑资料
          </button>
        )}
      </div>

      <div className="user-reviews">
        <h3>发表的书评</h3>
        {userReviews.length === 0 ? (
          <p style={{ color: 'var(--color-text-gray)', padding: '20px 0' }}>
            暂无书评
          </p>
        ) : (
          userReviews.map((review) => {
            const book = reviewBooks[review.bookId];
            const colorIndex = book ? book.title.charCodeAt(0) % coverColors.length : 0;
            return (
              <div key={review.id} className="user-review-item">
                <Link to={`/books/${review.bookId}`} className="user-review-thumb">
                  {book ? (
                    <img src={book.coverUrl} alt={book.title} />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: coverColors[colorIndex],
                      }}
                    />
                  )}
                </Link>
                <div className="user-review-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Link
                      to={`/books/${review.bookId}`}
                      style={{ fontWeight: 'bold' }}
                    >
                      {book?.title || '未知书籍'}
                    </Link>
                    <StarRating rating={review.rating} readonly />
                  </div>
                  <p style={{ color: 'var(--color-text-gray)', fontSize: '12px', marginBottom: '8px' }}>
                    {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                  <p>{truncateText(review.content, 100)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isEditing && (
        <div className="edit-modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>编辑资料</h3>
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>头像颜色</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="color"
                  value={newAvatarColor}
                  onChange={(e) => setNewAvatarColor(e.target.value)}
                  style={{ width: '40px', height: '40px', padding: 0, border: 'none', cursor: 'pointer' }}
                />
                <div
                  className="avatar-sm"
                  style={{ background: newAvatarColor }}
                >
                  {newUsername.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'white' }}
                onClick={() => setIsEditing(false)}
              >
                取消
              </button>
              <button
                className="edit-btn"
                style={{ position: 'static' }}
                onClick={handleSaveProfile}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
