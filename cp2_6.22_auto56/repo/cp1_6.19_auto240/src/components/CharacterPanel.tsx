import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../components/Avatar';
import { useAnalysisStore } from '../store/useAnalysisStore';
import type { RelationType } from '../types';

const avatarColors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];
const relationTypes: { type: RelationType; label: string; color: string }[] = [
  { type: 'ally', label: '盟友', color: '#2ECC71' },
  { type: 'enemy', label: '敌人', color: '#E74C3C' },
  { type: 'lover', label: '恋人', color: '#F1C40F' },
  { type: 'stranger', label: '陌生人', color: '#95A5A6' },
];

export const CharacterPanel: React.FC = () => {
  const { characters, relations, addCharacter, removeCharacter, addRelation, removeRelation } =
    useAnalysisStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(avatarColors[0]);
  const [newTags, setNewTags] = useState('');
  const [selectedChar1, setSelectedChar1] = useState<string | null>(null);
  const [showRelationForm, setShowRelationForm] = useState(false);
  const [newRelationType, setNewRelationType] = useState<RelationType>('ally');
  const [newRelationDesc, setNewRelationDesc] = useState('');

  const handleAddCharacter = () => {
    if (newName.trim()) {
      const tags = newTags
        .split(/[,，、]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5);
      addCharacter({ name: newName.trim(), avatarColor: newColor, tags });
      setNewName('');
      setNewColor(avatarColors[0]);
      setNewTags('');
      setShowAddForm(false);
    }
  };

  const handleAddRelation = () => {
    if (selectedChar1 && newRelationType) {
      addRelation(selectedChar1, selectedChar1, newRelationType, newRelationDesc);
      setSelectedChar1(null);
      setNewRelationType('ally');
      setNewRelationDesc('');
      setShowRelationForm(false);
    }
  };

  const handleCharacterClick = (charId: string) => {
    if (!showRelationForm) {
      setSelectedChar1(charId);
      setShowRelationForm(true);
    } else if (selectedChar1 && selectedChar1 !== charId) {
      addRelation(selectedChar1, charId, newRelationType, newRelationDesc);
      setSelectedChar1(null);
      setShowRelationForm(false);
      setNewRelationType('ally');
      setNewRelationDesc('');
    } else {
      setSelectedChar1(null);
      setShowRelationForm(false);
    }
  };

  const getCharacterRelations = (charId: string) => {
    return relations.filter(
      (r) => r.characterId1 === charId || r.characterId2 === charId
    );
  };

  return (
    <div
      style={{
        width: '320px',
        backgroundColor: '#2C3E50',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>角色档案库</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              width: '28px',
              height: '28px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          共 {characters.length} 个角色
        </p>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="角色名称"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '10px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                }}
              />
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  头像颜色
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {avatarColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: newColor === color ? '2px solid white' : '2px solid transparent',
                        backgroundColor: color,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="性格标签（用逗号分隔，最多5个）"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '10px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleAddCharacter}
                  disabled={!newName.trim()}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: newName.trim() ? 'pointer' : 'not-allowed',
                    backgroundColor: '#3498DB',
                    color: 'white',
                    opacity: newName.trim() ? 1 : 0.5,
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRelationForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
                选择第二个角色创建关系
              </div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {relationTypes.map((rt) => (
                  <button
                    key={rt.type}
                    onClick={() => setNewRelationType(rt.type)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      borderRadius: '12px',
                      border: newRelationType === rt.type ? `1px solid ${rt.color}` : '1px solid transparent',
                      backgroundColor: newRelationType === rt.type ? rt.color : 'rgba(255,255,255,0.1)',
                      color: newRelationType === rt.type ? 'white' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                    }}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newRelationDesc}
                onChange={(e) => setNewRelationDesc(e.target.value)}
                placeholder="关系描述（可选）"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {characters.map((char) => {
            const charRelations = getCharacterRelations(char.id);
            const isSelected = selectedChar1 === char.id;
            return (
              <motion.div
                key={char.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                onClick={() => handleCharacterClick(char.id)}
                style={{
                  backgroundColor: isSelected ? 'rgba(52, 152, 219, 0.3)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  padding: '12px',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #3498DB' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar name={char.name} color={char.avatarColor} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                      {char.name}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {char.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255,255,255,0.15)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCharacter(char.id);
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'rgba(255,255,255,0.4)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    ×
                  </button>
                </div>
                {charRelations.length > 0 && (
                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
                      关系 ({charRelations.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {charRelations.map((rel) => {
                        const otherCharId =
                          rel.characterId1 === char.id ? rel.characterId2 : rel.characterId1;
                        const otherChar = characters.find((c) => c.id === otherCharId);
                        const rt = relationTypes.find((r) => r.type === rel.type);
                        if (!otherChar) return null;
                        return (
                          <div
                            key={rel.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              color: 'rgba(255,255,255,0.7)',
                            }}
                          >
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: rt?.color || '#95A5A6',
                              }}
                            />
                            <span>{otherChar.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>· {rt?.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {characters.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '13px',
            }}
          >
            <p>暂无角色</p>
            <p style={{ fontSize: '11px', marginTop: '6px' }}>点击 + 添加第一个角色</p>
          </div>
        )}
      </div>

      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        💡 点击角色可创建关系连线
      </div>
    </div>
  );
};
