import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Pet, PetSpecies, PetRecord } from '../types';
import { SPECIES_LABELS, CARD_GRADIENTS, AVATAR_COLORS, RECORD_TYPE_ICONS } from '../types';

interface PetListProps {
  pets: Pet[];
  records: PetRecord[];
  onAddPet: (pet: Pet) => void;
  onDeletePet: (petId: string) => void;
  onSelectPet: (petId: string) => void;
}

export default function PetList({
  pets,
  records,
  onAddPet,
  onDeletePet,
  onSelectPet,
}: PetListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState<PetSpecies>('dog');
  const [newPetAge, setNewPetAge] = useState('');
  const [newestPetId, setNewestPetId] = useState<string | null>(null);

  const getPetRecordCount = useCallback((petId: string) => {
    return records.filter(r => r.petId === petId).length;
  }, [records]);

  const getPetRecentType = useCallback((petId: string) => {
    const petRecords = records.filter(r => r.petId === petId);
    if (petRecords.length === 0) return null;
    return petRecords[0].type;
  }, [records]);

  const handleAddPet = useCallback(() => {
    if (!newPetName.trim() || !newPetAge) return;

    const gradientIndex = Math.floor(Math.random() * CARD_GRADIENTS.length);
    const colorIndex = Math.floor(Math.random() * AVATAR_COLORS.length);

    const newPet: Pet = {
      id: uuidv4(),
      name: newPetName.trim(),
      species: newPetSpecies,
      age: parseInt(newPetAge, 10),
      avatarColor: AVATAR_COLORS[colorIndex],
      cardGradient: CARD_GRADIENTS[gradientIndex],
      createdAt: new Date().toISOString(),
    };

    onAddPet(newPet);
    setNewestPetId(newPet.id);
    setShowAddForm(false);
    setNewPetName('');
    setNewPetSpecies('dog');
    setNewPetAge('');

    setTimeout(() => setNewestPetId(null), 300);
  }, [newPetName, newPetSpecies, newPetAge, onAddPet]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPet();
    }
  }, [handleAddPet]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowAddForm(false);
    }
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent, petId: string) => {
    e.stopPropagation();
    const pet = pets.find(p => p.id === petId);
    if (pet && confirm(`确定要删除 ${pet.name} 吗？相关记录也会被删除。`)) {
      onDeletePet(petId);
    }
  }, [pets, onDeletePet]);

  const sortedPets = useMemo(() => {
    return [...pets].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [pets]);

  return (
    <div className="pet-list-container">
      <h2 className="section-title">我的宠物 ({pets.length})</h2>
      
      <div className="pet-grid">
        {sortedPets.map((pet) => {
          const recordCount = getPetRecordCount(pet.id);
          const recentType = getPetRecentType(pet.id);
          
          return (
            <div
              key={pet.id}
              className={`pet-card ${newestPetId === pet.id ? 'new-pet' : ''}`}
              style={{ '--card-gradient': pet.cardGradient } as React.CSSProperties}
              onClick={() => onSelectPet(pet.id)}
            >
              <button
                className="pet-delete-btn"
                onClick={(e) => handleDeleteClick(e, pet.id)}
                title="删除宠物"
              >
                ×
              </button>
              
              <div className="pet-card-header">
                <div
                  className="pet-avatar"
                  style={{ backgroundColor: pet.avatarColor }}
                >
                  {pet.name.charAt(0).toUpperCase()}
                </div>
                <div className="pet-info">
                  <h3>{pet.name}</h3>
                  <p>
                    {SPECIES_LABELS[pet.species]} · {pet.age}岁
                  </p>
                </div>
              </div>
              
              <div className="pet-stats">
                <div className="pet-stat">
                  📝 {recordCount} 条记录
                </div>
                {recentType && (
                  <div className="pet-stat">
                    最近: {RECORD_TYPE_ICONS[recentType]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="add-pet-btn" onClick={() => setShowAddForm(true)}>
          <div className="add-pet-icon">+</div>
          <span>添加新宠物</span>
        </div>
      </div>

      {showAddForm && (
        <div className="add-pet-form-overlay" onClick={handleOverlayClick}>
          <div className="add-pet-form" onClick={(e) => e.stopPropagation()}>
            <h3 className="form-title">添加新宠物</h3>
            
            <div className="form-group">
              <label htmlFor="pet-name">宠物名称</label>
              <input
                id="pet-name"
                type="text"
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="请输入宠物名称"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="pet-species">种类</label>
              <select
                id="pet-species"
                value={newPetSpecies}
                onChange={(e) => setNewPetSpecies(e.target.value as PetSpecies)}
              >
                {Object.entries(SPECIES_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label as string}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="pet-age">年龄</label>
              <input
                id="pet-age"
                type="number"
                min="0"
                max="50"
                value={newPetAge}
                onChange={(e) => setNewPetAge(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="请输入年龄"
              />
            </div>
            
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddPet}
                disabled={!newPetName.trim() || !newPetAge}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
