import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useChallengeStore } from '@/store/challengeStore';
import { useReviewStore } from '@/store/reviewStore';

const ChallengeListPage = lazy(() =>
  import('@/pages/ChallengeListPage').then((m) => ({ default: m.ChallengeListPage }))
);
const ChallengeSubmitPage = lazy(() =>
  import('@/pages/ChallengeSubmitPage').then((m) => ({ default: m.ChallengeSubmitPage }))
);
const ChallengeReviewPage = lazy(() =>
  import('@/pages/ChallengeReviewPage').then((m) => ({ default: m.ChallengeReviewPage }))
);

const PageLoading = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 64px)',
      paddingTop: 64,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        border: '3px solid var(--border-color)',
        borderTopColor: 'var(--accent-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const App = () => {
  const loadChallenges = useChallengeStore((s) => s.loadChallenges);
  const initMockData = useReviewStore((s) => s.initMockData);

  useEffect(() => {
    loadChallenges();
    initMockData();
  }, [loadChallenges, initMockData]);

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh' }}>
        <Navbar currentUser={{ name: '我' }} />
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/challenges" replace />} />
            <Route path="/challenges" element={<ChallengeListPage />} />
            <Route path="/challenge/:id/submit" element={<ChallengeSubmitPage />} />
            <Route path="/challenge/:id/review" element={<ChallengeReviewPage />} />
            <Route path="*" element={<Navigate to="/challenges" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
};

export default App;
