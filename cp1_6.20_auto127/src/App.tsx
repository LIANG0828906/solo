import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TemplateSelector from './components/TemplateSelector';
import Editor from './components/Editor';
import VersionPanel from './components/VersionPanel';
import CompareView from './components/CompareView';
import type { Template } from './types';

function AppContent() {
  const { view, setView, setTemplates, compareVersionIds, project } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const templates: Template[] = await response.json();
          setTemplates(templates);
        } else {
          throw new Error('Failed to load templates');
        }
      } catch (error) {
        console.error('Failed to load templates from API:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [setTemplates]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        加载中...
      </div>
    );
  }

  const isCompareMode = compareVersionIds.length >= 2;

  return (
    <div className="app">
      {view === 'templates' && <TemplateSelector />}
      {view === 'editor' && !isCompareMode && (
        <>
          <Editor />
          {project && <VersionPanel />}
        </>
      )}
      {view === 'editor' && isCompareMode && <CompareView />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
