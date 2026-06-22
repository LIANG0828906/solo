import { useEffect, lazy, Suspense } from 'react';
import { useStore } from '../store/useStore';
import Loading from '../components/Loading';

const AssignmentCard = lazy(() => import('../components/AssignmentCard'));

export default function HomePage() {
  const { assignments, isLoading, fetchAssignments } = useStore();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return (
    <div className="home-page fade-in">
      <header className="home-header">
        <h1 className="home-title">代码作业评测平台</h1>
        <p className="home-subtitle">在线编写代码，自动评测，即时获取反馈</p>
      </header>

      {isLoading ? (
        <Loading />
      ) : assignments.length === 0 ? (
        <div className="empty-state">
          <p>暂无作业</p>
        </div>
      ) : (
        <div className="assignment-grid">
          <Suspense fallback={<Loading />}>
            {assignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </Suspense>
        </div>
      )}
    </div>
  );
}
