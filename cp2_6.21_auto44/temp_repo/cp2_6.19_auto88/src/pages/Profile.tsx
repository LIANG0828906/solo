import { useEffect } from 'react';
import UserProfile from '../components/UserProfile';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { useUiController as useStore } from '../module3/uiController';
import * as db from '../utils/db';

export default function Profile() {
  const {
    currentUser,
    userRecipes,
    userFavorites,
    toast,
    initUser,
    loadUserProfile,
    hideToast,
    setCurrentUser,
    showToast,
  } = useStore();

  useEffect(() => {
    if (!currentUser) {
      initUser();
    } else {
      loadUserProfile(currentUser.id);
    }
  }, [currentUser, initUser, loadUserProfile]);

  const handleEditNickname = async (newNickname: string) => {
    if (!currentUser) return;
    try {
      const updatedUser = { ...currentUser, nickname: newNickname };
      await db.update('users', currentUser.id, updatedUser);
      setCurrentUser(updatedUser);
      showToast('昵称修改成功', 'success');
    } catch (error) {
      console.error('Failed to update nickname:', error);
      showToast('修改失败', 'error');
    }
  };

  const handleAvatarChange = async (avatarUrl: string) => {
    if (!currentUser) return;
    try {
      const updatedUser = { ...currentUser, avatar: avatarUrl };
      await db.update('users', currentUser.id, updatedUser);
      setCurrentUser(updatedUser);
      showToast('头像更新成功', 'success');
    } catch (error) {
      console.error('Failed to update avatar:', error);
      showToast('更新失败', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      
      <main className="px-4 pt-24 pb-8">
        {currentUser ? (
          <UserProfile
            user={currentUser}
            userRecipes={userRecipes}
            userFavorites={userFavorites}
            onEditNickname={handleEditNickname}
            onAvatarChange={handleAvatarChange}
          />
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="card p-12 text-center">
              <div className="animate-pulse">
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4" />
                <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto" />
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
