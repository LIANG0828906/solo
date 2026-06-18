import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BoardList } from '@/components/BoardList';
import { useStore } from '@/store';

export function HomePage() {
  const navigate = useNavigate();
  const { user, checkAuth } = useStore();

  useEffect(() => {
    const init = async () => {
      await checkAuth();
    };
    init();
  }, [checkAuth]);

  useEffect(() => {
    if (!user && !useStore.getState().loading) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ paddingLeft: '24px', paddingRight: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <BoardList />
      </div>
    </>
  );
}
