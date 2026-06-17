import React from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { CharacterCard } from './CharacterCard';
import { Plus } from 'lucide-react';

interface CharacterListProps {
  onAddCharacter: () => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({ onAddCharacter }) => {
  const characters = useCharacterStore((s) => s.characters);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);

  return (
    <div className="character-list">
      <div className="list-header">
        <h2 className="list-title">角色列表</h2>
        <button className="add-character-btn" onClick={onAddCharacter}>
          <Plus size={18} />
          <span>创造角色</span>
        </button>
      </div>
      <div className="list-content">
        {characters.length === 0 ? (
          <div className="empty-state">
            <p>还没有角色</p>
            <p className="empty-hint">点击上方按钮创建第一个角色</p>
          </div>
        ) : (
          characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              isSelected={selectedCharacterId === character.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CharacterList;
