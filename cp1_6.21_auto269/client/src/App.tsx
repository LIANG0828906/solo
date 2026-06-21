import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RecipeList from './pages/RecipeList';
import RecipeDetail from './pages/RecipeDetail';
import CreateRecipe from './pages/CreateRecipe';
import Profile from './pages/Profile';
import SearchResult from './pages/SearchResult';
import ShareRecipe from './pages/ShareRecipe';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<RecipeList />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/create" element={<CreateRecipe />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<SearchResult />} />
        <Route path="/share/:id" element={<ShareRecipe />} />
      </Routes>
    </div>
  );
};

export default App;
