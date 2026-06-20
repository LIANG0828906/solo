import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppContextType, Plant, Photo, HealthStatus, SortBy, View } from './types';
import { loadPlants, savePlants, loadPhotos, savePhotos } from './utils/storage';
import { getPlantAge } from './utils/dateUtils';
import { generateMockData } from './utils/mockData';
import PlantList from './components/PlantList';
import PlantDetail from './components/PlantDetail';
import Dashboard from './components/Dashboard';
import AddPlantForm from './components/AddPlantForm';

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

const App: React.FC = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterStatus, setFilterStatus] = useState<HealthStatus | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedPlants = loadPlants();
    const storedPhotos = loadPhotos();
    
    if (storedPlants.length === 0) {
      const mockData = generateMockData();
      setPlants(mockData.plants);
      setPhotos(mockData.photos);
      savePlants(mockData.plants);
      savePhotos(mockData.photos);
    } else {
      setPlants(storedPlants);
      setPhotos(storedPhotos);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      savePlants(plants);
    }
  }, [plants, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      savePhotos(photos);
    }
  }, [photos, isInitialized]);

  const addPlant = useCallback((plantData: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newPlant: Plant = {
      ...plantData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    setPlants(prev => [newPlant, ...prev]);
  }, []);

  const deletePlant = useCallback((id: string) => {
    setPlants(prev => prev.filter(p => p.id !== id));
    setPhotos(prev => prev.filter(p => p.plantId !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setPlants(prev => prev.map(p => 
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  }, []);

  const addPhoto = useCallback((photoData: Omit<Photo, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newPhoto: Photo = {
      ...photoData,
      id: uuidv4(),
      createdAt: now
    };
    setPhotos(prev => [...prev, newPhoto]);
    setPlants(prev => prev.map(p =>
      p.id === photoData.plantId
        ? { ...p, coverPhoto: photoData.imageUrl, updatedAt: now }
        : p
    ));
  }, []);

  const toggleDashboard = useCallback(() => {
    setShowDashboard(prev => !prev);
  }, []);

  const navigate = useCallback((view: View, plantId?: string) => {
    setCurrentView(view);
    if (plantId) {
      setSelectedPlantId(plantId);
    }
    if (view === 'home') {
      setShowDashboard(false);
    }
  }, []);

  const getPlantPhotos = useCallback((plantId: string) => {
    return photos
      .filter(p => p.plantId === plantId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [photos]);

  const contextValue = useMemo<AppContextType>(() => ({
    plants,
    photos,
    sortBy,
    filterStatus,
    showDashboard,
    currentView,
    selectedPlantId,
    addPlant,
    deletePlant,
    toggleFavorite,
    addPhoto,
    setSortBy,
    setFilterStatus,
    toggleDashboard,
    navigate,
    getPlantPhotos,
    getPlantAge
  }), [
    plants, photos, sortBy, filterStatus, showDashboard, currentView, selectedPlantId,
    addPlant, deletePlant, toggleFavorite, addPhoto, toggleDashboard, navigate, getPlantPhotos
  ]);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <PlantList />;
      case 'detail':
        return selectedPlantId ? <PlantDetail plantId={selectedPlantId} /> : <PlantList />;
      case 'add':
        return <AddPlantForm />;
      default:
        return <PlantList />;
    }
  };

  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontSize: '24px',
        color: 'var(--color-primary-dark)'
      }}>
        <span className="animate-pulse">🌱 加载中...</span>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-container">
        {renderView()}
        {showDashboard && <Dashboard />}
      </div>
    </AppContext.Provider>
  );
};

export default App;
