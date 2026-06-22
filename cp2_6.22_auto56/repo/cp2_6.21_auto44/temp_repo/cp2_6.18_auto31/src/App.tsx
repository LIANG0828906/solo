import { useMoodStore } from './store';
import { MOOD_THEME, DEFAULT_GRADIENT } from './types';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';

function App() {
  const { entries, selectedId, sidebarOpen } = useMoodStore();

  const selectedEntry = entries.find((e) => e.id === selectedId) || null;

  const gradientStart = selectedEntry ? selectedEntry.color : DEFAULT_GRADIENT.start;
  const gradientEnd = selectedEntry
    ? MOOD_THEME[selectedEntry.mood].gradientEnd
    : DEFAULT_GRADIENT.end;

  const currentColor = selectedEntry ? selectedEntry.color : DEFAULT_GRADIENT.start;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        gradientStart={gradientStart}
        gradientEnd={gradientEnd}
        selectedEntry={selectedEntry}
      />
      <Sidebar
        entries={entries}
        selectedId={selectedId}
        open={sidebarOpen}
        currentColor={currentColor}
      />
    </div>
  );
}

export default App;
