import { useGameStore } from '@/store/useGameStore';
import { Star, Award, TrendingUp, Target, Zap, X } from 'lucide-react';
import { playClickSound, playSuccessSound } from '@/utils/sound';

export const EvaluationReport = () => {
  const { showEvaluation, evaluationReport, closeEvaluation } = useGameStore();

  if (!showEvaluation || !evaluationReport) return null;

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={32}
        className={`transition-all duration-500 ${
          i < count
            ? 'text-yellow-400 fill-yellow-400 animate-star-pop'
            : 'text-gray-600'
        }`}
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ));
  };

  const handleClose = () => {
    playClickSound();
    closeEvaluation();
  };

  const getGradeColor = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio >= 0.8) return 'text-green-400';
    if (ratio >= 0.6) return 'text-blue-400';
    if (ratio >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative max-w-2xl w-full bg-gradient-to-br from-amber-900/95 via-orange-900/95 to-red-900/95 border-4 border-amber-500/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,200,100,0.3),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,100,50,0.3),transparent_50%)]" />
        </div>

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors bg-black/30 rounded-full p-2"
        >
          <X size={24} />
        </button>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Award size={48} className="text-amber-400 animate-bounce" />
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300">
                铸师评鉴
              </h1>
              <Award size={48} className="text-amber-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="text-2xl text-amber-200 font-medium">
              第 {evaluationReport.period} 旬 · 报告
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="flex gap-2">{renderStars(evaluationReport.starRating)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-black/30 rounded-2xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Target size={20} className="text-green-400" />
                <span className="text-gray-300">订单完成率</span>
              </div>
              <div className={`text-3xl font-bold ${getGradeColor(evaluationReport.orderCompletionRate, 1)}`}>
                {(evaluationReport.orderCompletionRate * 100).toFixed(1)}%
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                  style={{ width: `${evaluationReport.orderCompletionRate * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-black/30 rounded-2xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-blue-400" />
                <span className="text-gray-300">平均铸件属性</span>
              </div>
              <div className={`text-3xl font-bold ${getGradeColor(evaluationReport.averageCastingAttributes, 60)}`}>
                {evaluationReport.averageCastingAttributes.toFixed(1)}
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (evaluationReport.averageCastingAttributes / 60) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-black/30 rounded-2xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={20} className="text-yellow-400" />
                <span className="text-gray-300">事件处理得分</span>
              </div>
              <div className={`text-3xl font-bold ${getGradeColor(evaluationReport.eventHandlingScore, 100)}`}>
                {evaluationReport.eventHandlingScore.toFixed(1)}
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-1000"
                  style={{ width: `${evaluationReport.eventHandlingScore}%` }}
                />
              </div>
            </div>

            <div className="bg-black/30 rounded-2xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Star size={20} className="text-orange-400" />
                <span className="text-gray-300">总评分</span>
              </div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
                {evaluationReport.totalScore.toFixed(1)}
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-1000"
                  style={{ width: `${Math.min(100, evaluationReport.totalScore)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 rounded-2xl p-6 border border-amber-500/30 text-center mb-8">
            <p className="text-xl text-amber-100 font-medium leading-relaxed">
              "{evaluationReport.summary}"
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => {
                playSuccessSound();
                handleClose();
              }}
              className="px-12 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xl font-bold rounded-2xl shadow-lg shadow-amber-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              🔥 继续下一旬
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes star-pop {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.3) rotate(0deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        .animate-star-pop {
          animation: star-pop 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};
