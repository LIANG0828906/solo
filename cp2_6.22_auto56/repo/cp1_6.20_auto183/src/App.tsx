import React, { useState, useEffect, useCallback, useRef } from 'react';
import WorldMap from './components/WorldMap';
import CapsuleForm from './components/CapsuleForm';
import CapsuleReveal from './components/CapsuleReveal';
import { Capsule, LatLng, generateUserId, getCurrentCapsuleStatus } from './utils/mapUtils';

interface PendingLocation {
  latLng: LatLng;
  pixel: { x: number; y: number };
  rippleKey: number;
}

const App: React.FC = () => {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(null);
  const [revealCapsule, setRevealCapsule] = useState<Capsule | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isFormFadingOut, setIsFormFadingOut] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const userIdRef = useRef<string>('');
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    userIdRef.current = generateUserId();
    fetchCapsules();
  }, []);

  const showNotice = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotice({ type, message });
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const fetchCapsules = async () => {
    try {
      const res = await fetch('/api/capsules');
      if (!res.ok) throw new Error('Failed to fetch capsules');
      const data = await res.json();
      setCapsules(data.map((c: Capsule) => ({ ...c, status: getCurrentCapsuleStatus(c.openDate) })));
    } catch (err) {
      console.error(err);
      showNotice('error', '加载胶囊数据失败');
    }
  };

  const handleMapClick = useCallback(
    (latLng: LatLng, pixel: { x: number; y: number }) => {
      if (isDiscovering || revealCapsule) return;
      setPendingLocation({ latLng, pixel, rippleKey: Date.now() });
      setTimeout(() => {
        setIsFormVisible(true);
      }, 500);
    },
    [isDiscovering, revealCapsule]
  );

  const handleFormSubmit = async (text: string, imageUrl: string, openDate: string) => {
    if (!pendingLocation) return;

    try {
      setIsFormFadingOut(true);
      const res = await fetch('/api/capsules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: pendingLocation.latLng.lat,
          lng: pendingLocation.latLng.lng,
          text,
          imageUrl,
          openDate: new Date(openDate).toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Failed to plant capsule');
      const newCapsule = await res.json();

      setTimeout(() => {
        setCapsules((prev) => [...prev, { ...newCapsule, status: getCurrentCapsuleStatus(newCapsule.openDate) }]);
        setIsFormVisible(false);
        setIsFormFadingOut(false);
        setPendingLocation(null);
        showNotice('success', '时间胶囊已成功埋下！✨');
      }, 450);
    } catch (err) {
      console.error(err);
      setIsFormFadingOut(false);
      showNotice('error', '埋下胶囊失败，请重试');
    }
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setPendingLocation(null);
  };

  const handleDiscover = async () => {
    if (isDiscovering) return;
    setIsDiscovering(true);
    setRevealCapsule(null);

    try {
      const res = await fetch('/api/capsules/random', {
        headers: { 'x-user-id': userIdRef.current },
      });

      if (!res.ok) {
        if (res.status === 404) {
          showNotice('info', '暂时没有可以发现的胶囊，过一会儿再来看看吧！');
        } else {
          throw new Error('Failed to get random capsule');
        }
        setIsDiscovering(false);
        return;
      }

      const capsule = (await res.json()) as Capsule;
      showNotice('info', '正在前往胶囊位置...');

      setTimeout(() => {
        setRevealCapsule(capsule);
        setIsDiscovering(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsDiscovering(false);
      showNotice('error', '发现胶囊失败，请重试');
    }
  };

  const handleRevealClose = async () => {
    if (revealCapsule) {
      try {
        await fetch(`/api/capsules/${revealCapsule.id}/discover`, {
          method: 'POST',
          headers: { 'x-user-id': userIdRef.current },
        });
        setCapsules((prev) =>
          prev.map((c) =>
            c.id === revealCapsule.id
              ? { ...c, status: 'discovered' as const }
              : c
          )
        );
      } catch (err) {
        console.error(err);
      }
    }
    setRevealCapsule(null);
  };

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(180deg, rgba(245,230,200,0.95) 0%, rgba(245,230,200,0.8) 80%, transparent 100%)',
    backdropFilter: 'blur(8px)',
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#5d6b4f',
  };

  const discoverBtnStyle: React.CSSProperties = {
    padding: '10px 22px',
    border: 'none',
    borderRadius: '8px',
    background: isDiscovering ? 'linear-gradient(135deg, #8a9a7a 0%, #6ba368 100%)' : 'linear-gradient(135deg, #4a7c59 0%, #6ba368 100%)',
    color: '#fafafa',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: isDiscovering ? 'not-allowed' : 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 3px 12px rgba(74,124,89,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    opacity: isDiscovering ? 0.8 : 1,
  };

  const noticeStyle: React.CSSProperties = {
    position: 'fixed',
    top: '70px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    padding: '10px 20px',
    borderRadius: '8px',
    color: '#fafafa',
    fontSize: '0.9rem',
    fontWeight: 500,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    animation: 'fadeInUp 0.3s ease',
    maxWidth: '90%',
    background:
      notice?.type === 'success'
        ? 'linear-gradient(135deg, #4a7c59, #6ba368)'
        : notice?.type === 'error'
        ? 'linear-gradient(135deg, #8b4a4a, #a86868)'
        : 'linear-gradient(135deg, #5d6b4f, #8a9a7a)',
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={headerStyle}>
        <div style={logoStyle}>
          <span style={{ fontSize: '1.6rem' }}>🗺️</span>
          <span>时间胶囊地图</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#8a9a7a', marginLeft: '4px' }}>
            共 {capsules.length} 个胶囊
          </span>
        </div>
        <button
          style={discoverBtnStyle}
          onClick={handleDiscover}
          disabled={isDiscovering}
          onMouseEnter={(e) => !isDiscovering && (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isDiscovering ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⌛</span>
              正在寻找...
            </>
          ) : (
            <>
              <span>✨</span>
              发现时间胶囊
            </>
          )}
        </button>
      </div>

      {notice && <div style={noticeStyle}>{notice.message}</div>}

      <WorldMap
        capsules={capsules}
        onClick={handleMapClick}
        pendingPixel={pendingLocation?.pixel}
        rippleKey={pendingLocation?.rippleKey || 0}
        focusCapsule={revealCapsule}
        isDiscovering={isDiscovering}
      />

      <CapsuleForm
        visible={isFormVisible}
        fadingOut={isFormFadingOut}
        latLng={pendingLocation?.latLng}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />

      <CapsuleReveal
        capsule={revealCapsule}
        onClose={handleRevealClose}
      />
    </div>
  );
};

export default App;
