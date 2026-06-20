import { useState, useCallback } from 'react'
import RuneCanvas, { MatchResult } from './components/RuneCanvas'
import BattleRenderer from './components/BattleRenderer'
import { RuneType, runeTemplates, chooseRandomRune } from './data/data'

function App() {
  const [playerRuneType, setPlayerRuneType] = useState<RuneType | null>(null)
  const [aiRuneType, setAiRuneType] = useState<RuneType | null>(null)
  const [triggerSummon, setTriggerSummon] = useState(false)
  const [isSummoning, setIsSummoning] = useState(false)
  const [battleResult, setBattleResult] = useState<'player' | 'ai' | 'draw' | null>(null)
  const [showFlash, setShowFlash] = useState(false)
  const [statusMessage, setStatusMessage] = useState('在左侧召唤阵中绘制符文，然后点击召唤按钮')
  const [lastMatchInfo, setLastMatchInfo] = useState<{ name: string; confidence: number } | null>(null)

  const handleSummon = useCallback((result: MatchResult) => {
    if (result.type) {
      setPlayerRuneType(result.type)
      const aiType = chooseRandomRune()
      setAiRuneType(aiType)
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 300)
      setBattleResult(null)
      setLastMatchInfo({ name: result.name, confidence: result.confidence })
      setStatusMessage(`召唤成功！${result.name} (匹配度: ${(result.confidence * 100).toFixed(0)}%)`)
    } else {
      setStatusMessage('符文匹配失败，请重新绘制')
      setLastMatchInfo(null)
    }
  }, [])

  const handleSummonComplete = useCallback(() => {
    setTriggerSummon(false)
    setIsSummoning(false)
  }, [])

  const handleBattleEnd = useCallback((winner: 'player' | 'ai' | null) => {
    if (winner === 'player') {
      setBattleResult('player')
      setStatusMessage('🎉 战斗胜利！你的生物击败了对手！')
    } else if (winner === 'ai') {
      setBattleResult('ai')
      setStatusMessage('💀 战斗失败... 再来一次吧！')
    } else {
      setBattleResult('draw')
      setStatusMessage('⚔️ 平局！双方同归于尽！')
    }
  }, [])

  const handleSummonClick = () => {
    if (isSummoning) return
    setIsSummoning(true)
    setTriggerSummon(true)
    setLastMatchInfo(null)
  }

  const handleReset = () => {
    setPlayerRuneType(null)
    setAiRuneType(null)
    setBattleResult(null)
    setLastMatchInfo(null)
    setStatusMessage('在左侧召唤阵中绘制符文，然后点击召唤按钮')
  }

  const getRuneIcon = (type: RuneType) => {
    const icons: Record<RuneType, string> = {
      fire: '🔥',
      water: '💧',
      earth: '🌍',
      wind: '🍃',
      thunder: '⚡',
      shadow: '🌑',
    }
    return icons[type]
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#1a0a2e] overflow-hidden">
      {showFlash && (
        <div className="fixed inset-0 bg-white opacity-80 z-50 flash-overlay pointer-events-none" />
      )}

      <header className="py-4 px-6 border-b-2 border-[#ffd700] bg-gradient-to-r from-[#1a0a2e] via-[#2d1247] to-[#1a0a2e]">
        <h1 className="text-3xl font-bold text-center text-[#ffd700] tracking-widest" style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.5)' }}>
          ✦ 像素符文召唤阵 ✦
        </h1>
        <p className="text-center text-purple-300 mt-2 text-sm">
          绘制符文，召唤生物，体验魔法对战的乐趣
        </p>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 p-6 overflow-auto">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold text-[#ffd700]">✦ 召唤阵 ✦</h2>
          
          <div className="gold-border rounded-full p-2 bg-[#1a0a2e]">
            <RuneCanvas
              onSummon={handleSummon}
              disabled={isSummoning || (playerRuneType !== null && battleResult === null)}
              triggerSummon={triggerSummon}
              onSummonComplete={handleSummonComplete}
            />
          </div>

          <div className="flex gap-4 mt-2">
            <button
              onClick={handleSummonClick}
              disabled={isSummoning || (playerRuneType !== null && battleResult === null)}
              className="gold-button rounded-lg"
            >
              {isSummoning ? '召唤中...' : '✨ 召唤'}
            </button>
            <button
              onClick={handleReset}
              disabled={isSummoning}
              className="gold-button rounded-lg"
            >
              🔄 重置
            </button>
          </div>

          <div className="w-full max-w-[400px] mt-4">
            <h3 className="text-sm text-purple-300 mb-2 text-center">符文模板（点击查看）</h3>
            <div className="grid grid-cols-3 gap-2">
              {runeTemplates.map((rune) => (
                <div
                  key={rune.type}
                  className="p-2 rounded-lg border border-purple-700 bg-purple-900/30 text-center cursor-pointer hover:bg-purple-800/50 transition-colors"
                  title={`${rune.name}符文`}
                >
                  <span className="text-2xl">{getRuneIcon(rune.type)}</span>
                  <p className="text-xs mt-1" style={{ color: rune.color }}>{rune.name}</p>
                </div>
              ))}
            </div>
          </div>

          {lastMatchInfo && (
            <div className="mt-2 p-3 rounded-lg bg-purple-900/50 border border-[#ffd700]/50 text-center">
              <p className="text-[#ffd700] font-bold">
                {getRuneIcon(playerRuneType!)} 召唤: {lastMatchInfo.name}
              </p>
              <p className="text-sm text-purple-300">
                匹配度: {(lastMatchInfo.confidence * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold text-[#ffd700]">⚔️ 战场 ⚔️</h2>
          
          <div className={`gold-border rounded-lg overflow-hidden ${battleResult ? 'shake' : ''}`}>
            <BattleRenderer
              playerRuneType={playerRuneType}
              aiRuneType={aiRuneType}
              onBattleEnd={handleBattleEnd}
              disabled={playerRuneType === null || aiRuneType === null}
            />
          </div>

          <div className={`w-full max-w-[600px] p-4 rounded-lg text-center ${
            battleResult === 'player' ? 'bg-green-900/50 border-2 border-green-500' :
            battleResult === 'ai' ? 'bg-red-900/50 border-2 border-red-500' :
            battleResult === 'draw' ? 'bg-yellow-900/50 border-2 border-yellow-500' :
            'bg-purple-900/30 border border-purple-700'
          }`}>
            <p className={`text-lg font-bold ${
              battleResult === 'player' ? 'text-green-400' :
              battleResult === 'ai' ? 'text-red-400' :
              battleResult === 'draw' ? 'text-yellow-400' :
              'text-purple-200'
            }`}>
              {statusMessage}
            </p>
            {battleResult && (
              <button
                onClick={handleReset}
                className="mt-3 gold-button rounded-lg text-sm"
              >
                🔄 再来一局
              </button>
            )}
          </div>

          {playerRuneType && aiRuneType && !battleResult && (
            <div className="flex gap-8 text-sm">
              <div className="text-center">
                <span className="text-2xl">{getRuneIcon(playerRuneType)}</span>
                <p className="text-purple-300">你的生物</p>
              </div>
              <div className="text-2xl text-[#ffd700]">VS</div>
              <div className="text-center">
                <span className="text-2xl">{getRuneIcon(aiRuneType)}</span>
                <p className="text-purple-300">对手生物</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-3 px-6 border-t border-purple-800 text-center text-purple-400 text-sm">
        <p>💡 提示：绘制对应的符文图案（三角形、波浪线、菱形、扇形、Z形、螺旋形）来召唤不同属性的生物</p>
      </footer>
    </div>
  )
}

export default App
