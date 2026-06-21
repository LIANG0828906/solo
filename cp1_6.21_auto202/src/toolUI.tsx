import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brush, MapPin, RotateCcw, X, ChevronRight, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useTerrainContext, Marker } from './terrainEngine';

interface FaultTip {
  show: boolean;
  x: number;
  y: number;
  message: string;
}

const ToolUI: React.FC = () => {
  const {
    mousePosition,
    excavatedCount,
    markers,
    activeTool,
    setActiveTool,
    removeMarker,
    flyToMarker,
    resetTerrain,
  } = useTerrainContext();

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [faultTip, setFaultTip] = useState<FaultTip | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMarkerPanel, setShowMarkerPanel] = useState(false);
  const [, setTick] = useState(0);

  const brushBtnRef = useRef<HTMLButtonElement>(null);
  const markerBtnRef = useRef<HTMLButtonElement>(null);
  const isPressedRef = useRef<'brush' | 'marker' | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToolClick = useCallback(
    (tool: 'brush' | 'marker') => {
      if (activeTool === tool) {
        setActiveTool(null);
      } else {
        setActiveTool(tool);
      }
      isPressedRef.current = tool;
      setTimeout(() => {
        isPressedRef.current = null;
      }, 100);
    },
    [activeTool, setActiveTool]
  );

  const handleDeleteMarker = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await axios.delete(`/api/markers/${id}`);
        removeMarker(id);
      } catch (error) {
        console.error('Failed to delete marker:', error);
        removeMarker(id);
      }
    },
    [removeMarker]
  );

  const handleMarkerClick = useCallback(
    (id: string) => {
      flyToMarker(id, 1200);
      if (isMobile) {
        setShowMarkerPanel(false);
      }
    },
    [flyToMarker, isMobile]
  );

  const handleReset = useCallback(async () => {
    await resetTerrain();
    setShowResetDialog(false);
    setActiveTool(null);
  }, [resetTerrain, setActiveTool]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
        }
        
        .tool-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .tool-btn:hover {
          transform: translateY(-2px);
        }
        
        .tool-btn:active {
          transform: translateY(1px) scale(0.95);
        }
        
        .tool-btn.active {
          animation: pulse 2s infinite;
        }
        
        .marker-label {
          font-family: monospace;
        }
        
        .glass-bg {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        .list-item-hover {
          transition: all 0.2s ease;
        }
        
        .list-item-hover:hover {
          background: rgba(59, 130, 246, 0.1);
          transform: translateX(2px);
        }
      `}</style>

      <div
        className="toolbar fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50"
        style={{
          ...(isMobile && {
            position: 'fixed',
            left: 0,
            bottom: 0,
            top: 'auto',
            transform: 'none',
            width: '100%',
            height: '60px',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #334155',
            overflowX: 'auto',
            padding: '0 16px',
          }),
        }}
      >
        <button
          ref={brushBtnRef}
          onClick={() => handleToolClick('brush')}
          className={`tool-btn w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            activeTool === 'brush'
              ? 'bg-[#1E293B] border-2 border-[#3B82F6] shadow-lg'
              : 'bg-[#1E293B] border-2 border-transparent hover:bg-[#334155]'
          } ${activeTool === 'brush' ? 'active' : ''}`}
          style={{
            backgroundColor: activeTool === 'brush' ? '#1E293B' : '#1E293B',
            transform: isPressedRef.current === 'brush' ? 'translateY(2px)' : undefined,
            transition: 'all 0.1s ease',
          }}
          title="挖掘工具"
        >
          <Brush
            size={24}
            color={activeTool === 'brush' ? '#3B82F6' : '#94A3B8'}
            strokeWidth={2}
          />
        </button>

        <button
          ref={markerBtnRef}
          onClick={() => handleToolClick('marker')}
          className={`tool-btn w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            activeTool === 'marker'
              ? 'bg-[#1E293B] border-2 border-[#3B82F6] shadow-lg'
              : 'bg-[#1E293B] border-2 border-transparent hover:bg-[#334155]'
          } ${activeTool === 'marker' ? 'active' : ''}`}
          style={{
            transform: isPressedRef.current === 'marker' ? 'translateY(2px)' : undefined,
            transition: 'all 0.1s ease',
          }}
          title="标注工具"
        >
          <MapPin
            size={24}
            color={activeTool === 'marker' ? '#3B82F6' : '#94A3B8'}
            strokeWidth={2}
          />
        </button>
      </div>

      <button
        onClick={() => setShowResetDialog(true)}
        className="fixed top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-50 transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          backgroundColor: '#EF4444',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#DC2626';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#EF4444';
        }}
        title="重置场景"
      >
        <RotateCcw size={18} color="#F8FAFC" strokeWidth={2.5} />
      </button>

      {!isMobile ? (
        <div
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 rounded-lg overflow-hidden"
          style={{
            width: '280px',
            background: '#0F172A',
            borderRadius: '8px',
            border: '1px solid #334155',
            maxHeight: 'calc(100vh - 120px)',
          }}
        >
          <div
            className="px-3 py-3 font-semibold text-sm flex items-center justify-between"
            style={{
              color: '#F8FAFC',
              borderBottom: '1px solid #334155',
            }}
          >
            <span className="flex items-center gap-2">
              <MapPin size={16} color="#FACC15" />
              标注列表
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: '#1E293B', color: '#94A3B8' }}
            >
              {markers.length}
            </span>
          </div>
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: 'calc(100vh - 180px)',
              padding: '12px',
            }}
          >
            {markers.length === 0 ? (
              <div
                className="text-center py-8 text-sm"
                style={{ color: '#64748B' }}
              >
                <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                <p>暂无标注</p>
                <p className="text-xs mt-1">使用标注工具添加</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {markers.map((marker) => (
                  <div
                    key={marker.id}
                    onClick={() => handleMarkerClick(marker.id)}
                    className="list-item-hover rounded-lg p-3 cursor-pointer flex items-center justify-between"
                    style={{
                      background: '#1E293B',
                      border: '1px solid #334155',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="marker-label text-sm font-medium truncate mb-1"
                        style={{ color: '#F8FAFC' }}
                      >
                        {marker.label || '未命名标注'}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: '#64748B', fontFamily: 'monospace' }}
                      >
                        X:{marker.x.toFixed(1)} Z:{marker.z.toFixed(1)}
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: '#475569' }}
                      >
                        {formatDate(marker.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDeleteMarker(marker.id, e)}
                        className="p-1.5 rounded-md transition-all duration-200 hover:bg-red-500/20"
                        style={{ color: '#EF4444' }}
                        title="删除标注"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={16} style={{ color: '#64748B' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {showMarkerPanel && (
            <div
              className="fixed inset-0 z-50"
              onClick={() => setShowMarkerPanel(false)}
              style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            >
              <div
                className="absolute right-0 top-0 bottom-0"
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '280px',
                  background: '#0F172A',
                  borderLeft: '1px solid #334155',
                  animation: 'slideInRight 0.3s ease',
                }}
              >
                <div
                  className="px-4 py-3 font-semibold text-sm flex items-center justify-between"
                  style={{
                    color: '#F8FAFC',
                    borderBottom: '1px solid #334155',
                  }}
                >
                  <span className="flex items-center gap-2">
                    <MapPin size={16} color="#FACC15" />
                    标注列表 ({markers.length})
                  </span>
                  <button
                    onClick={() => setShowMarkerPanel(false)}
                    className="p-1 rounded hover:bg-[#334155] transition-colors"
                  >
                    <X size={18} color="#94A3B8" />
                  </button>
                </div>
                <div
                  className="overflow-y-auto"
                  style={{
                    maxHeight: 'calc(100vh - 60px)',
                    padding: '12px',
                  }}
                >
                  {markers.length === 0 ? (
                    <div
                      className="text-center py-8 text-sm"
                      style={{ color: '#64748B' }}
                    >
                      暂无标注
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {markers.map((marker) => (
                        <div
                          key={marker.id}
                          onClick={() => handleMarkerClick(marker.id)}
                          className="rounded-lg p-3 cursor-pointer flex items-center justify-between"
                          style={{
                            background: '#1E293B',
                            border: '1px solid #334155',
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-sm font-medium truncate mb-1"
                              style={{ color: '#F8FAFC' }}
                            >
                              {marker.label || '未命名标注'}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: '#64748B', fontFamily: 'monospace' }}
                            >
                              X:{marker.x.toFixed(1)} Z:{marker.z.toFixed(1)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteMarker(marker.id, e)}
                            className="p-1.5 rounded-md"
                            style={{ color: '#EF4444' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowMarkerPanel(true)}
            className="fixed right-4 bottom-[70px] w-12 h-12 rounded-full flex items-center justify-center z-40"
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <MapPin size={20} color="#FACC15" />
            {markers.length > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center"
                style={{ background: '#EF4444', color: '#F8FAFC' }}
              >
                {markers.length}
              </span>
            )}
          </button>
        </>
      )}

      {markers.map((marker) => (
        <div
          key={`label-${marker.id}`}
          className="absolute pointer-events-none z-30"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            className="marker-label text-[14px] whitespace-nowrap"
            style={{
              background: '#1E293B',
              color: '#F8FAFC',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #334155',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            {marker.label || '标注点'}
          </div>
        </div>
      ))}

      {faultTip && faultTip.show && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: faultTip.x,
            top: faultTip.y - 60,
            transform: 'translateX(-50%)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            className="glass-bg px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              color: '#F8FAFC',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            {faultTip.message}
          </div>
        </div>
      )}

      {showResetDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          onClick={() => setShowResetDialog(false)}
        >
          <div
            className="glass-bg rounded-xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: '#F8FAFC' }}
            >
              确认重置
            </h3>
            <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
              重置后所有挖掘和标注将被清除，场景将恢复到初始状态。此操作不可撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
                style={{ background: '#64748B', color: '#F8FAFC' }}
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
                style={{ background: '#EF4444', color: '#F8FAFC' }}
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          height: '36px',
          background: '#1E293B',
          borderTop: '1px solid #334155',
          marginBottom: isMobile ? '60px' : 0,
        }}
      >
        <div
          className="text-sm flex items-center gap-4"
          style={{ fontFamily: 'courier, monospace', color: '#94A3B8' }}
        >
          <span>
            X: <span style={{ color: '#3B82F6' }}>{mousePosition.x.toFixed(2)}</span>
          </span>
          <span>
            Z: <span style={{ color: '#3B82F6' }}>{mousePosition.z.toFixed(2)}</span>
          </span>
        </div>
        <div className="text-sm flex items-center gap-4" style={{ color: '#94A3B8' }}>
          <span>
            已挖掘:{' '}
            <span style={{ color: '#10B981', fontWeight: 500 }}>{excavatedCount}</span> 片
          </span>
          <span>
            标注:{' '}
            <span style={{ color: '#FACC15', fontWeight: 500 }}>{markers.length}</span> 个
          </span>
        </div>
      </div>
    </>
  );
};

export default ToolUI;
