import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
  useNavigate,
} from 'react-router-dom';
import './index.css';
import Home from './pages/Home';
import PlantDetail from './pages/PlantDetail';
import Community from './pages/Community';
import { usePlantStore } from './stores/usePlantStore';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = usePlantStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) return null;
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/home',
    element: (
      <AuthGuard>
        <Home />
      </AuthGuard>
    ),
  },
  {
    path: '/plant/:id',
    element: (
      <AuthGuard>
        <PlantDetail />
      </AuthGuard>
    ),
  },
  {
    path: '/community',
    element: (
      <AuthGuard>
        <Community />
      </AuthGuard>
    ),
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
