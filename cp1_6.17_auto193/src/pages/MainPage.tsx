import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  User,
  LogOut,
  ChevronRight,
  Star,
  Trash2,
  Eye,
  EyeOff,
  Navigation,
  Share2,
  Menu,
  X,
  Copy,
  Check,
  LogIn,
} from 'lucide-react';
import L from 'leaflet';
import axios from 'axios';
import MapView from '@/components/MapView';
import AudioRecorder from '@/components/AudioRecorder';
import { useMarkerStore, Marker } from '@/stores/markerStore';
import { encodeShareLink, decodeShareLink } from '@/utils/shareLink';

interface RecommendedMarker extends Marker {
  distance: number;
}

export default function MainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);

  const {
    markers,
    loadMarkers,
    isCreatingMode,
    setCreatingMode,
    pendingLatLng,
    userName,
    userId,
    login,
    logout,
    deleteMarker,
    togglePublic,
    toggleFavorite,
    favorites,
    recentPlayedStyles,
    playingMarkerId,
  } = useMarkerStore();

  const [recommendations, setRecommendations] = useState<RecommendedMarker[]>([]);
  const [sharedMarkerIds, setSharedMarkerIds] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showRecommendDrawer, setShowRecommendDrawer] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [profileTab, setProfileTab] = useState<'mine' | 'favorites'>('mine');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const userLocationRef = useRef<{ lat: number; lng: number }>({ lat: 39.9042, lng: 116.4074 });

  useEffect(() => {
    loadMarkers();
  }, [loadMarkers]);

  useEffect(() => {
    const shareParam = searchParams.get('share');
    if (shareParam) {
      const decoded = decodeShareLink(shareParam);
      if (decoded) {
        setSharedMarkerIds(decoded.markerIds);
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.flyTo(
              [decoded.centerLat, decoded.centerLng],
              decoded.zoom,
              { duration: 1 }
            );
          }
        }, 500);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    userLocationRef.current = {
      lat: map.getCenter().lat,
      lng: map.getCenter().lng,
    };
    map.on('moveend', () => {
      userLocationRef.current = {
        lat: map.getCenter().lat,
        lng: map.getCenter().lng,
      };
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchRecommendations = async () => {
      if (!mapRef.current) return;
      const center = mapRef.current.getCenter();
      try {
        const res = await axios.post('/api/recommend', {
          userLat: center.lat,
          userLng: center.lng,
          recentStyles: recentPlayedStyles,
          radiusKm: 2,
          maxDistance: 3,
          limit: 3,
        });
        if (!cancelled && res.data.success) {
          setRecommendations(res.data.data as RecommendedMarker[]);
        }
      } catch {
        if (!cancelled) {
          setRecommendations([]);
        }
      }
    };
    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [recentPlayedStyles, markers.length, playingMarkerId]);

  const navigateToMarker = (marker: Marker) => {
    if (mapRef.current) {
      mapRef.current.flyTo([marker.lat, marker.lng], 15, {
        duration: 0.8,
        easeLinearity: 0.25,
      });
    }
    setShowRecommendDrawer(false);
  };

  const handleCreateClick = () => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }
    setCreatingMode(!isCreatingMode);
  };

  const handleLogin = () => {
    if (loginName.trim()) {
      login(loginName.trim());
      setShowLoginModal(false);
      setLoginName('');
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setShowProfile(false);
  };

  const generateShareLink = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    const publicIds = markers.filter((m) => m.creatorId === userId && m.isPublic).map((m) => m.id);
    if (publicIds.length === 0) {
      alert('您还没有公开的语音标记点');
      return;
    }
    const code = encodeShareLink({
      centerLat: center.lat,
      centerLng: center.lng,
      zoom,
      markerIds: publicIds,
    });
    const url = `${window.location.origin}${window.location.pathname}?share=${code}`;
    setShareCode(url);
    setShowShareModal(true);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const myMarkers = markers.filter((m) => m.creatorId === userId);
  const favoriteMarkers = markers.filter((m) => favorites.includes(m.id));

  const RecommendPanel = (
    <div
      className={`flex flex-col ${
        isDesktop
          ? 'h-full'
          : 'h-[60vh] rounded-t-2xl overflow-hidden'
      }`}
      style={{
        background: 'rgba(15, 52, 96, 0.92)',
        backdropFilter: 'blur(8px)',
        boxShadow: isDesktop ? '4px 0 20px rgba(0,0,0,0.3)' : '0 -4px 20px rgba(0,0,0,0.4)',
        borderRight: isDesktop ? '1px solid rgba(233, 69, 96, 0.2)' : 'none',
      }}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <MapPin size={18} className="text-[#E94560]" />
          附近推荐
        </h2>
        {!isDesktop && (
          <button
            onClick={() => setShowRecommendDrawer(false)}
            className="p-1 rounded hover:bg-white/10 btn-hover"
          >
            <X size={18} className="text-white/70" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {recommendations.length === 0 ? (
          <div className="text-center text-white/50 text-sm py-8">
            <MapPin size={32} className="mx-auto mb-2 opacity-30" />
            <p>暂无附近推荐</p>
            <p className="text-xs mt-1">移动地图或播放语音获取推荐</p>
          </div>
        ) : (
          recommendations.map((marker) => (
            <div
              key={marker.id}
              className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(42, 42, 74, 0.8)',
                border: '1px solid rgba(233, 69, 96, 0.2)',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate flex items-center gap-1">
                    {marker.isFavorited && <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />}
                    <span>{marker.name}</span>
                  </h3>
                  <p className="text-xs text-white/60 truncate mt-0.5">
                    {marker.note || '暂无备注'}
                  </p>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2"
                  style={{
                    background: 'rgba(233, 69, 96, 0.2)',
                    color: '#FF6B81',
                  }}
                >
                  {marker.distance < 1000 ? `${marker.distance}m` : `${(marker.distance / 1000).toFixed(1)}km`}
                </span>
              </div>

              <button
                onClick={() => navigateToMarker(marker)}
                className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 btn-hover"
                style={{
                  background: 'linear-gradient(135deg, #E94560, #FF6B81)',
                  color: 'white',
                }}
              >
                <Navigation size={12} />
                导航至此
                <ChevronRight size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full flex overflow-hidden" style={{ background: '#1A1A2E' }}>
      {isDesktop && (
        <div className="w-[300px] shrink-0 panel-slide-in-left z-10">
          {RecommendPanel}
        </div>
      )}

      <div className="flex-1 relative min-w-0">
        <MapView
          sharedMarkerIds={sharedMarkerIds}
          onMapReady={handleMapReady}
        />

        <button
          onClick={handleCreateClick}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center btn-hover z-[1000] animate-pulse-glow"
          style={{
            background: isCreatingMode
              ? 'linear-gradient(135deg, #FF6B81, #FFD700)'
              : 'linear-gradient(135deg, #E94560, #FF6B81)',
            color: 'white',
          }}
          title={isCreatingMode ? '取消创建' : userId ? '创建语音标记' : '请先登录'}
        >
          {isCreatingMode ? (
            <X size={24} />
          ) : (
            <MapPin size={24} />
          )}
        </button>

        {!isDesktop && (
          <button
            onClick={() => setShowRecommendDrawer(true)}
            className="absolute left-4 top-4 w-10 h-10 rounded-full flex items-center justify-center btn-hover z-[1000]"
            style={{
              background: 'rgba(15, 52, 96, 0.9)',
              border: '1px solid rgba(233, 69, 96, 0.3)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            <Menu size={18} />
          </button>
        )}

        <div className="absolute right-4 top-4 z-[1000] flex items-center gap-2">
          {userId && (
            <button
              onClick={generateShareLink}
              className="w-10 h-10 rounded-full flex items-center justify-center btn-hover"
              style={{
                background: 'rgba(15, 52, 96, 0.9)',
                border: '1px solid rgba(233, 69, 96, 0.3)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              }}
              title="生成分享链接"
            >
              <Share2 size={18} />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => userName ? setShowUserMenu(!showUserMenu) : setShowLoginModal(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm btn-hover"
              style={{
                background: userName
                  ? 'linear-gradient(135deg, #E94560, #FF6B81)'
                  : 'rgba(15, 52, 96, 0.9)',
                color: 'white',
                border: userName ? 'none' : '1px solid rgba(233, 69, 96, 0.4)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              }}
            >
              {userName ? (
                userName.charAt(0).toUpperCase()
              ) : (
                <User size={16} />
              )}
            </button>

            {showUserMenu && userName && (
              <div
                className="absolute right-0 top-12 w-48 rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(15, 52, 96, 0.97)',
                  border: '1px solid rgba(233, 69, 96, 0.3)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                  animation: 'fade-in 0.2s ease',
                }}
              >
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-semibold text-white">{userName}</p>
                  <p className="text-xs text-white/50 mt-0.5">ID: {userId?.slice(-6) || ''}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfile(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-[#E94560] hover:text-white transition-colors flex items-center gap-2"
                >
                  <User size={14} />
                  个人中心
                </button>
                <button
                  onClick={generateShareLink}
                  className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-[#E94560] hover:text-white transition-colors flex items-center gap-2 border-t border-white/5"
                >
                  <Share2 size={14} />
                  分享我的地图
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-300 hover:bg-red-500/20 transition-colors flex items-center gap-2 border-t border-white/5"
                >
                  <LogOut size={14} />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>

        {isCreatingMode && !pendingLatLng && (
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-medium z-[1000] pointer-events-none"
            style={{
              background: 'rgba(15, 52, 96, 0.95)',
              border: '1px solid rgba(233, 69, 96, 0.4)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(233, 69, 96, 0.3)',
              animation: 'fade-in 0.3s ease',
            }}
          >
            📍 点击地图任意位置创建语音标记点
          </div>
        )}
      </div>

      {pendingLatLng && (
        <AudioRecorder mode="create" onClose={() => setCreatingMode(false)} />
      )}

      {!isDesktop && showRecommendDrawer && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[1002]"
            onClick={() => setShowRecommendDrawer(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[1003] panel-slide-in-bottom">
            {RecommendPanel}
          </div>
        </>
      )}

      {showProfile && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[1002]"
            onClick={() => setShowProfile(false)}
          />
          <div
            className={`fixed top-0 right-0 h-full z-[1003] ${
              isDesktop ? 'w-[420px]' : 'w-full'
            } panel-slide-in-right`}
            style={{
              background: 'rgba(15, 52, 96, 0.98)',
              backdropFilter: 'blur(10px)',
              boxShadow: '-4px 0 30px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">个人中心</h2>
                <button
                  onClick={() => setShowProfile(false)}
                  className="p-2 rounded-lg hover:bg-white/10 btn-hover"
                >
                  <X size={20} className="text-white/80" />
                </button>
              </div>

              <div className="flex border-b border-white/10 mx-5">
                <button
                  onClick={() => setProfileTab('mine')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                    profileTab === 'mine' ? 'text-white' : 'text-white/50'
                  }`}
                >
                  我的标记 ({myMarkers.length})
                  {profileTab === 'mine' && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: 'linear-gradient(90deg, #E94560, #FF6B81)' }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setProfileTab('favorites')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                    profileTab === 'favorites' ? 'text-white' : 'text-white/50'
                  }`}
                >
                  我的收藏 ({favoriteMarkers.length})
                  {profileTab === 'favorites' && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: 'linear-gradient(90deg, #E94560, #FF6B81)' }}
                    />
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {profileTab === 'mine' && myMarkers.length === 0 && (
                  <div className="text-center text-white/50 py-12">
                    <MapPin size={40} className="mx-auto mb-3 opacity-30" />
                    <p>还没有创建标记点</p>
                    <p className="text-xs mt-1">点击地图下方的按钮开始创建</p>
                  </div>
                )}

                {profileTab === 'mine' &&
                  myMarkers.map((marker) => (
                    <div
                      key={marker.id}
                      className="p-3 rounded-xl"
                      style={{
                        background: 'rgba(42, 42, 74, 0.7)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white truncate">
                            {marker.name}
                          </h3>
                          <p className="text-xs text-white/50 mt-0.5">
                            {new Date(marker.createdAt).toLocaleString('zh-CN')}
                          </p>
                          {marker.note && (
                            <p className="text-xs text-white/60 truncate mt-1">
                              {marker.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => togglePublic(marker.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 btn-hover"
                            title={marker.isPublic ? '设为私密' : '设为公开'}
                          >
                            {marker.isPublic ? (
                              <Eye size={14} className="text-green-400" />
                            ) : (
                              <EyeOff size={14} className="text-white/50" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('确定删除这个标记点？')) {
                                deleteMarker(marker.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 btn-hover"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-white/50">
                            {marker.isPublic ? '公开' : '私密'}
                          </label>
                          <div
                            className="relative w-12 h-6 rounded-full cursor-pointer transition-colors"
                            style={{
                              background: marker.isPublic
                                ? 'linear-gradient(135deg, #10B981, #34D399)'
                                : 'linear-gradient(135deg, #4B5563, #6B7280)',
                            }}
                            onClick={() => togglePublic(marker.id)}
                          >
                            <div
                              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all"
                              style={{
                                left: marker.isPublic ? '26px' : '2px',
                              }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => navigateToMarker(marker)}
                          className="text-xs text-[#FF6B81] hover:text-[#E94560] flex items-center gap-0.5"
                        >
                          查看
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                {profileTab === 'favorites' && favoriteMarkers.length === 0 && (
                  <div className="text-center text-white/50 py-12">
                    <Star size={40} className="mx-auto mb-3 opacity-30" />
                    <p>还没有收藏标记点</p>
                    <p className="text-xs mt-1">点击标记点卡片上的星标收藏</p>
                  </div>
                )}

                {profileTab === 'favorites' &&
                  favoriteMarkers.map((marker) => (
                    <div
                      key={marker.id}
                      className="p-3 rounded-xl"
                      style={{
                        background: 'rgba(42, 42, 74, 0.7)',
                        border: '1px solid rgba(255,215,0,0.15)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white truncate flex items-center gap-1">
                            <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
                            {marker.name}
                          </h3>
                          {marker.note && (
                            <p className="text-xs text-white/60 truncate mt-1">
                              {marker.note}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => toggleFavorite(marker.id)}
                          className="p-1.5 rounded-lg hover:bg-yellow-500/20 btn-hover"
                        >
                          <Star
                            size={14}
                            className="text-yellow-400 fill-yellow-400"
                          />
                        </button>
                      </div>
                      <button
                        onClick={() => navigateToMarker(marker)}
                        className="w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 btn-hover"
                        style={{
                          background: 'linear-gradient(135deg, #E94560, #FF6B81)',
                          color: 'white',
                        }}
                      >
                        <Navigation size={12} />
                        导航至此
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}

      {showLoginModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[1004]"
            onClick={() => setShowLoginModal(false)}
          />
          <div
            className="fixed inset-0 flex items-center justify-center z-[1005] p-4"
          >
            <div
              className="w-full max-w-sm p-6 rounded-2xl"
              style={{
                background: 'rgba(15, 52, 96, 0.98)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(233, 69, 96, 0.3)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                animation: 'fade-in 0.3s ease',
              }}
            >
              <div className="text-center mb-5">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #E94560, #FF6B81)' }}
                >
                  <LogIn size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">欢迎使用语音地图</h2>
                <p className="text-sm text-white/60 mt-1">输入用户名即可开始体验</p>
              </div>

              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="请输入用户名"
                className="w-full h-12 px-4 rounded-xl text-white placeholder-white/40 outline-none mb-4 text-base"
                style={{
                  background: 'rgba(42, 42, 74, 0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 h-11 rounded-xl text-white/80 font-medium btn-hover"
                  style={{ background: 'rgba(42, 42, 74, 0.8)' }}
                >
                  取消
                </button>
                <button
                  onClick={handleLogin}
                  disabled={!loginName.trim()}
                  className="flex-1 h-11 rounded-xl text-white font-medium btn-hover disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #E94560, #FF6B81)',
                    boxShadow: '0 4px 15px rgba(233,69,96,0.4)',
                  }}
                >
                  登录
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showShareModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[1004]"
            onClick={() => setShowShareModal(false)}
          />
          <div
            className="fixed inset-0 flex items-center justify-center z-[1005] p-4"
          >
            <div
              className="w-full max-w-md p-6 rounded-2xl"
              style={{
                background: 'rgba(15, 52, 96, 0.98)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(233, 69, 96, 0.3)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                animation: 'fade-in 0.3s ease',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Share2 size={20} className="text-[#E94560]" />
                  分享语音地图
                </h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 btn-hover"
                >
                  <X size={18} className="text-white/80" />
                </button>
              </div>

              <p className="text-sm text-white/60 mb-3">
                复制链接分享给他人，对方打开后将自动定位到您的地图区域并高亮显示您的标记点
              </p>

              <div
                className="p-3 rounded-xl mb-4 break-all text-xs"
                style={{
                  background: 'rgba(42, 42, 74, 0.8)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#FF6B81',
                  fontFamily: 'monospace',
                  maxHeight: '120px',
                  overflow: 'auto',
                }}
              >
                {shareCode}
              </div>

              <button
                onClick={copyShareLink}
                className="w-full h-11 rounded-xl text-white font-medium btn-hover flex items-center justify-center gap-2"
                style={{
                  background: copied
                    ? 'linear-gradient(135deg, #10B981, #34D399)'
                    : 'linear-gradient(135deg, #E94560, #FF6B81)',
                  boxShadow: copied
                    ? '0 4px 15px rgba(16,185,129,0.4)'
                    : '0 4px 15px rgba(233,69,96,0.4)',
                }}
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    复制链接
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
