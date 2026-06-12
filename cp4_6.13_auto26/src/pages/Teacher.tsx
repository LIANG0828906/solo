import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Play, StopCircle, Users, LogOut, Gamepad2, Settings, List,
} from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useWs } from '@/contexts/WsContext'
import type { Game, Card, GameRules, WinCondition, Room } from '../../shared/types'
import { PROP_EFFECT_LABELS } from '../../shared/types'

type Tab = 'games' | 'create' | 'rooms' | 'console'

const emptyCard = (): Card => ({
  id: crypto.randomUUID(),
  front: '',
  back: '',
  type: 'knowledge',
})

export default function Teacher() {
  const { currentUser, currentRoom, games, logout, setGames, setRoom, addNotification } = useGameStore()
  const { send } = useWs()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('games')
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [theme, setTheme] = useState('')
  const [cards, setCards] = useState<Card[]>([emptyCard()])
  const [rules, setRules] = useState<GameRules>({ answerTimeLimit: 30, drawLimitPerTurn: 3 })
  const [winCondition, setWinCondition] = useState<WinCondition>({ type: 'correct_count', value: 10 })
  const [roomCode, setRoomCode] = useState('')
  const [roomStudents, setRoomStudents] = useState<string[]>([])

  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }
    fetchGames()
  }, [currentUser, navigate])

  useEffect(() => {
    if (currentRoom) {
      setRoomCode(currentRoom.code)
      setRoomStudents(currentRoom.players.map((p) => p.name))
    }
  }, [currentRoom])

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games')
      if (res.ok) {
        const data = await res.json()
        setGames(data)
      }
    } catch {
      addNotification('获取游戏列表失败', 'error')
    }
  }

  const handleSaveGame = async () => {
    if (cards.length < 10) {
      addNotification('至少需要10张卡牌', 'error')
      return
    }
    const game: Game = {
      id: editingGame?.id || crypto.randomUUID(),
      teacherId: currentUser!.id,
      theme,
      cards,
      rules,
      winCondition,
      createdAt: editingGame?.createdAt || new Date().toISOString(),
    }
    try {
      const res = await fetch(editingGame ? `/api/games/${editingGame.id}` : '/api/games', {
        method: editingGame ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      })
      if (res.ok) {
        addNotification(editingGame ? '游戏已更新' : '游戏已创建', 'success')
        setEditingGame(null)
        resetForm()
        fetchGames()
        setTab('games')
      }
    } catch {
      addNotification('保存游戏失败', 'error')
    }
  }

  const resetForm = () => {
    setTheme('')
    setCards([emptyCard()])
    setRules({ answerTimeLimit: 30, drawLimitPerTurn: 3 })
    setWinCondition({ type: 'correct_count', value: 10 })
  }

  const handleEditGame = (game: Game) => {
    setEditingGame(game)
    setTheme(game.theme)
    setCards([...game.cards])
    setRules({ ...game.rules })
    setWinCondition({ ...game.winCondition })
    setTab('create')
  }

  const handleCreateRoom = async (gameId: string) => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      })
      if (res.ok) {
        const room: Room = await res.json()
        setRoom(room)
        setRoomCode(room.code)
        setRoomStudents([])
        addNotification(`房间已创建，代码: ${room.code}`, 'success')
        setTab('rooms')
      }
    } catch {
      addNotification('创建房间失败', 'error')
    }
  }

  const handleStartGame = () => {
    if (!currentRoom) return
    send({ type: 'game:start', payload: { roomId: currentRoom.id } })
  }

  const handleEndGame = () => {
    if (!currentRoom) return
    send({ type: 'game:end', payload: { roomId: currentRoom.id } })
  }

  const updateCard = (index: number, field: keyof Card, value: string) => {
    const updated = [...cards]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'type' && value === 'knowledge') {
      updated[index] = { ...updated[index], propEffect: undefined }
    }
    setCards(updated)
  }

  const addCard = () => {
    setCards([...cards, emptyCard()])
  }

  const removeCard = (index: number) => {
    if (cards.length <= 1) return
    setCards(cards.filter((_, i) => i !== index))
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'games', icon: <List size={16} />, label: '游戏列表' },
    { key: 'create', icon: <Plus size={16} />, label: '创建游戏' },
    { key: 'rooms', icon: <Users size={16} />, label: '房间管理' },
    { key: 'console', icon: <Gamepad2 size={16} />, label: '游戏控制台' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <header className="glass-card flex items-center justify-between px-6 py-3" style={{ borderRadius: 0, background: 'rgba(255,255,255,0.1)' }}>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>CardBattle 教师端</h1>
        <div className="flex items-center gap-4">
          <span className="text-white/70 text-sm">{currentUser?.username}</span>
          <button onClick={handleLogout} className="text-white/70 hover:text-white flex items-center gap-1 text-sm">
            <LogOut size={14} /> 退出
          </button>
        </div>
      </header>

      <div className="flex gap-2 px-6 pt-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-all duration-300 ${
              tab === t.key
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            style={{ borderRadius: '12px' }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <main className="p-6">
        {tab === 'games' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <div key={game.id} className="glass-card p-4">
                <h3 className="text-white font-semibold text-lg mb-2">{game.theme}</h3>
                <p className="text-white/60 text-sm mb-1">{game.cards.length} 张卡牌</p>
                <p className="text-white/40 text-xs mb-4">
                  {new Date(game.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditGame(game)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/10 text-white text-sm hover:bg-white/20 transition-all duration-300"
                    style={{ borderRadius: '12px' }}
                  >
                    <Settings size={14} /> 编辑
                  </button>
                  <button
                    onClick={() => handleCreateRoom(game.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/10 text-white text-sm hover:bg-white/20 transition-all duration-300"
                    style={{ borderRadius: '12px' }}
                  >
                    <Play size={14} /> 创建房间
                  </button>
                </div>
              </div>
            ))}
            {games.length === 0 && (
              <div className="glass-card p-8 text-center text-white/50 col-span-full">
                暂无游戏，点击"创建游戏"开始
              </div>
            )}
          </div>
        )}

        {tab === 'create' && (
          <div className="glass-card p-6 max-w-4xl mx-auto">
            <h2 className="text-white text-xl font-bold mb-4">
              {editingGame ? '编辑游戏' : '创建新游戏'}
            </h2>

            <div className="mb-4">
              <label className="text-white/70 text-sm block mb-1">主题</label>
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                style={{ borderRadius: '12px' }}
                placeholder="输入游戏主题"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/70 text-sm">卡牌列表 ({cards.length})</label>
                <button
                  onClick={addCard}
                  className="flex items-center gap-1 px-3 py-1 bg-white/10 text-white text-xs hover:bg-white/20 transition-all duration-300"
                  style={{ borderRadius: '12px' }}
                >
                  <Plus size={12} /> 添加卡牌
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {cards.map((card, i) => (
                  <div key={card.id} className="bg-white/5 border border-white/10 p-3" style={{ borderRadius: '12px' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">卡牌 #{i + 1}</span>
                      <button onClick={() => removeCard(i)} className="text-red-300/60 hover:text-red-300 text-xs">删除</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        value={card.front}
                        onChange={(e) => updateCard(i, 'front', e.target.value)}
                        placeholder="正面"
                        className="px-3 py-1.5 bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none"
                        style={{ borderRadius: '8px' }}
                      />
                      <input
                        value={card.back}
                        onChange={(e) => updateCard(i, 'back', e.target.value)}
                        placeholder="背面"
                        className="px-3 py-1.5 bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none"
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={card.type}
                        onChange={(e) => updateCard(i, 'type', e.target.value)}
                        className="px-3 py-1.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
                        style={{ borderRadius: '8px' }}
                      >
                        <option value="knowledge" className="bg-gray-800">知识卡</option>
                        <option value="prop" className="bg-gray-800">道具卡</option>
                      </select>
                      {card.type === 'prop' && (
                        <select
                          value={card.propEffect || ''}
                          onChange={(e) => updateCard(i, 'propEffect', e.target.value)}
                          className="px-3 py-1.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
                          style={{ borderRadius: '8px' }}
                        >
                          <option value="" className="bg-gray-800">选择效果</option>
                          {Object.entries(PROP_EFFECT_LABELS).map(([k, v]) => (
                            <option key={k} value={k} className="bg-gray-800">{v}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {cards.length < 10 && (
                <p className="text-yellow-300/70 text-xs mt-2">还需要 {10 - cards.length} 张卡牌</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-white/70 text-sm block mb-1">答题时限: {rules.answerTimeLimit}s</label>
                <input
                  type="range"
                  min={5}
                  max={120}
                  value={rules.answerTimeLimit}
                  onChange={(e) => setRules({ ...rules, answerTimeLimit: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-1">每轮抽牌数: {rules.drawLimitPerTurn}</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={rules.drawLimitPerTurn}
                  onChange={(e) => setRules({ ...rules, drawLimitPerTurn: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <div>
                <label className="text-white/70 text-sm block mb-1">胜利条件</label>
                <select
                  value={winCondition.type}
                  onChange={(e) => setWinCondition({ ...winCondition, type: e.target.value as WinCondition['type'] })}
                  className="px-3 py-2 bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
                  style={{ borderRadius: '12px' }}
                >
                  <option value="correct_count" className="bg-gray-800">正确答题数</option>
                  <option value="collect_knowledge" className="bg-gray-800">收集知识卡</option>
                </select>
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-1">目标值</label>
                <input
                  type="number"
                  min={1}
                  value={winCondition.value}
                  onChange={(e) => setWinCondition({ ...winCondition, value: Number(e.target.value) })}
                  className="px-3 py-2 bg-white/10 border border-white/20 text-white text-sm focus:outline-none w-24"
                  style={{ borderRadius: '12px' }}
                />
              </div>
            </div>

            <button
              onClick={handleSaveGame}
              disabled={cards.length < 10 || !theme}
              className="btn-gradient px-6 py-3 text-white font-semibold disabled:opacity-50"
            >
              {editingGame ? '更新游戏' : '保存游戏'}
            </button>
          </div>
        )}

        {tab === 'rooms' && (
          <div className="glass-card p-6 max-w-lg mx-auto">
            <h2 className="text-white text-xl font-bold mb-4">房间管理</h2>
            {currentRoom ? (
              <div>
                <div className="bg-white/10 border border-white/20 p-4 mb-4" style={{ borderRadius: '12px' }}>
                  <p className="text-white/70 text-sm">房间代码</p>
                  <p className="text-white text-3xl font-bold tracking-widest">{roomCode}</p>
                </div>
                <div className="mb-4">
                  <h3 className="text-white/70 text-sm mb-2">已加入学生 ({roomStudents.length})</h3>
                  {roomStudents.length > 0 ? (
                    <div className="space-y-1">
                      {roomStudents.map((name, i) => (
                        <div key={i} className="text-white/80 text-sm flex items-center gap-2">
                          <Users size={14} /> {name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm">等待学生加入...</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleStartGame} className="btn-gradient flex items-center gap-1 px-4 py-2 text-white text-sm">
                    <Play size={14} /> 开始游戏
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-white/50 text-center">请从游戏列表创建房间</p>
            )}
          </div>
        )}

        {tab === 'console' && (
          <div className="glass-card p-6 max-w-3xl mx-auto">
            <h2 className="text-white text-xl font-bold mb-4">游戏控制台</h2>
            {currentRoom && currentRoom.status === 'playing' ? (
              <div>
                <div className="flex gap-2 mb-4">
                  <button onClick={handleEndGame} className="flex items-center gap-1 px-4 py-2 bg-red-500/20 border border-red-400/30 text-red-200 text-sm hover:bg-red-500/30 transition-all duration-300" style={{ borderRadius: '12px' }}>
                    <StopCircle size={14} /> 结束游戏
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="text-white/50 text-sm text-left">
                      <th className="pb-2">头像</th>
                      <th className="pb-2">名称</th>
                      <th className="pb-2">得分</th>
                      <th className="pb-2">正确</th>
                      <th className="pb-2">错误</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRoom.players.map((p) => (
                      <tr key={p.id} className="text-white/80 text-sm border-t border-white/10">
                        <td className="py-2">{'🐰🐱🐶🐻🦊🐼🐯🦁🐵🐧🦌🐬'[p.avatarId - 1] || '🎮'}</td>
                        <td className="py-2">{p.name}</td>
                        <td className="py-2 font-bold">{p.score}</td>
                        <td className="py-2 text-green-300">{p.correctCount}</td>
                        <td className="py-2 text-red-300">{p.wrongCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white/50 text-center">暂无进行中的游戏</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
