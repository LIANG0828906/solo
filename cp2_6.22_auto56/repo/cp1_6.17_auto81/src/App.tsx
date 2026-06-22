import { Routes, Route, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DetailPage } from './pages/DetailPage';
import './App.css';

function App() {
  const location = useLocation();

  return (
    <div className="app">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/palette/:id" element={<DetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
