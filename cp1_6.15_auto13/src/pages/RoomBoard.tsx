import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '@/store/useStore';
import RoomCard from '@/components/RoomCard';
import Skeleton from '@/components/Skeleton';

export default function RoomBoard() {
  const navigate = useNavigate();
  const { rooms, loading, fetchRooms, reorderRooms } = useStore();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId || isReordering) return;

    setIsReordering(true);
    const draggedIndex = rooms.findIndex((r) => r.id === draggedId);
    const targetIndex = rooms.findIndex((r) => r.id === targetId);

    const newRooms = [...rooms];
    const [draggedRoom] = newRooms.splice(draggedIndex, 1);
    newRooms.splice(targetIndex, 0, draggedRoom);
    const reordered = newRooms.map((r, i) => ({ ...r, order: i }));

    await reorderRooms(reordered);
    setIsReordering(false);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleCardClick = (id: string) => {
    if (!draggedId) {
      navigate(`/rooms/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-cream" style={{ padding: '32px' }}>
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-2" style={{ color: '#5A4524' }}>
          🏠 筑家 · 装修规划
        </h1>
        <p style={{ color: '#8B7355' }}>轻松管理装修预算与进度，拖拽卡片可调整房间顺序</p>
      </div>

      {loading ? (
        <div className="grid-rooms">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-card card-shadow overflow-hidden">
              <Skeleton aspectRatio="4/3" className="w-full" />
              <div className="p-4 space-y-2">
                <Skeleton width="60%" height={24} />
                <Skeleton width="30%" height={14} />
                <Skeleton width="100%" height={10} rounded />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-rooms">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={draggedId === room.id}
              isDragOver={dragOverId === room.id && draggedId !== room.id}
              onClick={() => handleCardClick(room.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
