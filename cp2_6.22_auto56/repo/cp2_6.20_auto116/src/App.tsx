import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { DeckBuilder } from './pages/DeckBuilder';
import { BattlePage } from './pages/BattlePage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/deck-builder" element={<DeckBuilder />} />
        <Route path="/battle" element={<BattlePage />} />
      </Routes>
    </Router>
  );
}
