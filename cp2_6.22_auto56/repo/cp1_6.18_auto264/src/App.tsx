import { useRoutes, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import CoachPanel from './components/CoachPanel';
import ClientPanel from './components/ClientPanel';
import RoleSelect from './components/RoleSelect';

function App() {
  const { role } = useAppStore();

  const routes = useRoutes([
    { path: '/', element: <RoleSelect /> },
    {
      path: '/coach',
      element: role === 'coach' ? <CoachPanel /> : <Navigate to="/" replace />
    },
    {
      path: '/client',
      element: role === 'client' ? <ClientPanel /> : <Navigate to="/" replace />
    },
    { path: '*', element: <Navigate to="/" replace /> }
  ]);

  return routes;
}

export default App;
