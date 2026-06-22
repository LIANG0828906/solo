import { useState, useEffect, useCallback } from 'react';
import PetList from './components/PetList';
import RecordPanel from './components/RecordPanel';
import type { Pet, PetRecord, RecordType } from './types';

const STORAGE_KEYS = {
  PETS: 'pet_care_pets',
  RECORDS: 'pet_care_records',
} as const;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function saveToStorage<T>(key: string, data: T): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, 0);
}

export default function App() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [records, setRecords] = useState<PetRecord[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedPets = loadFromStorage<Pet[]>(STORAGE_KEYS.PETS, []);
    const loadedRecords = loadFromStorage<PetRecord[]>(STORAGE_KEYS.RECORDS, []);
    setPets(loadedPets);
    setRecords(loadedRecords);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.PETS, pets);
    }
  }, [pets, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.RECORDS, records);
    }
  }, [records, isLoading]);

  const handleAddPet = useCallback((pet: Pet) => {
    setPets(prev => [pet, ...prev]);
  }, []);

  const handleDeletePet = useCallback((petId: string) => {
    setPets(prev => prev.filter(p => p.id !== petId));
    setRecords(prev => prev.filter(r => r.petId !== petId));
    if (selectedPetId === petId) {
      setSelectedPetId(null);
    }
  }, [selectedPetId]);

  const handleSelectPet = useCallback((petId: string) => {
    setSelectedPetId(petId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedPetId(null);
  }, []);

  const handleAddRecord = useCallback((record: PetRecord) => {
    setRecords(prev => [record, ...prev]);
  }, []);

  const getPetRecords = useCallback((petId: string, filterType?: RecordType | 'all') => {
    const petRecords = records.filter(r => r.petId === petId);
    if (filterType && filterType !== 'all') {
      return petRecords.filter(r => r.type === filterType);
    }
    return petRecords;
  }, [records]);

  const selectedPet = pets.find(p => p.id === selectedPetId) || null;

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="empty-state">
          <div className="empty-state-icon">🐾</div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          🐾 宠物<span>投喂与行为记录</span>
        </h1>
        {selectedPet && (
          <button className="back-btn" onClick={handleBack}>
            ← 返回宠物列表
          </button>
        )}
      </header>

      {selectedPet ? (
        <RecordPanel
          pet={selectedPet}
          records={getPetRecords(selectedPet.id)}
          allRecords={records}
          onAddRecord={handleAddRecord}
          onBack={handleBack}
        />
      ) : (
        <PetList
          pets={pets}
          records={records}
          onAddPet={handleAddPet}
          onDeletePet={handleDeletePet}
          onSelectPet={handleSelectPet}
        />
      )}
    </div>
  );
}
