import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import ToastContainer from '@/components/ToastContainer';
import RecipeHome from './pages/RecipeHome';
import RecipeDetail from './pages/RecipeDetail';
import MealPlanner from '@/moduleB/MealPlanner';
import ShoppingList from '@/moduleB/ShoppingList';
import '@/index.css';

function RoomLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}

function ModuleA() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/room/demo-room/recipes" replace />} />
        <Route path="/room" element={<Navigate to="/room/demo-room/recipes" replace />} />
        <Route path="/room/:inviteCode" element={<RoomLayout />}>
          <Route index element={<Navigate to="recipes" replace />} />
          <Route path="recipes" element={<RecipeHome />} />
          <Route path="recipes/:id" element={<RecipeDetail />} />
          <Route path="meal-planner" element={<MealPlanner />} />
          <Route path="shopping-list" element={<ShoppingList />} />
        </Route>
        <Route path="*" element={<Navigate to="/room/demo-room/recipes" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ModuleA />
    </StrictMode>
  );
}
