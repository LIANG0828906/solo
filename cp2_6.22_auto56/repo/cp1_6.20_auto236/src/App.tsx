import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import HistoryPreview from './pages/HistoryPreview';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/editor/:templateId" element={<Editor />} />
        <Route path="/history/:historyId" element={<HistoryPreview />} />
      </Routes>
    </div>
  );
}

export default App;
