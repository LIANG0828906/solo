import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import type { Pet, FriendInfo, InventoryItem, ItemType, InteractionType, CheckInStatus } from './types';
import { generateUserId, interact as localInteract, useItem as localUseItem } from './pet';
import { petApi, friendApi, checkInApi, backpackApi, userApi } from './api';
import { useWebSocket } from './hooks/useWebSocket';
import NavBar from './components/NavBar';
import './App.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const CreatePetPage = lazy(() => import('./pages/CreatePetPage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const FriendDetailPage = lazy(() => import('./pages/FriendDetailPage'));
const CheckInPage = lazy(() => import('./pages/CheckInPage'));
const BackpackPage = lazy(() => import('./pages/BackpackPage'));

type PageType = 'home' | 'create' | 'friends' | 'friendDetail' | 'checkin' | 'backpack';

const USER_ID_KEY = 'pet_station_user_id';
const PET_KEY = 'pet_station_pet';

const App = function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [userId, setUserId] = useState<string>('');
  const [pet, setPet] = useState<Pet | null>(null);
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [friendRequests, setFriendRequests] = useState<Array<{ id: string; petName: string; petColor: string }>>([]);
  const [backpack, setBackpack] = useState<InventoryItem[]>([]);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>({
    todayChecked: false,
    streak: 0,
    lastDate: null,
  });
  const [friendliness, setFriendliness] = useState(0);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [selectedFriend, setSelectedFriend] = useState<FriendInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isConnected, connect, disconnect } = useWebSocket();

  useEffect(() => {
    const savedUserId = localStorage.getItem(USER_ID_KEY);
    const savedPet = localStorage.getItem(PET_KEY);

    if (savedUserId) {
      setUserId(savedUserId);
      if (savedPet) {
        try {
          const parsedPet = JSON.parse(savedPet) as Pet;
          setPet(parsedPet);
        } catch (e) {
          console.error('解析宠物数据失败', e);
        }
      }
    } else {
      const newUserId = generateUserId();
      setUserId(newUserId);
      localStorage.setItem(USER_ID_KEY, newUserId);
      setCurrentPage('create');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (userId && pet) {
      connect(userId);
      loadUserData();
    }
    return () => {
      disconnect();
    };
  }, [userId, pet?.id]);

  const loadUserData = useCallback(async () => {
    if (!userId) return;

    try {
      const [userInfo, friendsList, requests, backpackItems, checkIn] = await Promise.all([
        userApi.getInfo(userId),
        friendApi.getFriends(userId),
        friendApi.getRequests(userId),
        backpackApi.getItems(userId),
        checkInApi.getStatus(userId),
      ]);

      setPet(userInfo.pet);
      setFriends(friendsList);
      setFriendRequests(requests);
      setBackpack(backpackItems);
      setCheckInStatus(checkIn);
      setFriendliness(userInfo.friendliness);

      localStorage.setItem(PET_KEY, JSON.stringify(userInfo.pet));
    } catch (e) {
      console.error('加载用户数据失败:', e);
    }
  }, [userId]);

  const handleCreatePet = useCallback(async (name: string, color: string) => {
    try {
      const result = await petApi.create(name, color, userId);
      setPet(result.pet);
      localStorage.setItem(PET_KEY, JSON.stringify(result.pet));
      setCurrentPage('home');
      connect(userId);
    } catch (e) {
      console.error('创建宠物失败:', e);
    }
  }, [userId, connect]);

  const handleInteract = useCallback(async (type: InteractionType) => {
    if (!pet || pet.isSick) return;

    const optimisticStats = localInteract(pet.stats, type);
    setPet({ ...pet, stats: optimisticStats });

    try {
      const result = await petApi.interact(userId, type);
      setPet(prev => prev ? { ...prev, stats: result.stats, isSick: result.isSick } : null);
      localStorage.setItem(PET_KEY, JSON.stringify({ ...pet, stats: result.stats, isSick: result.isSick }));
    } catch (e) {
      setPet(pet);
      console.error('交互失败:', e);
      throw e;
    }
  }, [pet, userId]);

  const handleUseItem = useCallback(async (itemType: ItemType): Promise<boolean> => {
    if (!pet || pet.isSick) return false;

    const item = backpack.find(i => i.type === itemType);
    if (!item || item.quantity <= 0) return false;

    const optimisticStats = localUseItem(pet.stats, itemType);
    setPet({ ...pet, stats: optimisticStats });
    setBackpack(prev =>
      prev.map(i =>
        i.type === itemType ? { ...i, quantity: i.quantity - 1 } : i
      ).filter(i => i.quantity > 0)
    );

    try {
      const result = await petApi.useItem(userId, itemType);
      setPet(prev => prev ? { ...prev, stats: result.stats, isSick: result.isSick } : null);
      localStorage.setItem(PET_KEY, JSON.stringify({ ...pet, stats: result.stats, isSick: result.isSick }));
      return true;
    } catch (e) {
      setPet(pet);
      setBackpack(prev => {
        const existing = prev.find(i => i.type === itemType);
        if (existing) {
          return prev.map(i => i.type === itemType ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { id: Date.now().toString(), type: itemType, quantity: 1 }];
      });
      console.error('使用道具失败:', e);
      return false;
    }
  }, [pet, userId, backpack]);

  const handleSendFriendRequest = useCallback(async (toId: string): Promise<boolean> => {
    try {
      const result = await friendApi.sendRequest(userId, toId);
      return result.success;
    } catch (e) {
      console.error('发送好友申请失败:', e);
      return false;
    }
  }, [userId]);

  const handleAcceptFriendRequest = useCallback(async (friendId: string): Promise<boolean> => {
    try {
      const result = await friendApi.acceptRequest(userId, friendId);
      if (result.success) {
        setFriendRequests(prev => prev.filter(r => r.id !== friendId));
        loadUserData();
      }
      return result.success;
    } catch (e) {
      console.error('接受好友申请失败:', e);
      return false;
    }
  }, [userId, loadUserData]);

  const handleViewFriend = useCallback(async (friendId: string) => {
    setSelectedFriendId(friendId);
    setCurrentPage('friendDetail');

    try {
      const friend = await friendApi.getFriendDetail(userId, friendId);
      setSelectedFriend(friend);
    } catch (e) {
      console.error('获取好友详情失败:', e);
    }
  }, [userId]);

  const handleHelpFriend = useCallback(async (type: InteractionType) => {
    if (!selectedFriendId || !selectedFriend) return;

    const increaseAmount = 10;
    const newStats = { ...selectedFriend.stats };
    switch (type) {
      case 'feed':
        newStats.hunger = Math.min(100, newStats.hunger + increaseAmount);
        break;
      case 'clean':
        newStats.cleanliness = Math.min(100, newStats.cleanliness + increaseAmount);
        break;
      case 'play':
        newStats.happiness = Math.min(100, newStats.happiness + increaseAmount);
        break;
    }
    setSelectedFriend({ ...selectedFriend, stats: newStats });
    setFriendliness(prev => prev + 1);

    try {
      const result = await friendApi.helpFriend(userId, selectedFriendId, type);
      setFriendliness(result.friendliness);
    } catch (e) {
      console.error('帮助好友失败:', e);
    }
  }, [selectedFriendId, selectedFriend, userId]);

  const handleCheckIn = useCallback(async () => {
    try {
      const result = await checkInApi.checkIn(userId);
      setCheckInStatus(prev => ({
        ...prev,
        todayChecked: true,
        streak: result.streak,
      }));

      const updatedBackpack = await backpackApi.getItems(userId);
      setBackpack(updatedBackpack);

      return result;
    } catch (e) {
      console.error('签到失败:', e);
      return null;
    }
  }, [userId]);

  const handleRefreshFriends = useCallback(() => {
    loadUserData();
  }, [loadUserData]);

  const handleBackFromFriend = useCallback(() => {
    setCurrentPage('friends');
    setSelectedFriend(null);
    setSelectedFriendId('');
  }, []);



  const renderPage = () => {
    const fallback = (
      <div className="page-loading">
        <div className="loading-spinner" />
        <span>加载中...</span>
      </div>
    );

    switch (currentPage) {
      case 'create':
        return (
          <Suspense fallback={fallback}>
            <CreatePetPage onCreate={handleCreatePet} />
          </Suspense>
        );
      case 'home':
        if (!pet) return fallback;
        return (
          <Suspense fallback={fallback}>
            <HomePage pet={pet} userId={userId} onInteract={handleInteract} />
          </Suspense>
        );
      case 'friends':
        return (
          <Suspense fallback={fallback}>
            <FriendsPage
              userId={userId}
              friends={friends}
              onRefresh={handleRefreshFriends}
              onViewFriend={handleViewFriend}
              onSendRequest={handleSendFriendRequest}
              friendRequests={friendRequests}
              onAcceptRequest={handleAcceptFriendRequest}
            />
          </Suspense>
        );
      case 'friendDetail':
        return (
          <Suspense fallback={fallback}>
            <FriendDetailPage
              friend={selectedFriend}
              onBack={handleBackFromFriend}
              onHelp={handleHelpFriend}
            />
          </Suspense>
        );
      case 'checkin':
        return (
          <Suspense fallback={fallback}>
            <CheckInPage status={checkInStatus} onCheckIn={handleCheckIn} />
          </Suspense>
        );
      case 'backpack':
        if (!pet) return fallback;
        return (
          <Suspense fallback={fallback}>
            <BackpackPage
              items={backpack}
              onUseItem={handleUseItem}
              petStats={pet.stats}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <div className="app">
      {pet && currentPage !== 'create' && currentPage !== 'friendDetail' && (
        <NavBar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          friendliness={friendliness}
        />
      )}
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
