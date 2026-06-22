import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Collection from '@/pages/Collection';
import Battle from '@/pages/Battle';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Collection />} />
        <Route path="/battle" element={<Battle />} />
      </Routes>
    </Router>
  );
}
