import { useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isToday, parseISO } from 'date-fns';
import type { Pet, PetSpecies, PetRecord } from '../types';
import { SPECIES_LABELS, CARD_GRADIENTS, AVATAR_COLORS, RECORD_TYPE_ICONS, RECORD_TYPE_LABELS, formatAge, getRelativeTime } from '../types';

interface PetListProps {
  pets: Pet[];
  records: PetRecord[];
  onAddPet: (pet: Pet) => void;
  onDeletePet: (petId: string) => void;
  onSelectPet: (petId: string) => void;
}

export default function PetList({
  pets,
  records: recordsFromProps,
  onAddPet,
  onDeletePet,
  onSelectPet,
}: PetListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState<PetSpecies>('dog');
  const [newPetAge, setNewPetAge] = useState('');
  const [newPetAgeMonths, setNewPetAgeMonths] = useState('');
  const [newestPetId, setNewestPetId] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<PetRecord[]>([]);

  const loadAllRecordsFromStorage = useCallback((): PetRecord[] => {
    try {
      const stored = localStorage.getItem('pet_care_records');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed as PetRecord[];
        }
      }
    } catch (e) {
      console.error('Failed to load records from localStorage:', e);
    }
    return [];
  }, []);

  const getAllPetRecordsSorted = useCallback((): PetRecord[] => {
    const combined = [...recordsFromProps, ...allRecords];
    const uniqueMap = new Map<string, PetRecord>();
    combined.forEach(record => {
      uniqueMap.set(record.id, record);
    });
    return Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [recordsFromProps, allRecords]);

  useEffect(() => {
    const stored = loadAllRecordsFromStorage();
    setAllRecords(stored);
  }, [loadAllRecordsFromStorage, recordsFromProps]);

  const getPetRecords = useCallback((petId: string) => {
    const sortedRecords = getAllPetRecordsSorted();
    return sortedRecords.filter(r => r.petId === petId);
  }, [getAllPetRecordsSorted]);

  const getPetRecentRecords = useCallback((petId: string, limit: number = 3) => {
    const petRecords = getPetRecords(petId);
    return petRecords.slice(0, limit);
  }, [getPetRecords]);

  const getUTCDate = (date: Date): Date => {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  };

  const isUTCToday = (timestamp: string): boolean => {
    const recordDate = parseISO(timestamp);
    const recordUTC = getUTCDate(recordDate);
    const nowUTC = getUTCDate(new Date());
    return isToday(new Date(
      recordUTC.getUTCFullYear(),
      recordUTC.getUTCMonth(),
      recordUTC.getUTCDate()
    )) || recordUTC.getTime() === nowUTC.getTime();
  };

  const getTodayStatus = useCallback((petId: string) => {
    const petRecords = getPetRecords(petId);
    const todayRecords = petRecords.filter(r => isUTCToday(r.timestamp));

    const hasFood = todayRecords.some(r => r.type === 'food');
    const hasWalk = todayRecords.some(r => r.type === 'walk');

    if (hasFood && hasWalk) {
      return { status: 'both' as const, color: '#9C27B0' };
    }
    if (hasFood) {
      return { status: 'fed' as const, color: '#4CAF50' };
    }
    if (hasWalk) {
      return { status: 'walked' as const, color: '#2196F3' };
    }
    return { status: 'none' as const, color: '#CCCCCC' };
  }, [getPetRecords, isUTCToday]);

  const handleAddPet = useCallback(() => {
    if (!newPetName.trim() || !newPetAge) return;

    const gradientIndex = Math.floor(Math.random() * CARD_GRADIENTS.length);
    const colorIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
    const months = newPetAgeMonths ? parseInt(newPetAgeMonths, 10) : 0;

    const newPet: Pet = {
      id: uuidv4(),
      name: newPetName.trim(),
      species: newPetSpecies,
      age: parseInt(newPetAge, 10),
      ageMonths: months > 0 ? months : undefined,
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
    setNewPetAgeMonths('');

    setTimeout(() => setNewestPetId(null), 300);
  }, [newPetName, newPetSpecies, newPetAge, newPetAgeMonths, onAddPet]);

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
          const recentRecords = getPetRecentRecords(pet.id, 3);
          const todayStatus = getTodayStatus(pet.id);
          
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
              
              <div
                className="pet-status-dot"
                style={{ backgroundColor: todayStatus.color }}
                title={
                  todayStatus.status === 'both'
                    ? '今天已喂食和遛弯'
                    : todayStatus.status === 'fed'
                    ? '今天已喂食'
                    : todayStatus.status === 'walked'
                    ? '今天已遛弯'
                    : '今天暂无活动记录'
                }
              />
              
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
                    {SPECIES_LABELS[pet.species]} · {formatAge(pet.age, pet.ageMonths)}
                  </p>
                </div>
              </div>
              
              <div className="pet-recent-activity">
                {recentRecords.length === 0 ? (
                  <p className="pet-recent-empty">暂无记录</p>
                ) : (
                  <div className="pet-recent-summary">
                    {recentRecords.map((record) => (
                      <div key={record.id} className="pet-recent-line">
                        <span className="pet-recent-icon">
                          {RECORD_TYPE_ICONS[record.type]}
                        </span>
                        <span className="pet-recent-type">
                          {RECORD_TYPE_LABELS[record.type]}
                        </span>
                        <span className="pet-recent-time">
                          {getRelativeTime(parseISO(record.timestamp))}
                        </span>
                      </div>
                    ))}
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
              <label>年龄</label>
              <div className="age-inputs">
                <div className="age-input-group">
                  <input
                    id="pet-age"
                    type="number"
                    min="0"
                    max="50"
                    value={newPetAge}
                    onChange={(e) => setNewPetAge(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="岁"
                  />
                  <span className="age-unit">岁</span>
                </div>
                <div className="age-input-group">
                  <input
                    id="pet-age-months"
                    type="number"
                    min="0"
                    max="11"
                    value={newPetAgeMonths}
                    onChange={(e) => setNewPetAgeMonths(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="月"
                  />
                  <span className="age-unit">个月</span>
                </div>
              </div>
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
