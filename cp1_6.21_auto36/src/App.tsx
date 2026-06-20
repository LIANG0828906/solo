import { useState } from 'react';
import Dashboard from './Dashboard';
import './App.css';

export default function App() {
  const [, setForce] = useState(0);
  return (
    <div className="app-root fade-in">
      <Dashboard key={Date.now()} onRefresh={() => setForce(x => x + 1)} />
    </div>
  );
}
