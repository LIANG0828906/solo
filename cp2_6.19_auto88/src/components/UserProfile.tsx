import { useState, useRef } from 'react';
import { Camera, Pencil, ChefHat, Heart } from 'lucide-react';
import type { User, Recipe } from '../types';
import { generateGradientFromHash } from '../utils/colorGenerator';
import RecipeCard from './RecipeCard';
import EmptyState from './EmptyState';

interface UserProfileProps {
  user: User;
  userRecipes: Recipe[];
  userFavorites: Recipe[];
  onEditNickname?: (newNickname: string) => void;
  onAvatarChange?: (avatarUrl: string) => void;
}

type TabType = 'recipes' | 'favorites';

export default function UserProfile({
  user,
  userRecipes,
  userFavorites,
  onEditNickname,
  onAvatarChange,
}: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<TabType>('recipes');
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(user.nickname);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gradient = generateGradientFromHash(user.id);

  const handleAvatarClick = () => {
    if (onAvatarChange) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarChange) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAvatarChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNicknameSubmit = () => {
    if (onEditNickname && nickname.trim()) {
      onEditNickname(nickname.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNicknameSubmit();
    } else if (e.key === 'Escape') {
      setNickname(user.nickname);
      setIsEditing(false);
    }
  };

  const currentItems = activeTab === 'recipes' ? userRecipes : userFavorites;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center text-white text-3xl md:text-4xl font-bold cursor-pointer transition-transform hover:scale-105 overflow-hidden"
              style={{ background: user.avatar || gradient.gradient }}
              onClick={handleAvatarClick}
            >
              {!user.avatar && user.nickname.charAt(0).toUpperCase()}
            </div>
            {onAvatarChange && (
              <>
                <button
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-lg hover:bg-[#E55A2B] transition-colors"
                  onClick={handleAvatarClick}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              {isEditing ? (
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onBlur={handleNicknameSubmit}
                  onKeyDown={handleKeyDown}
                  className="input text-2xl font-bold text-center md:text-left"
                  autoFocus
                />
              ) : (
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                  {user.nickname}
                </h1>
              )}
              {onEditNickname && !isEditing && (
                <button
                  className="p-1 hover:bg-[var(--bg)] rounded transition-colors"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              )}
            </div>
            <div className="flex justify-center md:justify-start gap-6 text-[var(--text-secondary)]">
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--primary)]">{userRecipes.length}</p>
                <p className="text-sm">食谱</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--primary)]">{userFavorites.length}</p>
                <p className="text-sm">收藏</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs px-6 pt-4">
          <button
            className={`tab-item flex items-center gap-2 ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            <ChefHat className="w-4 h-4" />
            我的食谱
          </button>
          <button
            className={`tab-item flex items-center gap-2 ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart className="w-4 h-4" />
            我的收藏
          </button>
        </div>

        <div
          className="tab-content px-6 pb-6"
          style={{
            transition: 'transform 300ms ease-out, opacity 300ms ease-out',
          }}
        >
          {currentItems.length === 0 ? (
            <EmptyState
              icon={activeTab === 'recipes' ? <ChefHat className="empty-state-icon" /> : <Heart className="empty-state-icon" />}
              title={activeTab === 'recipes' ? '还没有创建食谱' : '还没有收藏食谱'}
              description={activeTab === 'recipes' ? '快去创建你的第一个美食食谱吧！' : '浏览食谱并收藏你喜欢的美食吧！'}
            />
          ) : (
            <div className="masonry-grid">
              {currentItems.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
