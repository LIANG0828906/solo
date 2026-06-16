import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import DocumentList from './document/DocumentList';
import DocumentEditor from './document/DocumentEditor';
import NotificationBar from './components/NotificationBar';
import { useAppStore } from './store';

function App() {
  const initData = useAppStore((state) => state.initData);

  useEffect(() => {
    initData();
  }, [initData]);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<DocumentList />} />
        <Route path="/document/:id" element={<DocumentEditor />} />
      </Routes>
      <NotificationBar />
    </div>
  );
}

export default App;
