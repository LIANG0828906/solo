import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import Home from './pages/Home';
import Maker from './pages/Maker';
import Detail from './pages/Detail';
import './components/Navbar.css';
import './components/MemeCard.css';
import './components/Toast.css';
import './components/ComponentPanel.css';
import './components/AdjustPanel.css';
import './components/Canvas.css';
import './components/PublishModal.css';
import './pages/Home.css';
import './pages/Maker.css';
import './pages/Detail.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/maker" element={<Maker />} />
        <Route path="/detail/:id" element={<Detail />} />
      </Routes>
      <Toast />
    </div>
  );
};

export default App;
