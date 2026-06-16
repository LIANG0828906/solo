import { useMemo } from 'react';
import { Locate, Search, Filter } from 'lucide-react';
import { useScentStore } from '../store';
import { EMOTION_COLORS } from '../types';
import type { ScentMarker } from '../types';

const MemoryPanel = () => {
  const markers = useScentStore((s) => s.markers);
  const visibleMarkers = useScentStore((s) => s.getVisibleMarkers());
  const selectedId = useScentStore((s) => s.selectedId);
  const selectMarker = useScentStore((s) => s.selectMarker);
  const setPendingMarker = useScentStore((s) => s.setPendingMarker);
  const setCardOpen = useScentStore((s) => s.setCardOpen);
  const searchQuery = useScentStore((s) => s.searchQuery);
  const setSearchQuery = useScentStore((s) => s.setSearchQuery);
  const toggleFilterPanel = useScentStore((s) => s.toggleFilterPanel);
  const filters = useScentStore((s) => s.filters);

  const sortedMarkers = useMemo(() => {
    return [...visibleMarkers].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [visibleMarkers]);

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPendingMarker({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setCardOpen(true);
        },
        () => {
          alert('无法获取您的位置，请在地图上手动点击选择位置。');
        }
      );
    } else {
      alert('您的浏览器不支持地理定位。');
    }
  };

  const handleSelect = (marker: ScentMarker) => {
    selectMarker(marker.id);
    setPendingMarker(null);
    setCardOpen(true);
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.emotions.length > 0;

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      left: 20,
      width: 320,
      maxHeight: 'calc(100vh - 40px)',
      background: 'rgba(26, 26, 46, 0.75)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 16,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
    }} className="scent-panel-desktop">
      <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <div>
            <div style={{
              color: '#E0D9CF',
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}>
              气味记忆
            </div>
            <div style={{
              color: 'rgba(224, 217, 207, 0.5)',
              fontSize: 11, marginTop: 2,
              letterSpacing: 0.3,
            }}>
              {sortedMarkers.length} 条记忆 · 共 {markers.length} 条
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={toggleFilterPanel}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: hasActiveFilters
                  ? 'linear-gradient(135deg, #E94560, #FF6B6B)'
                  : 'rgba(255,255,255,0.06)',
                border: 'none',
                color: hasActiveFilters ? 'white' : 'rgba(224, 217, 207, 0.8)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
              title="筛选"
            >
              <Filter size={16} />
            </button>
            <button
              onClick={handleLocate}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: 'rgba(224, 217, 207, 0.8)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
              title="定位当前位置"
            >
              <Locate size={16} />
            </button>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(224, 217, 207, 0.4)',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索气味记忆..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              color: '#E0D9CF',
              fontSize: 13,
              outline: 'none',
              transition: 'all 0.3s ease',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = '#E94560';
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          />
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0',
      }} className="scent-custom-scrollbar">
        {sortedMarkers.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center',
            color: 'rgba(224, 217, 207, 0.4)',
            fontSize: 13, lineHeight: 1.6,
          }}>
            {searchQuery || hasActiveFilters
              ? '没有找到匹配的记忆'
              : '点击地图上的任意位置\n开始记录你的气味记忆'}
          </div>
        ) : (
          sortedMarkers.map((marker) => {
            const isSelected = marker.id === selectedId;
            const color = EMOTION_COLORS[marker.emotionTag];
            return (
              <div
                key={marker.id}
                onClick={() => handleSelect(marker)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: isSelected ? 'rgba(233, 69, 96, 0.12)' : 'transparent',
                  borderLeft: isSelected ? `3px solid ${color}` : '3px solid transparent',
                }}
              >
                <div
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                    boxShadow: isSelected ? `0 0 10px ${color}` : 'none',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: isSelected ? '#E0D9CF' : 'rgba(224, 217, 207, 0.9)',
                    fontSize: 13,
                    fontWeight: isSelected ? 500 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.4,
                  }}>
                    {marker.description}
                  </div>
                  <div style={{
                    color: 'rgba(224, 217, 207, 0.4)',
                    fontSize: 11, marginTop: 3,
                  }}>
                    {marker.date} · {marker.lat.toFixed(2)}, {marker.lng.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(224, 217, 207, 0.35)',
        fontSize: 11,
        textAlign: 'center',
        letterSpacing: 0.5,
      }}>
        点击地图任意位置记录新记忆
      </div>
    </div>
  );
};

export default MemoryPanel;
