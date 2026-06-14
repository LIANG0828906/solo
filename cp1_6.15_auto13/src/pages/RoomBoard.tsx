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

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const onDragStart = (id: string) => {
    setDraggedId(id);
  };

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      const newRooms = [...rooms];
      const draggedIndex = newRooms.findIndex((r) => r.id === draggedId);
      const targetIndex = newRooms.findIndex((r) => r.id === targetId);
      const [draggedRoom] = newRooms.splice(draggedIndex, 1);
      newRooms.splice(targetIndex, 0, draggedRoom);
      const newReorderedRooms = newRooms.map((r, i) => ({ id: r.id, order: i }));
      reorderRooms(newReorderedRooms as any);
    }
  };

  const onDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="min-h-screen bg-cream" style={{ padding: '32px' }}>
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-2" style={{ color: '#5A4524' }}>
          🏠 筑家 · 装修规划
        </h1>
        <p className="text-wood-500">轻松管理装修预算与进度</p>
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
            <div
              key={room.id}
              draggable
              onDragStart={() => onDragStart(room.id)}
              onDragOver={(e) => onDragOver(e, room.id)}
              onDrop={(e) => onDrop(e, room.id)}
              onDragEnd={onDragEnd}
              className={`${draggedId === room.id ? 'dragging' : ''} ${dragOverId === room.id ? 'drag-over' : ''}`}
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              <RoomCard room={room} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
