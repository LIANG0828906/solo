import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User, FamilySpace, SheetMusic, Annotation, CollabMessage, Note } from '../types';
import { sheetDB } from './db';
import SheetEditor from './SheetEditor';
import CollabPanel from './CollabPanel';

const USER_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
  '#1ABC9C', '#E67E22', '#34495E', '#D35400', '#16A085',
];

const generateSampleNotes = (): Note[] => {
  const pitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const durations = ['q', 'q', '8', '8', 'q', 'q', 'h', 'q', 'q', '8', '8', 'q'];
  const notes: Note[] = [];

  for (let i = 0; i < 16; i++) {
    notes.push({
      id: uuidv4(),
      pitch: pitches[i % 7] as string,
      duration: durations[i % 12] as string,
      octave: 4,
      measure: Math.floor(i / 4) + 1,
      position: i % 4,
    });
  }

  return notes;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [familySpaces, setFamilySpaces] = useState<FamilySpace[]>([]);
  const [currentSpace, setCurrentSpace] = useState<FamilySpace | null>(null);
  const [currentSheet, setCurrentSheet] = useState<SheetMusic | null>(null);
  const [sheets, setSheets] = useState<SheetMusic[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [highlightedMeasure, setHighlightedMeasure] = useState<number | null>(null);
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSheetName, setNewSheetName] = useState('');
  const [isDbReady, setIsDbReady] = useState(false);
  const [collabMessages, setCollabMessages] = useState<CollabMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const initDB = async () => {
      await sheetDB.init();
      setIsDbReady(true);

      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      const savedSpaces = localStorage.getItem('familySpaces');
      if (savedSpaces) {
        setFamilySpaces(JSON.parse(savedSpaces));
      } else {
        const defaultSpaces: FamilySpace[] = [
          {
            id: uuidv4(),
            name: '李氏家族乐谱',
            ownerId: 'default',
            members: [],
            sheets: [],
          },
        ];
        setFamilySpaces(defaultSpaces);
        localStorage.setItem('familySpaces', JSON.stringify(defaultSpaces));
      }
    };

    initDB();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      sheetDB.close();
    };
  }, []);

  useEffect(() => {
    if (familySpaces.length > 0) {
      localStorage.setItem('familySpaces', JSON.stringify(familySpaces));
    }
  }, [familySpaces]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const connectWebSocket = useCallback(() => {
    if (!currentUser || !currentSpace) return;

    setWsStatus('connecting');

    try {
      const protocols = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocols}//${window.location.host}/ws?spaceId=${currentSpace.id}&userId=${currentUser.id}&userName=${encodeURIComponent(currentUser.nickname)}`;

      const newWs = new WebSocket(wsUrl);

      newWs.onopen = () => {
        setWsStatus('connected');
      };

      newWs.onmessage = (event) => {
        try {
          const message: CollabMessage = JSON.parse(event.data);
          setCollabMessages((prev) => [...prev.slice(-50), message]);

          if (message.type === 'note_update' && currentSheet) {
            const payload = message.payload as Record<string, unknown>;
            if (payload['action'] === 'add' && payload['note']) {
              setCurrentSheet((prev) => {
                if (!prev) return prev;
                return { ...prev, notes: [...prev.notes, payload['note'] as Note] };
              });
            } else if (payload['action'] === 'delete' && payload['noteId']) {
              setCurrentSheet((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  notes: prev.notes.filter((n) => n.id !== payload['noteId']),
                  annotations: prev.annotations.filter((a) => a.noteId !== payload['noteId']),
                };
              });
            } else if (payload['noteId']) {
              setCurrentSheet((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  notes: prev.notes.map((n) =>
                    n.id === payload['noteId']
                      ? {
                          ...n,
                          pitch: payload['pitch'] as string,
                          octave: payload['octave'] as number,
                          duration: payload['duration'] as string,
                        }
                      : n
                  ),
                };
              });
            }
          } else if (message.type === 'annotation_add') {
            const newAnnotation = message.payload as Annotation;
            setAnnotations((prev) => [...prev, newAnnotation]);
            setCurrentSheet((prev) => {
              if (!prev) return prev;
              return { ...prev, annotations: [...prev.annotations, newAnnotation] };
            });
          } else if (message.type === 'annotation_delete') {
            const payload = message.payload as { annotationId: string };
            setAnnotations((prev) => prev.filter((a) => a.id !== payload.annotationId));
            setCurrentSheet((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                annotations: prev.annotations.filter((a) => a.id !== payload.annotationId),
              };
            });
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      newWs.onclose = () => {
        setWsStatus('disconnected');
        setWs(null);
      };

      newWs.onerror = () => {
        setWsStatus('disconnected');
        console.log('WebSocket connection failed, working in offline mode');
      };

      wsRef.current = newWs;
      setWs(newWs);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setWsStatus('disconnected');
    }
  }, [currentUser, currentSpace, currentSheet]);

  useEffect(() => {
    if (currentUser && currentSpace && wsStatus === 'disconnected') {
      const timer = setTimeout(() => {
        connectWebSocket();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentUser, currentSpace, wsStatus, connectWebSocket]);

  const handleLogin = () => {
    if (!nicknameInput.trim()) return;

    const colorIndex = Math.floor(Math.random() * USER_COLORS.length);
    const newUser: User = {
      id: uuidv4(),
      nickname: nicknameInput.trim(),
      color: USER_COLORS[colorIndex] || '#4A3728',
    };

    setCurrentUser(newUser);
    setNicknameInput('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentSpace(null);
    setCurrentSheet(null);
    setSheets([]);
    setAnnotations([]);
    if (wsRef.current) {
      wsRef.current.close();
    }
    setWs(null);
    setWsStatus('disconnected');
  };

  const handleCreateSpace = () => {
    if (!newSpaceName.trim() || !currentUser) return;

    const newSpace: FamilySpace = {
      id: uuidv4(),
      name: newSpaceName.trim(),
      ownerId: currentUser.id,
      members: [currentUser.id],
      sheets: [],
    };

    setFamilySpaces([...familySpaces, newSpace]);
    setNewSpaceName('');
    setShowSpaceModal(false);
  };

  const handleSelectSpace = async (space: FamilySpace) => {
    setCurrentSpace(space);
    setCurrentSheet(null);
    setAnnotations([]);

    if (isDbReady) {
      const spaceSheets = await sheetDB.getSheetsBySpace(space.id);
      if (spaceSheets.length > 0) {
        setSheets(spaceSheets);
      } else {
        const sampleSheet: SheetMusic = {
          id: uuidv4(),
          name: '示例乐谱 - 小星星',
          spaceId: space.id,
          notes: generateSampleNotes(),
          annotations: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await sheetDB.saveSheet(sampleSheet);
        setSheets([sampleSheet]);
      }
    }
  };

  const handleCreateSheet = async () => {
    if (!newSheetName.trim() || !currentSpace) return;

    const newSheet: SheetMusic = {
      id: uuidv4(),
      name: newSheetName.trim(),
      spaceId: currentSpace.id,
      notes: generateSampleNotes(),
      annotations: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await sheetDB.saveSheet(newSheet);
    setSheets([...sheets, newSheet]);
    setNewSheetName('');
    setShowSheetModal(false);
  };

  const handleSelectSheet = async (sheet: SheetMusic) => {
    const sheetWithAnnotations = await sheetDB.getSheet(sheet.id);
    if (sheetWithAnnotations) {
      setCurrentSheet(sheetWithAnnotations);
      setAnnotations(sheetWithAnnotations.annotations);
    } else {
      setCurrentSheet(sheet);
      setAnnotations(sheet.annotations);
    }
  };

  const handleAnnotationClick = (annotation: Annotation) => {
    setHighlightedMeasure(annotation.measure);
    setTimeout(() => setHighlightedMeasure(null), 3000);
  };

  const handleJumpToMeasure = (measure: number) => {
    setHighlightedMeasure(measure);
    setTimeout(() => setHighlightedMeasure(null), 3000);
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter((a) => a.id !== id));
    sheetDB.deleteAnnotation(id);
  };

  const handleAnnotationsChange = useCallback((newAnnotations: Annotation[]) => {
    setAnnotations(newAnnotations);
  }, []);

  interface AppStyles {
    app: React.CSSProperties;
    parchmentBg: React.CSSProperties;
    header: React.CSSProperties;
    logo: React.CSSProperties;
    userInfo: React.CSSProperties;
    userBadge: React.CSSProperties;
    userColorDot: React.CSSProperties;
    wsStatus: React.CSSProperties;
    statusDot: React.CSSProperties;
    logoutBtn: React.CSSProperties;
    mainContent: React.CSSProperties;
    sidebar: React.CSSProperties;
    sidebarSection: React.CSSProperties;
    sectionTitle: React.CSSProperties;
    spaceList: React.CSSProperties;
    spaceItem: React.CSSProperties;
    spaceItemActive: React.CSSProperties;
    sheetList: React.CSSProperties;
    sheetItem: React.CSSProperties;
    sheetItemActive: React.CSSProperties;
    addBtn: React.CSSProperties;
    editorArea: React.CSSProperties;
    loginContainer: React.CSSProperties;
    loginCard: React.CSSProperties;
    loginTitle: React.CSSProperties;
    loginSubtitle: React.CSSProperties;
    input: React.CSSProperties;
    loginBtn: React.CSSProperties;
    modalOverlay: React.CSSProperties;
    modal: React.CSSProperties;
    modalTitle: React.CSSProperties;
    modalButtons: React.CSSProperties;
    button: React.CSSProperties;
    buttonSecondary: React.CSSProperties;
    emptyState: React.CSSProperties;
    emptyIcon: React.CSSProperties;
    emptyText: React.CSSProperties;
    emptyHint: React.CSSProperties;
    collabActivity: React.CSSProperties;
    activityItem: React.CSSProperties;
  }

  const styles: AppStyles = {
    app: {
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    },
    parchmentBg: {
      background: `
        linear-gradient(135deg, #F5F0E6 0%, #FFF8EC 25%, #F5EFE0 50%, #FFF8EC 75%, #F5F0E6 100%),
        radial-gradient(ellipse at 20% 30%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 70%, rgba(74, 55, 40, 0.05) 0%, transparent 50%)
      `,
      backgroundColor: '#F5F0E6',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 24px',
      backgroundColor: '#4A3728',
      color: '#F5F0E6',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      zIndex: 100,
    },
    logo: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginRight: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    userBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      backgroundColor: 'rgba(245, 240, 230, 0.15)',
      borderRadius: '20px',
    },
    userColorDot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
    },
    wsStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
    },
    statusDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
    },
    logoutBtn: {
      padding: '6px 16px',
      border: '1px solid #F5F0E6',
      borderRadius: '6px',
      backgroundColor: 'transparent',
      color: '#F5F0E6',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
    },
    sidebar: {
      width: '280px',
      backgroundColor: 'rgba(74, 55, 40, 0.05)',
      borderRight: '2px solid #4A3728',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    sidebarSection: {
      padding: '16px',
      borderBottom: '1px solid rgba(74, 55, 40, 0.2)',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#4A3728',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    spaceList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      maxHeight: '200px',
      overflowY: 'auto',
    },
    spaceItem: {
      padding: '10px 12px',
      marginBottom: '6px',
      backgroundColor: '#FFF8EC',
      border: '1px solid rgba(74, 55, 40, 0.2)',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    spaceItemActive: {
      backgroundColor: '#FFD700',
      borderColor: '#4A3728',
      fontWeight: 'bold',
    },
    sheetList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      flex: 1,
      overflowY: 'auto',
    },
    sheetItem: {
      padding: '10px 12px',
      marginBottom: '6px',
      backgroundColor: '#FFF8EC',
      border: '1px solid rgba(74, 55, 40, 0.2)',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    sheetItemActive: {
      backgroundColor: 'rgba(255, 215, 0, 0.5)',
      borderColor: '#FFD700',
    },
    addBtn: {
      width: '100%',
      padding: '10px',
      border: '2px dashed #4A3728',
      borderRadius: '6px',
      backgroundColor: 'transparent',
      color: '#4A3728',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      marginTop: '8px',
    },
    editorArea: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
    },
    loginContainer: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
    },
    loginCard: {
      backgroundColor: '#FFF8EC',
      border: '3px solid #4A3728',
      borderRadius: '16px',
      padding: '40px',
      maxWidth: '400px',
      width: '100%',
      boxShadow: '0 8px 32px rgba(74, 55, 40, 0.2)',
      textAlign: 'center',
    },
    loginTitle: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#4A3728',
      marginBottom: '8px',
    },
    loginSubtitle: {
      fontSize: '14px',
      color: '#8B7355',
      marginBottom: '32px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #4A3728',
      borderRadius: '8px',
      backgroundColor: '#F5F0E6',
      color: '#4A3728',
      fontSize: '16px',
      marginBottom: '16px',
      boxSizing: 'border-box',
    },
    loginBtn: {
      width: '100%',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: '#4A3728',
      color: '#F5F0E6',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'all 0.2s ease',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(74, 55, 40, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: '#FFF8EC',
      border: '2px solid #4A3728',
      borderRadius: '12px',
      padding: '24px',
      minWidth: '350px',
      boxShadow: '0 8px 24px rgba(74, 55, 40, 0.3)',
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#4A3728',
      marginBottom: '20px',
    },
    modalButtons: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
      justifyContent: 'flex-end',
    },
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: '#4A3728',
      color: '#F5F0E6',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    },
    buttonSecondary: {
      padding: '8px 16px',
      border: '1px solid #4A3728',
      borderRadius: '6px',
      backgroundColor: 'transparent',
      color: '#4A3728',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    },
    emptyState: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#8B7355',
      padding: '40px',
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '16px',
    },
    emptyText: {
      fontSize: '18px',
      marginBottom: '8px',
    },
    emptyHint: {
      fontSize: '14px',
    },
    collabActivity: {
      padding: '8px 16px',
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      borderTop: '1px solid rgba(74, 55, 40, 0.2)',
      fontSize: '12px',
      color: '#4A3728',
      maxHeight: '80px',
      overflowY: 'auto',
    },
    activityItem: {
      padding: '2px 0',
      opacity: 0.7,
    },
  };

  if (!currentUser) {
    return (
      <div style={{ ...styles.app, ...styles.parchmentBg }}>
        <div style={styles.loginContainer}>
          <div style={styles.loginCard}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎼</div>
            <h1 style={styles.loginTitle}>家族乐谱协作</h1>
            <p style={styles.loginSubtitle}>共享音乐记忆，共谱家族乐章</p>
            <input
              style={styles.input}
              type="text"
              placeholder="请输入您的昵称"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              maxLength={20}
            />
            <button
              style={{
                ...styles.loginBtn,
                opacity: nicknameInput.trim() ? 1 : 0.5,
                cursor: nicknameInput.trim() ? 'pointer' : 'not-allowed',
              }}
              onClick={handleLogin}
              disabled={!nicknameInput.trim()}
            >
              进入乐谱空间
            </button>
            <p style={{ fontSize: '12px', color: '#8B7355', marginTop: '20px' }}>
              💡 输入昵称即可开始，无需注册
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.app, ...styles.parchmentBg }}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <span>🎼</span>
          <span>家族乐谱协作</span>
          {currentSpace && (
            <span style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.8 }}>
              / {currentSpace.name}
            </span>
          )}
        </div>
        <div style={styles.userInfo}>
          <div style={styles.wsStatus}>
            <span
              style={{
                ...styles.statusDot,
                backgroundColor:
                  wsStatus === 'connected'
                    ? '#2ECC71'
                    : wsStatus === 'connecting'
                    ? '#F39C12'
                    : '#E74C3C',
              }}
            ></span>
            <span>
              {wsStatus === 'connected' ? '已连接' : wsStatus === 'connecting' ? '连接中...' : '离线模式'}
            </span>
          </div>
          <div style={styles.userBadge}>
            <span style={{ ...styles.userColorDot, backgroundColor: currentUser.color }}></span>
            <span>{currentUser.nickname}</span>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            退出
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <h3 style={styles.sectionTitle}>
              <span>🏠</span>
              家谱空间
            </h3>
            <ul style={styles.spaceList}>
              {familySpaces.map((space) => (
                <li
                  key={space.id}
                  style={{
                    ...styles.spaceItem,
                    ...(currentSpace?.id === space.id ? styles.spaceItemActive : {}),
                  }}
                  onClick={() => handleSelectSpace(space)}
                >
                  <span>📁</span>
                  <span style={{ flex: 1 }}>{space.name}</span>
                </li>
              ))}
            </ul>
            <button
              style={styles.addBtn}
              onClick={() => setShowSpaceModal(true)}
            >
              ➕ 新建空间
            </button>
          </div>

          <div style={{ ...styles.sidebarSection, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h3 style={styles.sectionTitle}>
              <span>📜</span>
              乐谱列表
            </h3>
            {currentSpace ? (
              <>
                <ul style={styles.sheetList}>
                  {sheets.map((sheet) => (
                    <li
                      key={sheet.id}
                      style={{
                        ...styles.sheetItem,
                        ...(currentSheet?.id === sheet.id ? styles.sheetItemActive : {}),
                      }}
                      onClick={() => handleSelectSheet(sheet)}
                    >
                      <div style={{ fontWeight: 'bold', color: '#4A3728' }}>
                        🎵 {sheet.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8B7355', marginTop: '4px' }}>
                        {sheet.notes.length} 音符 · {sheet.annotations.length} 批注
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  style={styles.addBtn}
                  onClick={() => setShowSheetModal(true)}
                >
                  ➕ 新建乐谱
                </button>
              </>
            ) : (
              <div style={{ color: '#8B7355', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                请先选择一个空间
              </div>
            )}
          </div>

          {collabMessages.length > 0 && (
            <div style={styles.collabActivity}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>实时动态</div>
              {collabMessages.slice(-3).reverse().map((msg, idx) => (
                <div key={idx} style={styles.activityItem}>
                  <span style={{ color: msg.userColor, fontWeight: 'bold' }}>{msg.userName}</span>
                  {msg.type === 'note_update' ? ' 编辑了音符' : msg.type === 'annotation_add' ? ' 添加了批注' : ' 删除了批注'}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.editorArea}>
          {currentSheet ? (
            <>
              <SheetEditor
                sheet={currentSheet}
                currentUser={currentUser}
                ws={ws}
                onAnnotationsChange={handleAnnotationsChange}
                highlightedMeasure={highlightedMeasure}
                onJumpToMeasure={handleJumpToMeasure}
              />
              <CollabPanel
                annotations={annotations}
                currentUser={currentUser}
                onAnnotationClick={handleAnnotationClick}
                onDeleteAnnotation={handleDeleteAnnotation}
              />
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🎵</div>
              <div style={styles.emptyText}>
                {currentSpace ? '选择或创建一个乐谱开始编辑' : '请先选择一个家谱空间'}
              </div>
              <div style={styles.emptyHint}>
                {currentSpace ? '💡 点击左侧乐谱列表或新建乐谱' : '💡 点击左侧空间列表或新建空间'}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSpaceModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSpaceModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>新建家谱空间</h3>
            <input
              style={styles.input}
              type="text"
              placeholder="输入空间名称，如：张氏家族乐谱"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSpace()}
              maxLength={30}
            />
            <div style={styles.modalButtons}>
              <button style={styles.buttonSecondary} onClick={() => setShowSpaceModal(false)}>
                取消
              </button>
              <button
                style={{
                  ...styles.button,
                  opacity: newSpaceName.trim() ? 1 : 0.5,
                  cursor: newSpaceName.trim() ? 'pointer' : 'not-allowed',
                }}
                onClick={handleCreateSpace}
                disabled={!newSpaceName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showSheetModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSheetModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>新建乐谱</h3>
            <input
              style={styles.input}
              type="text"
              placeholder="输入乐谱名称，如：小星星"
              value={newSheetName}
              onChange={(e) => setNewSheetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSheet()}
              maxLength={30}
            />
            <div style={styles.modalButtons}>
              <button style={styles.buttonSecondary} onClick={() => setShowSheetModal(false)}>
                取消
              </button>
              <button
                style={{
                  ...styles.button,
                  opacity: newSheetName.trim() ? 1 : 0.5,
                  cursor: newSheetName.trim() ? 'pointer' : 'not-allowed',
                }}
                onClick={handleCreateSheet}
                disabled={!newSheetName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
