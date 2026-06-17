import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { assessmentEngine } from './assessment/AssessmentEngine';
import App from './App';
import './styles/global.css';

assessmentEngine.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
