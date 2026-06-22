import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { useStoryStore } from '../store/useStoryStore';
import type { MentionSnippet } from '../types';

const heatColors = ['#FFFFFF', '#FFEDA0', '#FEB24C', '#F03B20'];

const getHeatColor = (count: number, maxCount: number): string => {
  if (count === 0) return heatColors[0];
  const ratio = count / Math.max(1, maxCount);
  if (ratio <= 0.33) return heatColors[1];
  if (ratio <= 0.66) return heatColors[2];
  return heatColors[3];
};

export const ConflictHeatmap: React.FC = () => {
  const { conflictData } = useAnalysisStore();
  const { project } = useStoryStore();
  const [selectedCell, setSelectedCell] = useState<{ pairKey: string; sceneIndex: number } | null>(null);

  const allScenes = useMemo(() => {
    const scenes: { id: string; title: string; actTitle: string; index: number }[] = [];
    let idx = 0;
    for (const act of project.acts) {
      for (const scene of act.scenes) {
        scenes.push({
          id: scene.id,
          title: scene.title,
          actTitle: act.title,
          index: idx++,
        });
      }
    }
    return scenes;
  }, [project]);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const conflict of conflictData) {
      for (const sm of conflict.sceneMentions) {
        if (sm.count > max) max = sm.count;
      }
    }
    return max;
  }, [conflictData]);

  const totalColumns = 12;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getSnippetsForCell = (pairKey: string, sceneIndex: number): MentionSnippet[] => {
    const conflict = conflictData.find((c) => c.pairKey === pairKey);
    if (!conflict) return [];
    const scene = allScenes[sceneIndex];
    if (!scene) return [];
    const sceneMention = conflict.sceneMentions.find((sm) => sm.sceneId === scene.id);
    return sceneMention?.snippets || [];
  };

  const getCountForCell = (pairKey: string, sceneIndex: number): number => {
    const conflict = conflictData.find((c) => c.pairKey === pairKey);
    if (!conflict) return 0;
    const scene = allScenes[sceneIndex];
    if (!scene) return 0;
    const sceneMention = conflict.sceneMentions.find((sm) => sm.sceneId === scene.id);
    return sceneMention?.count || 0;
  };

  const handleCellClick = (pairKey: string, sceneIndex: number) => {
    const count = getCountForCell(pairKey, sceneIndex);
    if (count > 0) {
      setSelectedCell({ pairKey, sceneIndex });
    }
  };

  const selectedConflict = selectedCell
    ? conflictData.find((c) => c.pairKey === selectedCell.pairKey)
    : null;

  const selectedSnippets = selectedCell
    ? getSnippetsForCell(selectedCell.pairKey, selectedCell.sceneIndex)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#2C3E50' }}>
          角色冲突热力分析
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#7F8C8D' }}>
          共 {conflictData.length} 对角色关系 · {allScenes.length} 个场景
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E0E0E0',
          padding: '16px',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'inline-block', minWidth: '100%' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '120px repeat(12, 40px)',
                gap: '2px',
                alignItems: 'center',
              }}
            >
              <div></div>
              {Array.from({ length: Math.min(totalColumns, allScenes.length) }).map((_, i) => {
                const scene = allScenes[i];
                return (
                  <div
                    key={i}
                    style={{
                      fontSize: '10px',
                      color: '#95A5A6',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transform: 'rotate(-45deg)',
                      transformOrigin: 'left center',
                      height: '50px',
                    }}
                    title={scene?.title || `场景${i + 1}`}
                  >
                    {scene?.title || `S${i + 1}`}
                  </div>
                );
              })}
            </div>

            {conflictData.map((conflict) => (
              <div
                key={conflict.pairKey}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px repeat(12, 40px)',
                  gap: '2px',
                  alignItems: 'center',
                  marginTop: '4px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: '#2C3E50',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {conflict.char1Name} × {conflict.char2Name}
                </div>
                {Array.from({ length: Math.min(totalColumns, allScenes.length) }).map(
                  (_, i) => {
                    const count = getCountForCell(conflict.pairKey, i);
                    const color = getHeatColor(count, maxCount);
                    const isSelected =
                      selectedCell?.pairKey === conflict.pairKey &&
                      selectedCell?.sceneIndex === i;
                    return (
                      <div
                        key={i}
                        onClick={() => handleCellClick(conflict.pairKey, i)}
                        style={{
                          width: '40px',
                          height: '28px',
                          backgroundColor: color,
                          borderRadius: '4px',
                          cursor: count > 0 ? 'pointer' : 'default',
                          border: isSelected ? '2px solid #2C3E50' : 'none',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s ease',
                        }}
                        title={count > 0 ? `共现 ${count} 次` : '无共现'}
                      />
                    );
                  }
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '20px',
            fontSize: '11px',
            color: '#7F8C8D',
          }}
        >
          <span>低</span>
          <div
            style={{
              width: '120px',
              height: '12px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, #FFEDA0 0%, #FEB24C 50%, #F03B20 100%)',
            }}
          />
          <span>高</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedCell && selectedConflict && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '360px',
              width: '380px',
              maxHeight: '400px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid #E0E0E0',
              padding: '16px',
              overflowY: 'auto',
              zIndex: 100,
            }}
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
                <h4 style={{ margin: 0, fontSize: '14px', color: '#2C3E50' }}>
                  {selectedConflict.char1Name} × {selectedConflict.char2Name}
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#7F8C8D' }}>
                  {allScenes[selectedCell.sceneIndex]?.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                style={{
                  width: '24px',
                  height: '24px',
                  border: 'none',
                  backgroundColor: '#F5F6FA',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#7F8C8D',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  style={{
                    backgroundColor: '#F8F9FA',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: snippet.isParagraph ? '#3498DB' : '#F39C12',
                        color: 'white',
                      }}
                    >
                      {snippet.isParagraph ? '段落' : '批注'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#95A5A6' }}>
                      {formatTime(snippet.timestamp)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#34495E', lineHeight: 1.5 }}>
                    {snippet.content}
                  </p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#7F8C8D' }}>
                    📍 {snippet.scenePath}
                  </p>
                </div>
              ))}
            </div>

            {selectedSnippets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#95A5A6' }}>
                暂无共现片段
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
