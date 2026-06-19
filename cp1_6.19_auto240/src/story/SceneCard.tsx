import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../components/Avatar';
import { useStoryStore } from '../store/useStoryStore';
import type { Scene, Contributor } from '../types';

interface SceneCardProps {
  scene: Scene;
  actId: string;
  contributors: Contributor[];
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene, actId, contributors }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newParagraph, setNewParagraph] = useState('');
  const [newAnnotation, setNewAnnotation] = useState('');
  const { addParagraph, addAnnotation, project } = useStoryStore();

  const owner = contributors.find((c) => c.id === scene.ownerId);

  const allAuthors = new Set<string>();
  scene.paragraphs.forEach((p) => allAuthors.add(p.authorId));
  scene.annotations.forEach((a) => allAuthors.add(a.authorId));
  const contributorsList = contributors.filter((c) => allAuthors.has(c.id));

  const handleAddParagraph = () => {
    if (newParagraph.trim() && project.contributors.length > 0) {
      addParagraph(actId, scene.id, newParagraph, project.contributors[0].id);
      setNewParagraph('');
    }
  };

  const handleAddAnnotation = () => {
    if (newAnnotation.trim() && project.contributors.length > 0) {
      addAnnotation(actId, scene.id, newAnnotation, project.contributors[0].id);
      setNewAnnotation('');
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #E0E0E0',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={() => setIsExpanded(!isExpanded)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '16px', color: '#2C3E50', fontWeight: 600 }}>
            {scene.title}
          </h4>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#7F8C8D' }}>
            {scene.description}
          </p>
        </div>
        {owner && (
          <Avatar name={owner.name} color={owner.avatarColor} size={36} />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
        <div style={{ display: 'flex', gap: '-4px' }}>
          {contributorsList.slice(0, 4).map((c) => (
            <div key={c.id} style={{ marginLeft: -4 }}>
              <Avatar name={c.name} color={c.avatarColor} size={24} />
            </div>
          ))}
        </div>
        <span style={{ fontSize: '12px', color: '#95A5A6' }}>
          {scene.paragraphs.length} 段落 · {scene.annotations.length} 批注
        </span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginTop: '16px', borderTop: '1px solid #EEE', paddingTop: '16px' }}>
              <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#2C3E50' }}>段落内容</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {scene.paragraphs.map((p) => {
                  const author = contributors.find((c) => c.id === p.authorId);
                  return (
                    <div
                      key={p.id}
                      style={{
                        backgroundColor: '#F8F9FA',
                        borderRadius: '8px',
                        padding: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {author && <Avatar name={author.name} color={author.avatarColor} size={24} />}
                        <span style={{ fontSize: '12px', color: '#7F8C8D', fontWeight: 500 }}>
                          {author?.name || '未知'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#BDC3C7' }}>{formatTime(p.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#34495E', lineHeight: 1.6 }}>
                        {p.content}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <textarea
                  value={newParagraph}
                  onChange={(e) => setNewParagraph(e.target.value.slice(0, 500))}
                  placeholder="添加新段落（最多500字）..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    resize: 'vertical',
                    minHeight: '60px',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleAddParagraph}
                  disabled={!newParagraph.trim()}
                  style={{
                    padding: '0 16px',
                    backgroundColor: '#3498DB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: newParagraph.trim() ? 'pointer' : 'not-allowed',
                    opacity: newParagraph.trim() ? 1 : 0.5,
                  }}
                >
                  添加
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#95A5A6', marginTop: '4px', textAlign: 'right' }}>
                {newParagraph.length}/500
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#2C3E50' }}>批注</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {scene.annotations.map((a) => {
                  const author = contributors.find((c) => c.id === a.authorId);
                  return (
                    <div
                      key={a.id}
                      style={{
                        backgroundColor: '#FFF8E1',
                        borderLeft: '3px solid #F39C12',
                        padding: '8px 12px',
                        borderRadius: '0 6px 6px 0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {author && <Avatar name={author.name} color={author.avatarColor} size={20} />}
                        <span style={{ fontSize: '11px', color: '#7F8C8D', fontWeight: 500 }}>
                          {author?.name || '未知'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#BDC3C7' }}>{formatTime(a.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#5D4037' }}>{a.content}</p>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newAnnotation}
                  onChange={(e) => setNewAnnotation(e.target.value.slice(0, 150))}
                  placeholder="添加批注（最多150字符）..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleAddAnnotation}
                  disabled={!newAnnotation.trim()}
                  style={{
                    padding: '0 14px',
                    backgroundColor: '#F39C12',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: newAnnotation.trim() ? 'pointer' : 'not-allowed',
                    opacity: newAnnotation.trim() ? 1 : 0.5,
                  }}
                >
                  批注
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#95A5A6', marginTop: '4px', textAlign: 'right' }}>
                {newAnnotation.length}/150
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
