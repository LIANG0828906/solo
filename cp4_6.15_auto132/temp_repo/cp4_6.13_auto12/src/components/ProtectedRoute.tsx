import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { token, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="w-10 h-10 border-3 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
