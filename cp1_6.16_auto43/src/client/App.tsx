import React, { useState, useEffect, useCallback } from 'react';
import { SeedItem } from '../types';
import { api } from './api';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import PublishModal from './components/PublishModal';
import ExchangeDialog from './components/ExchangeDialog';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'profile'>('home');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [exchangeItem, setExchangeItem] = useState<SeedItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('seedExchangeUser');
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  const handleLogin = useCallback(async (nickname: string) => {
    const result = await api.login(nickname);
    if (result.success) {
      setCurrentUser(result.nickname);
      localStorage.setItem('seedExchangeUser', result.nickname);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('seedExchangeUser');
    setCurrentPage('home');
  }, []);

  const handlePublish = useCallback(async (item: Omit<SeedItem, 'id' | 'createdAt'>) => {
    await api.createItem(item);
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleExchange = useCallback((item: SeedItem) => {
    setExchangeItem(item);
  }, []);

  const handleConfirmExchange = useCallback(async (itemId: string, quantity: number) => {
    if (!currentUser) return;
    await api.createRequest({
      fromUser: currentUser,
      seedItemId: itemId,
      exchangeQuantity: quantity,
    });
    setRefreshKey(prev => prev + 1);
    setExchangeItem(null);
  }, [currentUser]);

  const handleCancelRequest = useCallback(async (id: string) => {
    await api.cancelRequest(id);
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleConfirmRequest = useCallback(async (id: string) => {
    await api.confirmRequest(id);
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleRejectRequest = useCallback(async (id: string) => {
    await api.rejectRequest(id);
    setRefreshKey(prev => prev + 1);
  }, []);

  if (!currentUser) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <>
      <Header
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onPublish={() => setShowPublishModal(true)}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {currentPage === 'home' ? (
          <HomePage
            key={`home-${refreshKey}`}
            currentUser={currentUser}
            onExchange={handleExchange}
          />
        ) : (
          <ProfilePage
            key={`profile-${refreshKey}`}
            currentUser={currentUser}
            onCancelRequest={handleCancelRequest}
            onConfirmRequest={handleConfirmRequest}
            onRejectRequest={handleRejectRequest}
          />
        )}
      </main>

      {showPublishModal && (
        <PublishModal
          currentUser={currentUser}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublish}
        />
      )}

      {exchangeItem && (
        <ExchangeDialog
          item={exchangeItem}
          currentUser={currentUser}
          onClose={() => setExchangeItem(null)}
          onConfirm={handleConfirmExchange}
        />
      )}
    </>
  );
};

export default App;
