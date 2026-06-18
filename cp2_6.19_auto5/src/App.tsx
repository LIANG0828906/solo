import { useEffect, useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from './store';
import Sidebar from './Sidebar';
import SnippetManager from './SnippetManager';
import EditPanel from './EditPanel';

export default function App() {
  const setMobileView = useStore(s => s.setMobileView);
  const openCreatePanel = useStore(s => s.openCreatePanel);

  useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setMobileView]);

  return (
    <div className="app-layout">
      <Sidebar />
      <SnippetManager />
      <EditPanel />
      <button
        className="add-snippet-btn"
        onClick={openCreatePanel}
        title="新建片段"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
