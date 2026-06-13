import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { Layer, User, FilterType } from '../../shared/types';
import { wsManager } from '../utils/websocket';
import { v4 as uuidv4 } from 'uuid';

interface CollageContextType {
  layers: Layer[];
  users: User[];
  currentUser: User | null;
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  addLayer: (src: string, width: number, height: number) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  reorderLayer: (id: string, newIndex: number) => void;
  applyFilter: (layerId: string, filter: FilterType, intensity: number) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
}

const CollageContext = createContext<CollageContextType | undefined>(undefined);

export const CollageProvider: React.FC<{
  roomId: string;
  userName: string;
  children: ReactNode;
}> = ({ roomId, userName, children }) => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const localUpdateRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    wsManager.connect();

    const handleCurrentUser = (user: User) => {
      setCurrentUser(user);
    };

    const handleRoomState = (state: { layers: Layer[]; users: User[] }) => {
      setLayers(state.layers);
      setUsers(state.users);
    };

    const handleUserJoined = (user: User) => {
      setUsers((prev) => {
        if (prev.find((u) => u.id === user.id)) return prev;
        return [...prev, user];
      });
    };

    const handleUserLeft = (userId: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    const handleUsersUpdate = (newUsers: User[]) => {
      setUsers(newUsers);
    };

    const handleLayersUpdate = (newLayers: Layer[]) => {
      setLayers(newLayers);
    };

    wsManager.on('current-user', handleCurrentUser);
    wsManager.on('room-state', handleRoomState);
    wsManager.on('user-joined', handleUserJoined);
    wsManager.on('user-left', handleUserLeft);
    wsManager.on('users-update', handleUsersUpdate);
    wsManager.on('layers-update', handleLayersUpdate);

    wsManager.joinRoom(roomId, userName);

    return () => {
      wsManager.off('current-user', handleCurrentUser);
      wsManager.off('room-state', handleRoomState);
      wsManager.off('user-joined', handleUserJoined);
      wsManager.off('user-left', handleUserLeft);
      wsManager.off('users-update', handleUsersUpdate);
      wsManager.off('layers-update', handleLayersUpdate);
      wsManager.disconnect();
    };
  }, [roomId, userName]);

  const addLayer = useCallback(
    (src: string, width: number, height: number) => {
      const newLayer: Layer = {
        id: uuidv4(),
        src,
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width,
        height,
        rotation: 0,
        scale: 1,
        visible: true,
        filter: 'none',
        filterIntensity: 100,
        zIndex: layers.length,
      };
      setLayers((prev) => [...prev, newLayer]);
      wsManager.addLayer(newLayer);
      setSelectedLayerId(newLayer.id);
    },
    [layers.length]
  );

  const updateLayer = useCallback(
    (id: string, updates: Partial<Layer>) => {
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === id ? { ...layer, ...updates } : layer
        )
      );
      wsManager.updateLayer(id, updates);
    },
    []
  );

  const deleteLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== id));
    wsManager.deleteLayer(id);
    setSelectedLayerId((prev) => (prev === id ? null : prev));
  }, []);

  const reorderLayer = useCallback(
    (id: string, newIndex: number) => {
      setLayers((prev) => {
        const currentIndex = prev.findIndex((l) => l.id === id);
        if (currentIndex === -1) return prev;
        const newLayers = [...prev];
        const [layer] = newLayers.splice(currentIndex, 1);
        newLayers.splice(newIndex, 0, layer);
        return newLayers.map((l, i) => ({ ...l, zIndex: i }));
      });
      wsManager.reorderLayer(id, newIndex);
    },
    []
  );

  const applyFilter = useCallback(
    (layerId: string, filter: FilterType, intensity: number) => {
      updateLayer(layerId, { filter, filterIntensity: intensity });
    },
    [updateLayer]
  );

  const setLayerVisibility = useCallback(
    (id: string, visible: boolean) => {
      updateLayer(id, { visible });
    },
    [updateLayer]
  );

  return (
    <CollageContext.Provider
      value={{
        layers,
        users,
        currentUser,
        selectedLayerId,
        setSelectedLayerId,
        addLayer,
        updateLayer,
        deleteLayer,
        reorderLayer,
        applyFilter,
        setLayerVisibility,
      }}
    >
      {children}
    </CollageContext.Provider>
  );
};

export const useCollage = (): CollageContextType => {
  const context = useContext(CollageContext);
  if (!context) {
    throw new Error('useCollage must be used within a CollageProvider');
  }
  return context;
};
