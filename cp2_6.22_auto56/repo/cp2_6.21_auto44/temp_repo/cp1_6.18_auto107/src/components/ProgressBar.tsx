import { useAnalysisStore } from '@/store/analysisStore';

export default function ProgressBar() {
  const { analysisResult } = useAnalysisStore();
  const { status, progress } = analysisResult;

  if (status !== 'analyzing') {
    return null;
  }

  return (
    <div className="w-full">
      <div
        style={{
          height: '6px',
          backgroundColor: '#1E293B',
          borderRadius: '999px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#3B82F6',
            borderRadius: '999px',
            transition: 'width 0.5s ease'
          }}
        />
      </div>
    </div>
  );
}
