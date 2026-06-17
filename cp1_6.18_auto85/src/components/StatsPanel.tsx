import { useGameStore } from '../store/gameStore';
import { PRESET_SCORES, parseScore } from '../music/scoreParser';
import { getAccuracy, getAccuracyColor } from '../music/noteMatcher';

export function StatsPanel() {
  const matchResults = useGameStore((s) => s.matchResults);
  const currentScore = useGameStore((s) => s.currentScore);
  const errorCount = useGameStore((s) => s.errorCount);
  const scoreName = useGameStore((s) => s.scoreName);
  const setScore = useGameStore((s) => s.setScore);
  const resetPractice = useGameStore((s) => s.resetPractice);

  const accuracy = getAccuracy(matchResults);
  const accColor = getAccuracyColor(accuracy);

  return (
    <div className="w-full bg-bgSecondary rounded-xl p-5 border border-accentCyan/20 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-gray-300 font-medium">选择曲目:</span>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESET_SCORES).map(([name, str]) => (
            <button
              key={name}
              onClick={() => setScore(name, parseScore(str))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${scoreName === name
                  ? 'bg-accentCyan text-bgPrimary shadow-[0_0_12px_rgba(78,205,196,0.6)]'
                  : 'bg-bgScore text-gray-300 hover:bg-bgScore/80 hover:text-white border border-accentCyan/20'
                }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bgScore rounded-lg p-4 text-center border border-gray-700/50">
          <div className="text-gray-400 text-xs mb-1">正确率</div>
          <div
            className="text-3xl font-bold transition-colors duration-300"
            style={{ color: accColor, textShadow: `0 0 10px ${accColor}60` }}
          >
            {accuracy}%
          </div>
        </div>
        <div className="bg-bgScore rounded-lg p-4 text-center border border-gray-700/50">
          <div className="text-gray-400 text-xs mb-1">总音符数</div>
          <div className="text-3xl font-bold text-white">{currentScore.length}</div>
        </div>
        <div className="bg-bgScore rounded-lg p-4 text-center border border-gray-700/50">
          <div className="text-gray-400 text-xs mb-1">已弹奏</div>
          <div className="text-3xl font-bold text-accentCyan">{matchResults.length}</div>
        </div>
        <div className="bg-bgScore rounded-lg p-4 text-center border border-gray-700/50">
          <div className="text-gray-400 text-xs mb-1">错误次数</div>
          <div
            className="text-3xl font-bold"
            style={{
              color: errorCount > 0 ? '#FF6B6B' : '#6BCB77',
              textShadow: errorCount > 0 ? '0 0 10px rgba(255,107,107,0.5)' : '0 0 10px rgba(107,203,119,0.5)',
            }}
          >
            {errorCount}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={resetPractice}
          className="px-6 py-2.5 rounded-lg text-white font-semibold transition-all duration-200
            bg-[#6BCB77] hover:bg-[#8dda93] active:scale-95
            shadow-[0_0_12px_rgba(107,203,119,0.4)] hover:shadow-[0_0_18px_rgba(107,203,119,0.6)]"
        >
          🔄 重置练习
        </button>
      </div>
    </div>
  );
}
