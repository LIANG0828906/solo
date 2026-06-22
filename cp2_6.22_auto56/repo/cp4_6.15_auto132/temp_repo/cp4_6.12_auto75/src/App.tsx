import EditorPanel from '@/modules/editor/EditorPanel';
import TimelineCanvas from '@/modules/timeline/TimelineCanvas';
import EventCardEditor from '@/modules/editor/EventCardEditor';
import PlayerPanel from '@/modules/player/PlayerPanel';

export default function App() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#1a1a2e',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <EditorPanel />
        <TimelineCanvas />
        <EventCardEditor
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
          }}
        />
      </div>
      <PlayerPanel />
    </div>
  );
}
