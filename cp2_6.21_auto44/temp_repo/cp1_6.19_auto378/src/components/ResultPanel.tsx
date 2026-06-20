import { useEffect, useRef, useState, useCallback } from 'react';
import { useVoteStore } from '../store';
import { drawBarChart, drawDonutChart, EASING } from '../ChartRenderer';
import { VoteOptionResult } from '../types';

interface ResultPanelProps {
  voteId: string;
  onBack: () => void;
}

function ResultPanel({ voteId, onBack }: ResultPanelProps) {
  const { result, fetchResult, loading } = useVoteStore();
  const barCanvasRef = useRef<HTMLCanvasElement>(null);
  const donutCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [prevResults, setPrevResults] = useState<VoteOptionResult[] | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const animate = useCallback((startTime: number, duration: number = 600) => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    setAnimationProgress(progress);

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(() => animate(startTime, duration));
    }
  }, []);

  const startAnimation = useCallback((duration: number = 600) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setAnimationProgress(0);
    animationRef.current = requestAnimationFrame(() => animate(Date.now(), duration));
  }, [animate]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (result) {
      setPrevResults([...result.results]);
    }
    await fetchResult(voteId);
    startAnimation(300);
    setTimeout(() => setIsRefreshing(false), 500);
  }, [voteId, fetchResult, result, startAnimation]);

  useEffect(() => {
    fetchResult(voteId);
  }, [voteId, fetchResult]);

  useEffect(() => {
    if (result && result.results.length > 0) {
      startAnimation(600);
    }
  }, [result?.voteId, startAnimation]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (result?.isActive) {
        setPrevResults(prev => result ? [...result.results] : prev);
        fetchResult(voteId);
        startAnimation(300);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [voteId, result?.isActive, fetchResult, startAnimation, result]);

  useEffect(() => {
    if (result && barCanvasRef.current) {
      drawBarChart(barCanvasRef.current, result.results, animationProgress, prevResults);
    }
  }, [result, animationProgress, prevResults]);

  useEffect(() => {
    if (result && donutCanvasRef.current) {
      drawDonutChart(donutCanvasRef.current, result.results, animationProgress, prevResults);
    }
  }, [result, animationProgress, prevResults]);

  useEffect(() => {
    const handleResize = () => {
      if (result && barCanvasRef.current) {
        drawBarChart(barCanvasRef.current, result.results, 1, prevResults);
      }
      if (result && donutCanvasRef.current) {
        drawDonutChart(donutCanvasRef.current, result.results, 1, prevResults);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [result, prevResults]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl" style={{ color: '#8D6E63' }}>加载中...</div>
      </div>
    );
  }

  const totalVotes = result.totalVotes;

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-white transition-all"
            style={{ 
              backgroundColor: '#8D6E63',
              transition: `all 0.3s ${EASING}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6D4C41'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8D6E63'}
          >
            ← 返回列表
          </button>
          
          <div 
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ 
              backgroundColor: result.isActive ? '#E8F5E9' : '#EFEBE9',
              color: result.isActive ? '#2E7D32' : '#8D6E63'
            }}
          >
            {result.isActive ? '实时更新中' : '投票已结束'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#5D4E37' }}>{result.title}</h2>
          <div className="flex items-center gap-4 mb-6">
            <span style={{ color: '#8D6E63' }}>总投票数：</span>
            <span 
              className="text-3xl font-bold"
              style={{ color: '#8D6E63' }}
            >
              {totalVotes}
            </span>
            {result.isActive && (
              <span className="text-sm" style={{ color: '#A1887F' }}>
                每5秒自动刷新
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: '#5D4E37' }}>
                柱状图
              </h3>
              <div style={{ height: '300px' }}>
                <canvas
                  ref={barCanvasRef}
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    display: 'block'
                  }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: '#5D4E37' }}>
                环形图
              </h3>
              <div style={{ height: '300px' }}>
                <canvas
                  ref={donutCanvasRef}
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    display: 'block'
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {result.results.map((item) => (
              <div 
                key={item.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium" style={{ color: '#5D4E37' }}>{item.text}</span>
                <span className="font-bold" style={{ color: item.color }}>{item.votes}</span>
                <span style={{ color: '#8D6E63' }}>({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="px-8 py-3 rounded-xl text-white font-semibold transition-all flex items-center gap-2"
            style={{
              backgroundColor: '#8D6E63',
              cursor: loading || isRefreshing ? 'not-allowed' : 'pointer',
              transition: `all 0.3s ${EASING}`,
              transform: isRefreshing ? 'scale(0.95)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (!loading && !isRefreshing) {
                e.currentTarget.style.backgroundColor = '#6D4C41';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#8D6E63';
              e.currentTarget.style.transform = isRefreshing ? 'scale(0.95)' : 'scale(1)';
            }}
          >
            <span 
              style={{ 
                display: 'inline-block',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }}
            >
              🔄
            </span>
            {isRefreshing ? '刷新中...' : '刷新数据'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ResultPanel;
