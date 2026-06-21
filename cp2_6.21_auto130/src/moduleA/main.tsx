import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import ToastContainer from '@/components/ToastContainer';
import RecipeHome from './pages/RecipeHome';
import RecipeDetail from './pages/RecipeDetail';
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
          <Route
            path="meal-planner"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="card p-12 text-center">
                  <h2 className="title-display text-2xl text-gray-700 mb-2">每周菜单规划</h2>
                  <p className="text-gray-500">即将上线，敬请期待~</p>
                </div>
              </div>
            }
          />
          <Route
            path="shopping-list"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="card p-12 text-center">
                  <h2 className="title-display text-2xl text-gray-700 mb-2">智能采购清单</h2>
                  <p className="text-gray-500">即将上线，敬请期待~</p>
                </div>
              </div>
            }
          />
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
