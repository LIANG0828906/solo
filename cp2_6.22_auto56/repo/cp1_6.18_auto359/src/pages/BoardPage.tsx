import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Board } from '@/components/Board';
import { useStore } from '@/store';
import { api } from '@/api';

export function BoardPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, checkAuth, fetchTasks, setCurrentBoard, currentBoard } = useStore();

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
          await fetchTasks(id);
        } else {
          navigate('/');
        }
      };
      loadBoard();
    }
    return () => {
      setCurrentBoard(null);
    };
  }, [id, user, fetchTasks, setCurrentBoard, navigate]);

  if (!user || !currentBoard) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ paddingLeft: '24px', paddingRight: '24px', paddingBottom: '40px', maxWidth: '100%', overflowX: 'auto' }}>
        <Board boardId={id} />
      </div>
    </>
  );
}
