import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import PoemCard from '@/components/PoemCard';
import type { Poem } from '@/types';
import { api } from '@/utils/api';
import {
  User,
  Edit3,
  LogOut,
  BookOpen,
  Heart,
  Save,
  X,
  Feather,
} from 'lucide-react';

type TabType = 'created' | 'liked';

export default function ProfilePage() {
  const { currentUser, isLoading, logout, updateProfile } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editBio, setEditBio] = useState('');
  const [poems, setPoems] = useState<Poem[]>([]);
  const [likedPoems, setLikedPoems] = useState<Poem[]>([]);
  const [loadingPoems, setLoadingPoems] = useState(false);

  useEffect(() => {
    if (!currentUser && !isLoading) {
      navigate('/login');
    }
  }, [currentUser, isLoading, navigate]);

  const fetchPoems = useCallback(async () => {
    if (!currentUser) return;

    setLoadingPoems(true);
    try {
      if (activeTab === 'created') {
        const data = await api.users.getUserPoems(currentUser.id) as Poem[];
        setPoems(data);
      } else {
        const data = await api.users.getLikedPoems() as Poem[];
        setLikedPoems(data);
      }
    } catch (err) {
      console.error('Failed to fetch poems:', err);
    } finally {
      setLoadingPoems(false);
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (currentUser) {
      fetchPoems();
    }
  }, [currentUser, fetchPoems]);

  const handleEditStart = () => {
    if (currentUser) {
      setEditNickname(currentUser.nickname);
      setEditBio(currentUser.bio);
      setIsEditing(true);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditNickname('');
    setEditBio('');
  };

  const handleEditSave = async () => {
    try {
      await updateProfile({ nickname: editNickname, bio: editBio });
      setIsEditing(false);
    } catch (_err) {
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-3 h-3 bg-green-700 rounded-full animate-pulse-dot [animation-delay:-0.32s]" />
          <span className="w-3 h-3 bg-green-700 rounded-full animate-pulse-dot [animation-delay:-0.16s]" />
          <span className="w-3 h-3 bg-green-700 rounded-full animate-pulse-dot" />
        </div>
      </div>
    );
  }

  const displayPoems = activeTab === 'created' ? poems : likedPoems;

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-soft overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-brown-400 mb-1">
                        昵称
                      </label>
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        className="w-full px-3 py-2 border border-brown-100 rounded-lg text-brown-500 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brown-400 mb-1">
                        个人简介
                      </label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-brown-100 rounded-lg text-brown-500 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 resize-none"
                        placeholder="介绍一下自己吧..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditSave}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-900 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        保存
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="flex items-center gap-1.5 px-4 py-2 bg-brown-100 hover:bg-brown-200 text-brown-400 text-sm font-medium rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h1 className="font-serif text-xl font-bold text-brown-500">
                        {currentUser.nickname}
                      </h1>
                      <button
                        onClick={handleEditStart}
                        className="text-brown-300 hover:text-green-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-brown-300 mt-1">
                      @{currentUser.username}
                    </p>
                    <p className="text-brown-400 mt-3 text-sm leading-relaxed">
                      {currentUser.bio || '这个人很懒，什么都没写...'}
                    </p>
                  </>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 text-red-500 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <div className="flex border-b border-cream-200">
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'created'
                  ? 'text-green-700'
                  : 'text-brown-300 hover:text-brown-400'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              我的创作
              {activeTab === 'created' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-green-700 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'liked'
                  ? 'text-green-700'
                  : 'text-brown-300 hover:text-brown-400'
              }`}
            >
              <Heart className="w-4 h-4" />
              我的喜欢
              {activeTab === 'liked' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-green-700 rounded-full" />
              )}
            </button>
          </div>

          <div className="p-6">
            {loadingPoems ? (
              <div className="flex justify-center py-12">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-green-700 rounded-full animate-pulse-dot [animation-delay:-0.32s]" />
              <span className="w-2 h-2 bg-green-700 rounded-full animate-pulse-dot [animation-delay:-0.16s]" />
              <span className="w-2 h-2 bg-green-700 rounded-full animate-pulse-dot" />
            </div>
              </div>
            ) : displayPoems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayPoems.map((poem, index) => (
                  <PoemCard key={poem.id} poem={poem} index={index} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                <div className="w-16 h-16 bg-cream-200 rounded-full flex items-center justify-center mb-4">
                  {activeTab === 'created' ? (
                    <Feather className="w-8 h-8 text-brown-300" />
                  ) : (
                    <Heart className="w-8 h-8 text-brown-300" />
                  )}
                </div>
                <p className="text-brown-300 text-sm">
                  {activeTab === 'created'
                    ? '还没有创作过诗词'
                    : '还没有喜欢的诗词'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
