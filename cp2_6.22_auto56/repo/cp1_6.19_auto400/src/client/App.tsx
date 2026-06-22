import React, { useState, useEffect } from 'react';
import { SongList } from './pages/SongList';
import { SongEditor } from './pages/SongEditor';
import { useSongStore } from './store/useSongStore';

type Route = 'list' | 'editor';

function App() {
  const [route, setRoute] = useState<Route>('list');
  const [currentSongId, setCurrentSongId] = useState<string>('');
  const { error, clearError } = useSongStore();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('/song/')) {
      const songId = hash.replace('/song/', '');
      setCurrentSongId(songId);
      setRoute('editor');
    }
  }, []);

  const handleSongSelect = (songId: string) => {
    setCurrentSongId(songId);
    setRoute('editor');
    window.location.hash = `/song/${songId}`;
  };

  const handleBack = () => {
    setRoute('list');
    setCurrentSongId('');
    window.location.hash = '';
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {route === 'list' && (
        <SongList onSongSelect={handleSongSelect} />
      )}
      {route === 'editor' && currentSongId && (
        <SongEditor songId={currentSongId} onBack={handleBack} />
      )}
    </div>
  );
}

export default App;
