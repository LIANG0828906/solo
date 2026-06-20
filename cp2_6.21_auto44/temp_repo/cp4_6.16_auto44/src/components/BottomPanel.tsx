import { useState, useRef, useEffect } from 'react';
import { useStoryStore } from '@/store/storyStore';

type TabType = 'characters' | 'props';

export default function BottomPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [showAddChar, setShowAddChar] = useState(false);
  const [showAddProp, setShowAddProp] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newPropName, setNewPropName] = useState('');
  const charInputRef = useRef<HTMLInputElement>(null);
  const propInputRef = useRef<HTMLInputElement>(null);

  const characters = useStoryStore((state) => state.characters);
  const props = useStoryStore((state) => state.props);
  const selectedSceneId = useStoryStore((state) => state.selectedSceneId);
  const scenes = useStoryStore((state) => state.scenes);
  const isInitialized = useStoryStore((state) => state.isInitialized);
  const linkCharacterToScene = useStoryStore((state) => state.linkCharacterToScene);
  const linkPropToScene = useStoryStore((state) => state.linkPropToScene);
  const addCharacter = useStoryStore((state) => state.addCharacter);
  const addProp = useStoryStore((state) => state.addProp);
  const unlinkCharacterFromScene = useStoryStore(
    (state) => state.unlinkCharacterFromScene
  );
  const unlinkPropFromScene = useStoryStore((state) => state.unlinkPropFromScene);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  useEffect(() => {
    if (showAddChar && charInputRef.current) {
      charInputRef.current.focus();
    }
  }, [showAddChar]);

  useEffect(() => {
    if (showAddProp && propInputRef.current) {
      propInputRef.current.focus();
    }
  }, [showAddProp]);

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleCharacterClick = (charId: string) => {
    if (!isInitialized || !selectedSceneId) return;
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;

    if (scene.characterIds.includes(charId)) {
      unlinkCharacterFromScene(charId, selectedSceneId);
    } else {
      linkCharacterToScene(charId, selectedSceneId);
    }
  };

  const handlePropClick = (propId: string) => {
    if (!isInitialized || !selectedSceneId) return;
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;

    if (scene.propIds.includes(propId)) {
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

  const handleCharKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCharacter();
    } else if (e.key === 'Escape') {
      setShowAddChar(false);
      setNewCharName('');
    }
  };

  const handlePropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddProp();
    } else if (e.key === 'Escape') {
      setShowAddProp(false);
      setNewPropName('');
    }
  };

  const isCharActive = (charId: string) => {
    return selectedScene?.characterIds.includes(charId) ?? false;
  };

  const isPropActive = (propId: string) => {
    return selectedScene?.propIds.includes(propId) ?? false;
  };

  return (
    <div className="bottom-panel">
      <div className="bottom-panel-tabs">
        <button
          className={`bottom-panel-tab ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => setActiveTab('characters')}
        >
          角色池
        </button>
        <button
          className={`bottom-panel-tab ${activeTab === 'props' ? 'active' : ''}`}
          onClick={() => setActiveTab('props')}
        >
          道具池
        </button>
      </div>

      <div className="bottom-panel-content">
        {activeTab === 'characters' ? (
          <>
            {characters.length === 0 ? (
              <div className="empty-state">
                暂无角色，点击下方按钮添加第一个角色
              </div>
            ) : (
              characters.map((char) => (
                <div
                  key={char.id}
                  className={`pool-item ${isCharActive(char.id) ? 'active' : ''} ${
                    !selectedSceneId ? 'disabled' : ''
                  }`}
                  onClick={() => handleCharacterClick(char.id)}
                  title={
                    selectedSceneId
                      ? isCharActive(char.id)
                        ? '点击取消关联'
                        : '点击关联到当前场景'
                      : '请先选择一个场景'
                  }
                >
                  <div
                    className="pool-item-avatar"
                    style={{ backgroundColor: char.color }}
                  >
                    {getInitial(char.name)}
                  </div>
                  <span className="pool-item-name">{char.name}</span>
                </div>
              ))
            )}
            {showAddChar ? (
              <div className="pool-add-form">
                <input
                  ref={charInputRef}
                  type="text"
                  className="pool-add-input"
                  placeholder="角色名称"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  onKeyDown={handleCharKeyDown}
                />
                <div className="pool-add-actions">
                  <button
                    className="pool-add-confirm"
                    onClick={handleAddCharacter}
                  >
                    ✓
                  </button>
                  <button
                    className="pool-add-cancel"
                    onClick={() => {
                      setShowAddChar(false);
                      setNewCharName('');
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="pool-add-btn"
                onClick={() => setShowAddChar(true)}
              >
                <span className="pool-add-btn-icon">+</span>
                <span className="pool-add-btn-text">添加角色</span>
              </button>
            )}
          </>
        ) : (
          <>
            {props.length === 0 ? (
              <div className="empty-state">
                暂无道具，点击下方按钮添加第一个道具
              </div>
            ) : (
              props.map((prop) => (
                <div
                  key={prop.id}
                  className={`pool-item ${isPropActive(prop.id) ? 'active' : ''} ${
                    !selectedSceneId ? 'disabled' : ''
                  }`}
                  onClick={() => handlePropClick(prop.id)}
                  title={
                    selectedSceneId
                      ? isPropActive(prop.id)
                        ? '点击取消关联'
                        : '点击关联到当前场景'
                      : '请先选择一个场景'
                  }
                >
                  <div className="pool-item-icon">{prop.icon}</div>
                  <span className="pool-item-name">{prop.name}</span>
                </div>
              ))
            )}
            {showAddProp ? (
              <div className="pool-add-form">
                <input
                  ref={propInputRef}
                  type="text"
                  className="pool-add-input"
                  placeholder="道具名称"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  onKeyDown={handlePropKeyDown}
                />
                <div className="pool-add-actions">
                  <button className="pool-add-confirm" onClick={handleAddProp}>
                    ✓
                  </button>
                  <button
                    className="pool-add-cancel"
                    onClick={() => {
                      setShowAddProp(false);
                      setNewPropName('');
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="pool-add-btn"
                onClick={() => setShowAddProp(true)}
              >
                <span className="pool-add-btn-icon">+</span>
                <span className="pool-add-btn-text">添加道具</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
