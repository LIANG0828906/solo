import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ItineraryPanel from './components/ItineraryPanel';
import AttractionModal from './components/AttractionModal';
import './index.css';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container fade-transition">
          <Routes>
            <Route path="/" element={<ItineraryPanel />} />
            <Route path="*" element={<ItineraryPanel />} />
          </Routes>
          <AttractionModal />
        </div>
      </Router>
    </AppProvider>
  );
}
