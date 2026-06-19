import React from 'react';
import { motion } from 'framer-motion';
import { CharacterGraph } from '../analysis/CharacterGraph';
import { ConflictHeatmap } from '../analysis/ConflictHeatmap';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { useStoryStore } from '../store/useStoryStore';

export const OverviewPage: React.FC = () => {
  const { characters, relations, conflictData } = useAnalysisStore();
  const { project } = useStoryStore();

  const totalScenes = project.acts.reduce((sum, act) => sum + act.scenes.length, 0);
  const totalParagraphs = project.acts.reduce(
    (sum, act) => sum + act.scenes.reduce((s, scene) => s + scene.paragraphs.length, 0),
    0
  );
  const totalAnnotations = project.acts.reduce(
    (sum, act) => sum + act.scenes.reduce((s, scene) => s + scene.annotations.length, 0),
    0
  );

  const stats = [
    { label: '角色数', value: characters.length, color: '#3498DB' },
    { label: '关系数', value: relations.length, color: '#2ECC71' },
    { label: '场景数', value: totalScenes, color: '#F39C12' },
    { label: '冲突对', value: conflictData.length, color: '#E74C3C' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#2C3E50' }}>故事总览</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#7F8C8D' }}>
          角色关系与冲突分析
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #E0E0E0',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: stat.color,
                marginBottom: '4px',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '13px', color: '#7F8C8D' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E0E0E0',
            padding: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#2C3E50' }}>
            角色关系图谱
          </h3>
          <div style={{ height: '450px' }}>
            <CharacterGraph />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E0E0E0',
          padding: '20px',
          height: '500px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ConflictHeatmap />
      </motion.div>
    </div>
  );
};
