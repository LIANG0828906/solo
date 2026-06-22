import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStory } from '../context/StoryContext';
import { TYPE_LABELS, TYPE_COLORS } from '../storyData/storyFragment';
import { StoryFragment } from '../eventBus';

export const DetailPanel: React.FC = () => {
  const {
    selectedFragment,
    selectedNodeId,
    updateFragment,
    getNodeConnections,
    graphNodes,
    fragments,
    startPlayback,
    stopPlayback,
    isPlaybackMode,
  } = useStory();

  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<StoryFragment['type']>('character');

  useEffect(() => {
    if (selectedFragment) {
      setEditContent(selectedFragment.content);
      setEditType(selectedFragment.type);
    }
  }, [selectedFragment]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditType(e.target.value as StoryFragment['type']);
  };

  const handleSave = () => {
    if (selectedFragment) {
      updateFragment(selectedFragment.id, {
        content: editContent,
        type: editType,
      });
    }
  };

  const connections = selectedNodeId ? getNodeConnections(selectedNodeId) : [];

  const getConnectedNodeNames = () => {
    return connections.map((link) => {
      const otherId = link.source === selectedNodeId ? link.target : link.source;
      const otherFragment = fragments.find((f) => f.id === otherId);
      return otherFragment?.content || '未知';
    });
  };

  const connectedNames = getConnectedNodeNames();

  const nodeCount = graphNodes.length;

  return (
    <div
      style={{
        width: 320,
        backgroundColor: '#F0F0F0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E0E0E0',
          backgroundColor: '#FFFFFF',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: '#333333',
          }}
        >
          详情编辑
        </h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <AnimatePresence mode="wait">
          {selectedFragment ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#666666',
                  }}
                >
                  碎片类型
                </label>
                <select
                  value={editType}
                  onChange={handleTypeChange}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #E0E0E0',
                    fontSize: 14,
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="character">角色</option>
                  <option value="scene">场景</option>
                  <option value="plot-twist">情节转折</option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#666666',
                  }}
                >
                  碎片内容
                </label>
                <textarea
                  value={editContent}
                  onChange={handleContentChange}
                  rows={6}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #E0E0E0',
                    fontSize: 14,
                    backgroundColor: '#FFFFFF',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                  }}
                  placeholder="输入故事碎片内容..."
                />
              </div>

              <motion.button
                onClick={handleSave}
                whileHover={{ filter: 'brightness(1.1)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#FF6F61',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                保存修改
              </motion.button>

              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid #E0E0E0',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#333333',
                  }}
                >
                  连接关系 ({connections.length})
                </h4>
                {connectedNames.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {connectedNames.map((name, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#FFFFFF',
                          borderRadius: 6,
                          fontSize: 12,
                          color: '#555555',
                          border: '1px solid #E8E8E8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {name}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#999999',
                      fontStyle: 'italic',
                    }}
                  >
                    暂无连接
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                color: '#999999',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>👆</div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>点击脉络图中的节点</div>
              <div style={{ fontSize: 12 }}>查看和编辑碎片详情</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        style={{
          padding: 16,
          borderTop: '1px solid #E0E0E0',
          backgroundColor: '#FFFFFF',
        }}
      >
        <motion.button
          onClick={isPlaybackMode ? stopPlayback : startPlayback}
          whileHover={{ filter: 'brightness(1.1)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.1 }}
          disabled={nodeCount === 0}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: nodeCount === 0 ? '#CCCCCC' : '#6BCB77',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 500,
            cursor: nodeCount === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {isPlaybackMode ? '⏹ 停止回放' : '▶ 回放构建过程'}
        </motion.button>
        {nodeCount === 0 && (
          <div
            style={{
              fontSize: 11,
              color: '#999999',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            先添加节点到脉络图
          </div>
        )}
      </div>
    </div>
  );
};
