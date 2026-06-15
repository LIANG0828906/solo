import { useMixerStore } from '@store/useStore';
import { useAudioEngine } from '@hooks/useAudioEngine';
import { TrackItem } from './TrackItem';
import { EffectType } from '@types/index';

export function TrackPanel() {
  const tracks = useMixerStore((state) => state.tracks);
  const selectedTrackId = useMixerStore((state) => state.selectedTrackId);
  const setSelectedTrackId = useMixerStore((state) => state.setSelectedTrackId);

  const { addTrack, addEffect, addTrackWithFile } = useAudioEngine();

  const handleAddTrack = () => {
    addTrack();
  };

  const handleEffectDrop = (trackId: string, effectType: EffectType, slotIndex: number) => {
    addEffect(trackId, effectType, slotIndex);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/') || file.name.match(/\.(wav|mp3)$/i)) {
        addTrackWithFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div
      style={{
        width: '320px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
      onDrop={handleFileDrop}
      onDragOver={handleDragOver}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
          轨道 ({tracks.length})
        </span>
        <button
          onClick={handleAddTrack}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
        >
          +
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {tracks.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '13px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎵</div>
            <p>暂无轨道</p>
            <p style={{ marginTop: '4px', fontSize: '11px', color: '#cbd5e1' }}>
              点击上传按钮或拖拽音频文件到此处
            </p>
          </div>
        ) : (
          tracks.map((track, index) => (
            <TrackItem
              key={track.id}
              track={track}
              index={index}
              isSelected={selectedTrackId === track.id}
              onSelect={setSelectedTrackId}
              onEffectDrop={handleEffectDrop}
            />
          ))
        )}
      </div>
    </div>
  );
}
