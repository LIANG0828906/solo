import { useState, useEffect, useRef, useCallback } from 'react';
import { useStoryStore } from '@/store/storyStore';

export default function SidePanel() {
  const selectedSceneId = useStoryStore((state) => state.selectedSceneId);
  const scenes = useStoryStore((state) => state.scenes);
  const characters = useStoryStore((state) => state.characters);
  const props = useStoryStore((state) => state.props);
  const updateScene = useStoryStore((state) => state.updateScene);
  const linkCharacterToScene = useStoryStore((state) => state.linkCharacterToScene);
  const unlinkCharacterFromScene = useStoryStore(
    (state) => state.unlinkCharacterFromScene
  );
  const linkPropToScene = useStoryStore((state) => state.linkPropToScene);
  const unlinkPropFromScene = useStoryStore((state) => state.unlinkPropFromScene);
  const addCharacter = useStoryStore((state) => state.addCharacter);
  const addProp = useStoryStore((state) => state.addProp);
  const selectScene = useStoryStore((state) => state.selectScene);

  const [localTitle, setLocalTitle] = useState('');
  const [localDesc, setLocalDesc] = useState('');
  const [newCharName, setNewCharName] = useState('');
  const [newPropName, setNewPropName] = useState('');
  const [showAddChar, setShowAddChar] = useState(false);
  const [showAddProp, setShowAddProp] = useState(false);

  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);
  const isOpen = selectedSceneId !== null;

  useEffect(() => {
    if (selectedScene) {
      setLocalTitle(selectedScene.title);
      setLocalDesc(selectedScene.description);
    }
  }, [selectedSceneId, selectedScene?.title, selectedScene?.description]);

  const debouncedUpdateTitle = useCallback(
    (value: string) => {
      if (titleTimerRef.current) {
        clearTimeout(titleTimerRef.current);
      }
      titleTimerRef.current = setTimeout(() => {
        if (selectedSceneId) {
          updateScene(selectedSceneId, { title: value });
        }
      }, 300);
    },
    [selectedSceneId, updateScene]
  );

  const debouncedUpdateDesc = useCallback(
    (value: string) => {
      if (descTimerRef.current) {
        clearTimeout(descTimerRef.current);
      }
      descTimerRef.current = setTimeout(() => {
        if (selectedSceneId) {
          updateScene(selectedSceneId, { description: value });
        }
      }, 300);
    },
    [selectedSceneId, updateScene]
  );

  useEffect(() => {
    return () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      if (descTimerRef.current) clearTimeout(descTimerRef.current);
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalTitle(value);
    debouncedUpdateTitle(value);
  };

  const handleTitleBlur = () => {
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current);
      titleTimerRef.current = null;
    }
    if (selectedSceneId && localTitle !== selectedScene?.title) {
      updateScene(selectedSceneId, { title: localTitle });
    }
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalDesc(value);
    debouncedUpdateDesc(value);
  };

  const handleDescBlur = () => {
    if (descTimerRef.current) {
      clearTimeout(descTimerRef.current);
      descTimerRef.current = null;
    }
    if (selectedSceneId && localDesc !== selectedScene?.description) {
      updateScene(selectedSceneId, { description: localDesc });
    }
  };

  const toggleCharacter = (charId: string) => {
    if (!selectedSceneId) return;
    if (selectedScene?.characterIds.includes(charId)) {
      unlinkCharacterFromScene(charId, selectedSceneId);
    } else {
      linkCharacterToScene(charId, selectedSceneId);
    }
  };

  const toggleProp = (propId: string) => {
    if (!selectedSceneId) return;
    if (selectedScene?.propIds.includes(propId)) {
      unlinkPropFromScene(propId, selectedSceneId);
    } else {
      linkPropToScene(propId, selectedSceneId);
    }
  };

  const handleAddCharacter = () => {
    if (newCharName.trim()) {
      addCharacter(newCharName.trim(), '', '');
      setNewCharName('');
      setShowAddChar(false);
    }
  };

  const handleAddProp = () => {
    if (newPropName.trim()) {
      addProp(newPropName.trim(), '', '');
      setNewPropName('');
      setShowAddProp(false);
    }
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleClose = () => {
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    if (descTimerRef.current) clearTimeout(descTimerRef.current);
    if (selectedSceneId && selectedScene) {
      if (localTitle !== selectedScene.title) {
        updateScene(selectedSceneId, { title: localTitle });
      }
      if (localDesc !== selectedScene.description) {
        updateScene(selectedSceneId, { description: localDesc });
      }
    }
    selectScene(null);
  };

  return (
    <aside className={`side-panel ${isOpen ? 'open' : ''}`}>
      <div className="side-panel-header">
        <h2 className="side-panel-title">
          {selectedScene ? '编辑场景' : '场景详情'}
        </h2>
        <button className="side-panel-close" onClick={handleClose} title="关闭">
          ✕
        </button>
      </div>

      <div className="side-panel-content">
        {selectedScene ? (
          <>
            <div className="form-group">
              <label className="form-label">标题</label>
              <input
                type="text"
                className="form-input"
                value={localTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                placeholder="输入场景标题"
              />
            </div>

            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea
                className="form-textarea"
                value={localDesc}
                onChange={handleDescChange}
                onBlur={handleDescBlur}
                placeholder="输入场景描述..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">关联角色</label>
              <div className="multi-select-list">
                {characters.length === 0 ? (
                  <div className="empty-state">暂无角色</div>
                ) : (
                  characters.map((char) => (
                    <div
                      key={char.id}
                      className={`multi-select-item ${
                        selectedScene.characterIds.includes(char.id)
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() => toggleCharacter(char.id)}
                    >
                      <div className="multi-select-checkbox">
                        {selectedScene.characterIds.includes(char.id) && '✓'}
                      </div>
                      <div
                        className="multi-select-avatar"
                        style={{ backgroundColor: char.color }}
                      >
                        {getInitial(char.name)}
                      </div>
                      <span className="multi-select-name">{char.name}</span>
                    </div>
                  ))
                )}
              </div>

              {showAddChar ? (
                <div
                  style={{ marginTop: '8px', display: 'flex', gap: '6px' }}
                >
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1, fontSize: '12px', padding: '6px 8px' }}
                    placeholder="角色名称"
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCharacter();
                    }}
                    autoFocus
                  />
                  <button
                    className="card-action-btn"
                    style={{ width: '36px', height: '36px' }}
                    onClick={handleAddCharacter}
                  >
                    ✓
                  </button>
                  <button
                    className="card-action-btn"
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => {
                      setShowAddChar(false);
                      setNewCharName('');
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  className="add-item-btn"
                  onClick={() => setShowAddChar(true)}
                >
                  + 添加新角色
                </button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">关联道具</label>
              <div className="multi-select-list">
                {props.length === 0 ? (
                  <div className="empty-state">暂无道具</div>
                ) : (
                  props.map((prop) => (
                    <div
                      key={prop.id}
                      className={`multi-select-item ${
                        selectedScene.propIds.includes(prop.id)
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() => toggleProp(prop.id)}
                    >
                      <div className="multi-select-checkbox">
                        {selectedScene.propIds.includes(prop.id) && '✓'}
                      </div>
                      <div className="multi-select-icon">{prop.icon}</div>
                      <span className="multi-select-name">{prop.name}</span>
                    </div>
                  ))
                )}
              </div>

              {showAddProp ? (
                <div
                  style={{ marginTop: '8px', display: 'flex', gap: '6px' }}
                >
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1, fontSize: '12px', padding: '6px 8px' }}
                    placeholder="道具名称"
                    value={newPropName}
                    onChange={(e) => setNewPropName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddProp();
                    }}
                    autoFocus
                  />
                  <button
                    className="card-action-btn"
                    style={{ width: '36px', height: '36px' }}
                    onClick={handleAddProp}
                  >
                    ✓
                  </button>
                  <button
                    className="card-action-btn"
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => {
                      setShowAddProp(false);
                      setNewPropName('');
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  className="add-item-btn"
                  onClick={() => setShowAddProp(true)}
                >
                  + 添加新道具
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p style={{ marginBottom: '8px' }}>选择一个场景进行编辑</p>
            <p style={{ fontSize: '12px' }}>
              点击画布上的场景卡片，或点击"添加场景"创建新场景
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
