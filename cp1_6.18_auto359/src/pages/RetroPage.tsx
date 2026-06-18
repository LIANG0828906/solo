import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { RetroReport } from '@/components/RetroReport';
import { useStore } from '@/store';
import { api } from '@/api';

export function RetroPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, checkAuth, setCurrentBoard, currentBoard } = useStore();

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

  useEffect(() => {
    if (id && user) {
      const loadBoard = async () => {
        const board = await api.getBoard(id);
        if (board) {
          setCurrentBoard(board);
        } else {
          navigate('/');
        }
      };
      loadBoard();
    }
    return () => {
      setCurrentBoard(null);
    };
  }, [id, user, setCurrentBoard, navigate]);

  if (!user || !currentBoard) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ paddingLeft: '24px', paddingRight: '24px', paddingBottom: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <RetroReport />
      </div>
    </>
  );
}
