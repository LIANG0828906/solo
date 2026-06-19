import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SceneCard } from './SceneCard';
import { useStoryStore } from '../store/useStoryStore';
import { useAnalysisStore } from '../store/useAnalysisStore';

export const StoryPage: React.FC = () => {
  const { project, addAct, addScene, searchQuery, setSearchQuery } = useStoryStore();
  const { calculateConflictData } = useAnalysisStore();
  const [showAddAct, setShowAddAct] = useState(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActDesc, setNewActDesc] = useState('');
  const [addingSceneTo, setAddingSceneTo] = useState<string | null>(null);
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [newSceneDesc, setNewSceneDesc] = useState('');

  useEffect(() => {
    calculateConflictData();
  }, [project, calculateConflictData]);

  const handleAddAct = () => {
    if (newActTitle.trim()) {
      addAct({ title: newActTitle, description: newActDesc });
      setNewActTitle('');
      setNewActDesc('');
      setShowAddAct(false);
    }
  };

  const handleAddScene = (actId: string) => {
    if (newSceneTitle.trim() && project.contributors.length > 0) {
      addScene(actId, {
        title: newSceneTitle,
        description: newSceneDesc,
        ownerId: project.contributors[0].id,
      });
      setNewSceneTitle('');
      setNewSceneDesc('');
      setAddingSceneTo(null);
    }
  };

  const filteredActs = project.acts.filter(
    (act) =>
      !searchQuery ||
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.scenes.some((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="story-page" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#2C3E50' }}>
            {project.title}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#7F8C8D' }}>
            {project.description}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索幕次或场景..."
            style={{
              padding: '8px 14px',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              fontSize: '13px',
              width: '200px',
            }}
          />
          <button
            onClick={() => setShowAddAct(true)}
            style={{
            padding: '8px 16px',
            backgroundColor: '#1A1A2E',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
          >
            + 添加幕次
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAddAct && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #E0E0E0',
              padding: '20px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#2C3E50' }}>
              新建幕次
            </h3>
            <input
              type="text"
              value={newActTitle}
              onChange={(e) => setNewActTitle(e.target.value)}
              placeholder="幕次标题（如：第一幕：启程）"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '10px',
                boxSizing: 'border-box',
              }}
            />
            <textarea
              value={newActDesc}
              onChange={(e) => setNewActDesc(e.target.value)}
              placeholder="幕次描述（可选）"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                fontSize: '13px',
                minHeight: '60px',
                marginBottom: '12px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddAct(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#F5F6FA',
                  color: '#7F8C8D',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddAct}
                disabled={!newActTitle.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3498DB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: newActTitle.trim() ? 'pointer' : 'not-allowed',
                  opacity: newActTitle.trim() ? 1 : 0.5,
                }}
              >
                创建
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {filteredActs.map((act, actIndex) => (
          <motion.div
          key={act.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: actIndex * 0.05 }}
        >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#2C3E50' }}>
                  {act.title}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7F8C8D' }}>
                  {act.description || '暂无描述'} · {act.scenes.length} 个场景
                </p>
              </div>
              <button
                onClick={() => setAddingSceneTo(act.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: '#3498DB',
                border: '1px solid #3498DB',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
              >
                + 添加场景
              </button>
            </div>

            <AnimatePresence>
              {addingSceneTo === act.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      backgroundColor: '#F8F9FA',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    <input
                      type="text"
                      value={newSceneTitle}
                      onChange={(e) => setNewSceneTitle(e.target.value)}
                      placeholder="场景标题"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #E0E0E0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        marginBottom: '8px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="text"
                      value={newSceneDesc}
                      onChange={(e) => setNewSceneDesc(e.target.value)}
                      placeholder="场景描述（可选）"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #E0E0E0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        marginBottom: '10px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setAddingSceneTo(null)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'white',
                          color: '#7F8C8D',
                          border: '1px solid #E0E0E0',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleAddScene(act.id)}
                        disabled={!newSceneTitle.trim()}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#2ECC71',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: newSceneTitle.trim() ? 'pointer' : 'not-allowed',
                          opacity: newSceneTitle.trim() ? 1 : 0.5,
                        }}
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {act.scenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  actId={act.id}
                  contributors={project.contributors}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredActs.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#95A5A6',
          }}
        >
          <p style={{ fontSize: '16px' }}>暂无匹配的内容</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>
            点击上方"添加幕次"开始创作你的故事
          </p>
        </div>
      )}
    </div>
  );
};
