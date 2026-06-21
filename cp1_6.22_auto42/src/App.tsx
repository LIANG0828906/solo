import React, { useState, useEffect, useCallback, useRef } from 'react';
import BuildPlate from '@/components/BuildPlate';
import Palette from '@/components/Palette';
import type { BrickData, BrickSize, BrickColor, Rotation, Viewport, WorkData } from '@/types';
import { generateId, loadWorks, createWork as saveWorkToStorage, deleteWork as deleteWorkFromStorage } from '@/utils/storage';
import { getColorMeta, getSizeMeta } from '@/constants';

function App() {
  const [bricks, setBricks] = useState<BrickData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, offsetX: 80, offsetY: 80 });
  const [works, setWorks] = useState<WorkData[]>(() => loadWorks());
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showLoadModal, setShowLoadModal] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const [workName, setWorkName] = useState<string>('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const deleteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const getOrCreateAudioContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  }, []);

  const playClickSound = useCallback(() => {
    try {
      const ctx = getOrCreateAudioContext();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // AudioContext not supported
    }
  }, [getOrCreateAudioContext]);

  const showToast = useCallback((message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToast({ message, id });

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast((current) => {
        if (current && current.id === id) {
          return null;
        }
        return current;
      });
    }, 3000);
  }, []);

  const handlePlaceBrick = useCallback(
    (type: BrickSize, color: BrickColor, x: number, y: number) => {
      const newId = generateId();
      const newBrick: BrickData = {
        id: newId,
        type,
        color,
        x,
        y,
        rotation: 0,
        justPlaced: true,
      };

      setBricks((prev) => [...prev, newBrick]);
      playClickSound();

      const placeTimer = setTimeout(() => {
        setBricks((prev) =>
          prev.map((b) => (b.id === newId ? { ...b, justPlaced: false } : b))
        );
        placeTimersRef.current.delete(newId);
      }, 300);

      placeTimersRef.current.set(newId, placeTimer);
    },
    [playClickSound]
  );

  const handleSelectBrick = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const handleRotateBrick = useCallback(
    (id: string) => {
      setBricks((prev) =>
        prev.map((b) => {
          if (b.id === id) {
            const nextRotation = ((b.rotation + 90) % 360) as Rotation;
            return { ...b, rotation: nextRotation };
          }
          return b;
        })
      );
      playClickSound();
    },
    [playClickSound]
  );

  const handleDeleteBrick = useCallback(
    (id: string) => {
      setBricks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, deleting: true } : b))
      );

      const existingTimer = deleteTimersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const deleteTimer = setTimeout(() => {
        setBricks((prev) => prev.filter((b) => b.id !== id));
        setSelectedId((current) => (current === id ? null : current));
        deleteTimersRef.current.delete(id);
      }, 350);

      deleteTimersRef.current.set(id, deleteTimer);
    },
    []
  );

  const handleViewportChange = useCallback((vp: Viewport) => {
    setViewport(vp);
  }, []);

  const handlePaletteDragStart = useCallback((_type: BrickSize, _color: BrickColor) => {
    // DnD via dataTransfer, callback for notification only
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (selectedId) {
        if (key === 'r') {
          e.preventDefault();
          handleRotateBrick(selectedId);
        } else if (key === 'delete' || key === 'backspace') {
          e.preventDefault();
          handleDeleteBrick(selectedId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId, handleRotateBrick, handleDeleteBrick]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      placeTimersRef.current.forEach((timer) => clearTimeout(timer));
      placeTimersRef.current.clear();
      deleteTimersRef.current.forEach((timer) => clearTimeout(timer));
      deleteTimersRef.current.clear();
    };
  }, []);

  const handleSaveClick = () => {
    setWorkName('');
    setShowSaveModal(true);
  };

  const handleLoadClick = () => {
    setWorks(loadWorks());
    setShowLoadModal(true);
  };

  const handleConfirmSave = () => {
    const trimmedName = workName.trim();
    if (!trimmedName) return;

    const cleanBricks = bricks.map(({ justPlaced: _j, deleting: _d, ...rest }) => rest);
    saveWorkToStorage(trimmedName, { bricks: cleanBricks, viewport });
    setWorks(loadWorks());
    setShowSaveModal(false);
    setWorkName('');
    showToast('作品保存成功 ✓');
  };

  const handleLoadWork = (work: WorkData) => {
    setBricks(work.bricks);
    setViewport(work.viewport);
    setSelectedId(null);
    setShowLoadModal(false);
    showToast('作品加载成功 ✓');
  };

  const handleRequestDelete = (id: string, name: string) => {
    setConfirmDelete({ id, name });
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    deleteWorkFromStorage(confirmDelete.id);
    setWorks(loadWorks());
    setConfirmDelete(null);
    showToast('作品已删除');
  };

  const selectedBrick = bricks.find((b) => b.id === selectedId) || null;
  const selectedColorMeta = selectedBrick ? getColorMeta(selectedBrick.color) : null;

  const maskSaveHandler = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowSaveModal(false);
    }
  };

  const maskLoadHandler = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowLoadModal(false);
    }
  };

  const maskConfirmHandler = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setConfirmDelete(null);
    }
  };

  // Ensure getSizeMeta is referenced to satisfy strict TS unused check
  void getSizeMeta;

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--app-bg)',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: '280px',
          zIndex: 10,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#334155',
          }}
        >
          <span
            style={{
              color: '#64748b',
              fontSize: '16px',
            }}
          >
            ■
          </span>
          <span>{bricks.length} 块积木</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {selectedColorMeta ? (
            <>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: selectedColorMeta.primary,
                  border: `1px solid ${selectedColorMeta.border}`,
                  display: 'inline-block',
                }}
              />
              <span style={{ color: '#334155' }}>{selectedColorMeta.name}</span>
            </>
          ) : (
            <span style={{ color: '#94a3b8' }}>未选中</span>
          )}
        </div>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: '8px',
          }}
        >
          <button className="btn-frosted" onClick={handleSaveClick}>
            保存
          </button>
          <button className="btn-frosted" onClick={handleLoadClick}>
            加载
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          marginTop: '56px',
          position: 'relative',
        }}
      >
        <BuildPlate
          bricks={bricks}
          selectedId={selectedId}
          viewport={viewport}
          onPlaceBrick={handlePlaceBrick}
          onSelectBrick={handleSelectBrick}
          onRotateBrick={handleRotateBrick}
          onDeleteBrick={handleDeleteBrick}
          onViewportChange={handleViewportChange}
        />
      </div>

      <Palette onDragStart={handlePaletteDragStart} />

      {showSaveModal && (
        <div
          onClick={maskSaveHandler}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fade-in 200ms',
          }}
        >
          <div
            style={{
              width: '400px',
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              animation: 'modal-in 250ms ease-out',
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 500,
                marginBottom: '16px',
                color: '#1e293b',
              }}
            >
              保存作品
            </div>
            <input
              type="text"
              value={workName}
              onChange={(e) => setWorkName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && workName.trim() !== '') {
                  handleConfirmSave();
                }
              }}
              placeholder="请输入作品名称"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'border-color 200ms',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
                marginTop: '20px',
              }}
            >
              <button
                className="btn-frosted"
                onClick={() => setShowSaveModal(false)}
              >
                取消
              </button>
              <button
                disabled={workName.trim() === ''}
                onClick={handleConfirmSave}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid #1d4ed8',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: workName.trim() === '' ? 'not-allowed' : 'pointer',
                  opacity: workName.trim() === '' ? 0.5 : 1,
                  transition: 'all 200ms ease',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (workName.trim() !== '') {
                    e.currentTarget.style.background = '#1d4ed8';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.3)';
                }}
                onMouseDown={(e) => {
                  if (workName.trim() !== '') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.3)';
                  }
                }}
                onMouseUp={(e) => {
                  if (workName.trim() !== '') {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                  }
                }}
              >
                确定保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div
          onClick={maskLoadHandler}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fade-in 200ms',
          }}
        >
          <div
            style={{
              width: '520px',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              animation: 'modal-in 250ms ease-out',
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 500,
                marginBottom: '16px',
                color: '#1e293b',
              }}
            >
              加载作品
            </div>

            {works.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: '#94a3b8',
                  fontSize: '14px',
                }}
              >
                暂无保存的作品
              </div>
            ) : (
              <div>
                {works.map((work) => (
                  <div
                    key={work.id}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '14px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: '#1e293b',
                          marginBottom: '4px',
                        }}
                      >
                        {work.name}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                        }}
                      >
                        {work.bricks.length} 块积木 · {new Date(work.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                      }}
                    >
                      <button
                        onClick={() => handleLoadWork(work)}
                        style={{
                          background: '#2563eb',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: '1px solid #1d4ed8',
                          transition: 'all 200ms ease',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#1d4ed8';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#2563eb';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        加载
                      </button>
                      <button
                        onClick={() => handleRequestDelete(work.id, work.name)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: '1px solid #dc2626',
                          transition: 'all 200ms ease',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ef4444';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '20px',
              }}
            >
              <button
                className="btn-frosted"
                onClick={() => setShowLoadModal(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          onClick={maskConfirmHandler}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fade-in 200ms',
          }}
        >
          <div
            style={{
              width: '360px',
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              animation: 'modal-in 250ms ease-out',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: 500,
                color: '#ef4444',
                marginBottom: '12px',
              }}
            >
              删除作品
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#475569',
                lineHeight: 1.6,
                marginBottom: '20px',
              }}
            >
              确定要删除作品「{confirmDelete.name}」吗？此操作不可恢复。
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                className="btn-frosted"
                onClick={() => setConfirmDelete(null)}
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: '1px solid #dc2626',
                  transition: 'all 200ms ease',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            background: '#22c55e',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(34, 197, 94, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
            animation: 'toast-in 300ms ease-out',
          }}
        >
          <span style={{ fontWeight: 700 }}>✓</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
