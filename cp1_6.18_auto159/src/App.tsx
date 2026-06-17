import React from 'react';
import UploadPanel from '@/ui/UploadPanel';
import FilterSelector from '@/ui/FilterSelector';
import AlbumView from '@/ui/AlbumView';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <div className="left-panel">
        <UploadPanel />
        <FilterSelector />
      </div>
      <div className="right-panel">
        <AlbumView />
      </div>
    </div>
  );
};

export default App;
