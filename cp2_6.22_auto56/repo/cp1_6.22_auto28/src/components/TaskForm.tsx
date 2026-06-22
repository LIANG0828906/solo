import { useState, useCallback } from 'react';
import type { Task } from '@/lib/api';

interface TaskFormProps {
  onSubmit: (data: { description: string; type: Task['type']; lat: number; lng: number }) => void;
  onPickLocation: () => void;
  pickedLocation: { lat: number; lng: number } | null;
  isPickingLocation: boolean;
}

const typeOptions: Array<{ value: Task['type']; label: string; color: string }> = [
  { value: 'daily', label: '日常', color: '#4A90D9' },
  { value: 'shopping', label: '购物', color: '#E67E22' },
  { value: 'study', label: '学习', color: '#27AE60' },
];

export default function TaskForm({ onSubmit, onPickLocation, pickedLocation, isPickingLocation }: TaskFormProps) {
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Task['type']>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!description.trim() || !pickedLocation) return;
      setIsSubmitting(true);
      onSubmit({
        description: description.trim(),
        type,
        lat: pickedLocation.lat,
        lng: pickedLocation.lng,
      });
      setDescription('');
      setType('daily');
      setIsSubmitting(false);
    },
    [description, type, pickedLocation, onSubmit]
  );

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 'var(--radius)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: 'popIn 0.3s ease-out',
      }}
    >
      <input
        type="text"
        placeholder="输入任务描述..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.25)',
          color: '#1a1a2e',
          fontSize: '14px',
          outline: 'none',
          transition: 'all 0.2s',
          backdropFilter: 'blur(8px)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.background = 'rgba(255,255,255,0.4)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255,255,255,0.3)';
          e.target.style.background = 'rgba(255,255,255,0.25)';
        }}
      />

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {typeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: type === opt.value ? `2px solid ${opt.color}` : '2px solid rgba(255,255,255,0.3)',
              background: type === opt.value ? `${opt.color}22` : 'rgba(255,255,255,0.15)',
              color: type === opt.value ? opt.color : '#555',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: type === opt.value ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: opt.color,
                display: 'inline-block',
              }}
            />
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={onPickLocation}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: isPickingLocation ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.3)',
            background: isPickingLocation ? 'rgba(230,126,34,0.2)' : 'rgba(255,255,255,0.15)',
            color: isPickingLocation ? 'var(--accent)' : '#444',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s',
            backdropFilter: 'blur(8px)',
          }}
        >
          {isPickingLocation
            ? pickedLocation
              ? `📍 ${pickedLocation.lat.toFixed(4)}, ${pickedLocation.lng.toFixed(4)}`
              : '🗺️ 点击地图选择位置...'
            : '🗺️ 拾取位置'}
        </button>

        <button
          type="submit"
          disabled={!description.trim() || !pickedLocation || isSubmitting}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: !description.trim() || !pickedLocation ? 'var(--gray-400)' : 'var(--accent)',
            color: 'white',
            cursor: !description.trim() || !pickedLocation ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(230,126,34,0.3)',
            transform: 'scale(1)',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          添加任务
        </button>
      </div>
    </form>
  );
}
