import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ItemDetail from '../components/ItemDetail';
import { useAuthStore } from '../../auth/store';

export default function ItemDetailPage() {
  const { currentUser } = useAuthStore();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen">
      <Navbar showSearch={false} />
      <ItemDetail />
    </div>
  );
}
