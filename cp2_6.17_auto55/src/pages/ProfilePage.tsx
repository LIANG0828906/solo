import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    <div className="page-container profile