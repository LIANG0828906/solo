import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { useRecipeStore } from './stores/recipeStore';
import './styles/global.css';

const initApp = () => {
  const state = useRecipeStore.getState();
  if (state.recipes.length === 0) {
    state.initRecipes();
  }
};

initApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
