import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PetDetail from './pages/PetDetail';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pet/:id" element={<PetDetail />} />
      </Routes>
    </div>
  );
}

export default App;
