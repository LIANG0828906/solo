import React from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { FACTION_COLORS, FACTION_LABELS } from '../types';
import { InventoryPanel } from './InventoryPanel';
import { Edit, Trash2 } from 'lucide-react';

interface CharacterDetailProps {
  onEdit: () => void;
}

export const CharacterDetail: React.FC<CharacterDetailProps> = ({ onEdit }) => {
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const characters = useCharacterStore((s) => s.characters);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);

  const character = characters.find((c) => c.id === selectedCharacterId);

  if (!character) {
    return (
      <div className="character-detail empty">
        <div className="empty-detail">
          <p>选择一个角色查看详情</p>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm(`确定要删除角色「${character.name}」吗？`)) {
      deleteCharacter(character.id);
    }
  };

  return (
    <div className="character-detail" id="character-detail-panel">
      <div className="detail-header">
        <div className="detail-avatar">
          {character.avatar ? (
            <img src={character.avatar} alt={character.name} />
          ) : (
            <div
              className="avatar-placeholder large"
              style={{ backgroundColor: FACTION_COLORS[character.faction] }}
            >
              {character.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="detail-info">
          <h2 className="detail-name">{character.name}</h2>
          <div className="detail-meta">
            <span className="detail-age">{character.age} 岁</span>
            <span
              className="detail-faction"
              style={{
                color: FACTION_COLORS[character.faction],
                borderColor: FACTION_COLORS[character.faction],
              }}
            >
              {FACTION_LABELS[character.faction]}
            </span>
          </div>
        </div>
        <div className="detail-actions">
          <button className="icon-btn edit-btn" onClick={onEdit} title="编辑">
            <Edit size={16} />
          </button>
          <button className="icon-btn delete-btn" onClick={handleDelete} title="删除">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="section-title">性格标签</h3>
        <div className="personality-tags">
          {character.personality.map((tag) => (
            <span key={tag} className="personality-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="detail-section">
        <h3 className="section-title">外貌描述</h3>
        <p className="section-content">{character.appearance || '暂无描述'}</p>
      </div>

      <div className="detail-section">
        <h3 className="section-title">背景故事</h3>
        <div
          className="section-content background"
          dangerouslySetInnerHTML={{ __html: character.background || '暂无背景故事' }}
        />
      </div>

      <InventoryPanel
        items={character.inventory}
        characterId={character.id}
      />

      <div className="detail-stats">
        <span className="stats-label">属性点</span>
        <span className="stats-value">{character.stats}</span>
      </div>
    </div>
  );
};

export default CharacterDetail;
