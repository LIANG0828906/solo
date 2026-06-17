import React from 'react';
import ReactDOM from 'react-dom/client';
import Navbar from './components/Navbar';
import DreamTimeline from './components/DreamTimeline';
import DreamMap from './components/DreamMap';
import DreamEditor from './components/DreamEditor';
import './index.css';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <DreamTimeline />
        <DreamMap />
      </div>
      <DreamEditor />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
