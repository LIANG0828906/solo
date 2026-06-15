import React from 'react';
import { TabProvider } from '@/context/TabContext';
import TabBar from '@/components/TabBar';
import TabPanel from '@/components/TabPanel';
import BookmarkManager from '@/components/BookmarkManager';
import './App.css';

const App: React.FC = () => {
  return (
    <TabProvider>
      <div className="app-container">
        <header className="app-header">
          <TabBar />
          <BookmarkManager />
        </header>
        <main className="app-main">
          <TabPanel />
        </main>
      </div>
    </TabProvider>
  );
};

export default App;
