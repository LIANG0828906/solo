import { useState, useEffect, useRef, useCallback } from 'react'
import Board from './Board'
import type { Note, Column, WSInitPayload, WSMoveNotePayload } from './types'

type WSMessage =
  | { type: 'init'; payload: WSInitPayload }
  | { type: 'add-note'; payload: Note }
  | { type: 'update-note'; payload: Partial<Note> & { id: string } }
  | { type: 'delete-note'; payload: { id: string } }
  | { type: 'move-note'; payload: WSMoveNotePayload }
  | { type: 'online-update'; payload: { onlineCount: number } }
  | { type: 'error'; payload: { message: string } }
  | { type: 'note-id-mapped'; payload: { tempId: string; id: string } }

function App() {
  const [joined, setJoined] = useState(false)
  const [nickname, setNickname] = useState('')
  const [roomId, setRoomId] = useState('')
  const [inputRoom, setInputRoom] = useState('')
  const [inputNick, setInputNick] = useState('')
  const [columns, setColumns] = useState<Column[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const clientIdRef = useRef<string>('')

  const connectWS = useCallback((rid: string, nick: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.hostname}:3001`)

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'join',
          payload: { nickname: nick },
          roomId: rid,
        })
      )
    }

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)
        switch (msg.type) {
          case 'init': {
            clientIdRef.current = msg.payload.clientId
            setColumns(msg.payload.columns)
            setNotes(msg.payload.notes)
            setOnlineCount(msg.payload.onlineCount)
            setJoined(true)
            break
          }
          case 'add-note': {
            setNotes((prev) => {
              if (prev.find((n) => n.id === msg.payload.id)) return prev
              return [...prev, msg.payload]
            })
            break
          }
          case 'note-id-mapped': {
            setNotes((prev) =>
              prev.map((n) =>
                n.id === msg.payload.tempId ? { ...n, id: msg.payload.id } : n
              )
            )
            break
          }
          case 'update-note': {
            setNotes((prev) =>
              prev.map((n) =>
                n.id === msg.payload.id ? { ...n, ...msg.payload, _remoteUpdate: true } as Note : n
              )
            )
            setTimeout(() => {
              setNotes((prev) =>
                prev.map((n) =>
                  n.id === msg.payload.id ? { ...n, _remoteUpdate: false } as Note : n
                )
              )
            }, 500)
            break
          }
          case 'delete-note': {
            setNotes((prev) => prev.filter((n) => n.id !== msg.payload.id))
            break
          }
          case 'move-note': {
            const { id, toColumnId, toIndex } = msg.payload
            setNotes((prev) => {
              const note = prev.find((n) => n.id === id)
              if (!note) return prev
              const others = prev.filter((n) => n.id !== id)
              const sameCol = others.filter((n) => n.columnId === toColumnId)
              const rest = others.filter((n) => n.columnId !== toColumnId)
              sameCol.sort((a, b) => a.order - b.order)
              const updated: Note = { ...note, columnId: toColumnId, order: toIndex, _remoteMove: true } as Note
              sameCol.splice(toIndex, 0, updated)
              sameCol.forEach((n, i) => (n.order = i))
              
              const colRest = new Set(rest.map((n) => n.columnId))
              colRest.forEach((cid) => {
                const colNotes = rest.filter((n) => n.columnId === cid)
                colNotes.sort((a, b) => a.order - b.order)
                colNotes.forEach((n, i) => (n.order = i))
              })
              
              setTimeout(() => {
                setNotes((p) => p.map((n) => (n.id === id ? { ...n, _remoteMove: false } as Note : n)))
              }, 400)
              
              return [...sameCol, ...rest]
            })
            break
          }
          case 'online-update': {
            setOnlineCount(msg.payload.onlineCount)
            break
          }
          case 'error': {
            setErrorMsg(msg.payload.message)
            setTimeout(() => setErrorMsg(''), 3000)
            break
          }
        }
      } catch (e) {
        console.error('WS parse error', e)
      }
    }

    ws.onclose = () => {
      console.log('WS closed')
    }

    ws.onerror = () => {
      setErrorMsg('连接失败，请稍后重试')
      setTimeout(() => setErrorMsg(''), 3000)
    }

    wsRef.current = ws
  }, [])

  const handleJoin = () => {
    const nick = inputNick.trim()
    const rid = inputRoom.trim().toUpperCase()
    if (!nick) {
      setErrorMsg('请输入昵称')
      setTimeout(() => setErrorMsg(''), 2000)
      return
    }
    if (!rid || !/^[A-Z0-9]{6}$/.test(rid)) {
      setErrorMsg('请输入6位字母数字房间码')
      setTimeout(() => setErrorMsg(''), 2000)
      return
    }
    setNickname(nick)
    setRoomId(rid)
    connectWS(rid, nick)
  }

  const generateRoom = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let id = ''
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setInputRoom(id)
  }

  const sendMessage = (type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload, roomId, clientId: clientIdRef.current }))
    }
  }

  const handleExport = async () => {
    setExporting(true)
    setExportProgress(0)

    const startTime = Date.now()
    const duration = 300
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      setExportProgress(progress)
      if (progress < 100) {
        requestAnimationFrame(animate)
      } else {
        setTimeout(() => {
          const a = document.createElement('a')
          a.href = `/api/export/${roomId}`
          a.download = `board-${roomId}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          setExporting(false)
        }, 100)
      }
    }
    requestAnimationFrame(animate)
  }

  useEffect(() => {
    return () => {
      wsRef.current?.close()
    }
  }, [])

  if (!joined) {
    return (
      <div className="join-page">
        <div className="join-card">
          <h1>协作看板</h1>
          <p>输入房间码和昵称，开始团队协作</p>

          <label>房间码（6位字母数字）</label>
          <input
            id="room"
            type="text"
            placeholder="ABC123"
            value={inputRoom}
            maxLength={6}
            onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />

          <label>昵称</label>
          <input
            id="nickname"
            type="text"
            placeholder="你的名字"
            value={inputNick}
            maxLength={20}
            onChange={(e) => setInputNick(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />

          {errorMsg && <p style={{ color: '#e74c3c', marginBottom: 16, fontSize: 13 }}>{errorMsg}</p>}

          <button onClick={handleJoin}>进入看板</button>

          <div className="room-hint">
            没有房间码？<span onClick={generateRoom}>生成新房间</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="board-page">
      <header className="board-header">
        <div className="board-header-left">
          <div className="board-title">📋 协作看板</div>
          <div className="room-info">
            <span className="online-dot" />
            <span>房间：</span>
            <span className="room-badge">{roomId}</span>
            <span>·</span>
            <span>{onlineCount}/10 在线</span>
          </div>
        </div>
        <div className="board-header-right">
          <span className="user-name">👤 {nickname}</span>
          <button className="export-btn" onClick={handleExport}>
            ⬇ 导出 JSON
          </button>
        </div>
      </header>

      <Board
        columns={columns}
        notes={notes}
        nickname={nickname}
        onAddNote={(note) => sendMessage('add-note', note)}
        onUpdateNote={(note) => sendMessage('update-note', note)}
        onDeleteNote={(id) => sendMessage('delete-note', { id })}
        onMoveNote={(id, toColumnId, toIndex) =>
          sendMessage('move-note', { id, toColumnId, toIndex })
        }
      />

      {exporting && (
        <div className="loading-overlay">
          <div className="loading-box">
            <h3>正在导出...</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${exportProgress}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
