import { useState, useEffect, memo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadCourse } from '@/utils/storage';
import { useEditorStore } from '@/stores/editorStore';
import { cn } from '@/lib/utils';

const ShareLoader = memo(function ShareLoader() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const loadCourseIntoStore = useEditorStore((s) => s.loadCourse);

  const [status, setStatus] = useState<'loading' | 'found' | 'error'>('loading');

  useEffect(() => {
    if (!courseId) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await loadCourse(courseId);
        if (cancelled) return;
        if (result) {
          setStatus('found');
          loadCourseIntoStore(result.course, result.pages, result.blocks);
          navigate('/', { replace: true });
        } else {
          setStatus('error');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, loadCourseIntoStore, navigate]);

  if (status === 'found') {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas">
        <div className={cn('animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full')} />
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className={cn('animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full')} />
          <p className="text-sm text-gray-500">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-canvas">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className="text-5xl">😕</div>
        <h2 className="text-xl font-semibold text-gray-800">Course Not Found</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          The course you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/"
          className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-800 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
});

export default ShareLoader;
