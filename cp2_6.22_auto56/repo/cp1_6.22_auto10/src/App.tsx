import { useState, useEffect, useRef, useCallback } from 'react'
import Canvas from './Canvas'
import Toolbar from './Toolbar'
import PropertyPanel from './PropertyPanel'
import type { Shape, User, Tool, HistoryAction, ServerMessage } from './types'
import { v4 as uuidv4 } from 'uuid'

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff6b6b', '#feca57', '#48dbfb',
  '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#1dd1a1',
  '#ff6348', '#eccc68', '#7bed9f', '#70a1ff', '#ffa502',
  '#2ed573', '#5352ed', '#a29bfe', '#fd79a8', '#6c5ce7'
]

export default function App() {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>('select')
  const [users, setUsers] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showClearModal, setShowClearModal] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const undoStackRef = useRef<HistoryAction[]>([])
  const redoStackRef = useRef<HistoryAction[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const shapesRef = useRef<Shape[]>([])

  useEffect(() => {
    shapesRef.current = shapes
  }, [shapes])

  const pushUndo = useCallback((action: HistoryAction) => {
    undoStackRef.current.push(action)
    redoStackRef.current = []
  }, [])

  const broadcast = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const addShape = useCallback((shape: Shape, fromRemote = false) => {
    setShapes(prev => {
      const next = [...prev, shape]
      if (!fromRemote) {
        pushUndo({ type: 'add', shape })
        broadcast({ type: 'ADD_SHAPE', shape })
      }
      return next
    })
    setSelectedId(shape.id)
    setTool('select')
  }, [broadcast, pushUndo])

  const updateShape = useCallback((id: string, updates: Partial<Shape>, fromRemote = false, recordHistory = true) => {
    setShapes(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (idx === -1) return prev
      const old = prev[idx]
      const next = [...prev]
      next[idx] = { ...old, ...updates }
      if (!fromRemote && recordHistory) {
        pushUndo({ type: 'update', id, previousState: old })
        broadcast({ type: 'UPDATE_SHAPE', id, updates })
      }
      return next
    })
  }, [broadcast, pushUndo])

  const deleteShape = useCallback((id: string, fromRemote = false) => {
    setShapes(prev => {
      const target = prev.find(s => s.id === id)
      if (!target) return prev
      if (!fromRemote) {
        pushUndo({ type: 'delete', shape: target })
        broadcast({ type: 'DELETE_SHAPE', id })
      }
      return prev.filter(s => s.id !== id)
    })
    if (selectedId === id) setSelectedId(null)
  }, [broadcast, pushUndo, selectedId])

  const clearAll = useCallback((fromRemote = false) => {
    setIsClearing(true)
    setTimeout(() => {
      setShapes(prev => {
        if (!fromRemote) {
          pushUndo({ type: 'clear', previousShapes: [...prev] })
          broadcast({ type: 'CLEAR_ALL' })
        }
        return []
      })
      setSelectedId(null)
      setIsClearing(false)
      setShowClearModal(false)
    }, 300)
  }, [broadcast, pushUndo])

  const undo = useCallback(() => {
    const action = undoStackRef.current.pop()
    if (!action) return
    redoStackRef.current.push(action)
    switch (action.type) {
      case 'add':
        if (action.shape) {
          setShapes(prev => prev.filter(s => s.id !== action.shape!.id))
          broadcast({ type: 'DELETE_SHAPE', id: action.shape.id })
        }
        break
      case 'delete':
        if (action.shape) {
          setShapes(prev => [...prev, action.shape!])
          broadcast({ type: 'ADD_SHAPE', shape: action.shape })
        }
        break
      case 'update':
        if (action.id && action.previousState) {
          setShapes(prev => prev.map(s => s.id === action.id ? action.previousState! : s))
          broadcast({ type: 'UPDATE_SHAPE', id: action.id, updates: action.previousState })
        }
        break
      case 'clear':
        if (action.previousShapes) {
          setShapes(action.previousShapes)
          action.previousShapes.forEach(s => broadcast({ type: 'ADD_SHAPE', shape: s }))
        }
        break
    }
  }, [broadcast])

  const redo = useCallback(() => {
    const action = redoStackRef.current.pop()
    if (!action) return
    undoStackRef.current.push(action)
    switch (action.type) {
      case 'add':
        if (action.shape) {
          setShapes(prev => [...prev, action.shape!])
          broadcast({ type: 'ADD_SHAPE', shape: action.shape })
        }
        break
      case 'delete':
        if (action.shape) {
          setShapes(prev => prev.filter(s => s.id !== action.shape!.id))
          broadcast({ type: 'DELETE_SHAPE', id: action.shape.id })
        }
        break
      case 'clear':
        setShapes([])
        broadcast({ type: 'CLEAR_ALL' })
        break
    }
  }, [broadcast])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if ((e.key === 'z' && e.shiftKey) || (e.key === 'y')) {
          e.preventDefault()
          redo()
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault()
          deleteShape(selectedId)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [undo, redo, selectedId, deleteShape])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data)
      switch (msg.type) {
        case 'INIT':
          setShapes(msg.shapes)
          setUsers(msg.users)
          setCurrentUserId(msg.userId)
          const me = msg.users.find(u => u.id === msg.userId)
          if (me) setCurrentUser(me)
          break
        case 'SHAPE_ADDED':
          setShapes(prev => [...prev, msg.shape])
          break
        case 'SHAPE_UPDATED':
          setShapes(prev => prev.map(s => s.id === msg.id ? { ...s, ...msg.updates } : s))
          break
        case 'SHAPE_DELETED':
          setShapes(prev => prev.filter(s => s.id !== msg.id))
          break
        case 'ALL_CLEARED':
          setIsClearing(true)
          setTimeout(() => {
            setShapes([])
            setSelectedId(null)
            setIsClearing(false)
          }, 300)
          break
        case 'CURSOR_UPDATE':
          setUsers(prev => prev.map(u => u.id === msg.userId
            ? { ...u, cursor: { x: msg.x, y: msg.y }, username: msg.username, color: msg.color }
            : u
          ))
          break
        case 'USER_JOINED':
          setUsers(prev => [...prev, msg.user])
          break
        case 'USER_LEFT':
          setUsers(prev => prev.map(u => u.id === msg.userId ? { ...u, _leaving: true } as any : u))
          setTimeout(() => {
            setUsers(prev => prev.filter(u => u.id !== msg.userId))
          }, 300)
          break
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  const sendCursor = useCallback((x: number, y: number) => {
    if (currentUser) {
      broadcast({
        type: 'CURSOR',
        x,
        y,
        username: currentUser.username,
        color: currentUser.color
      })
    }
  }, [broadcast, currentUser])

  const selectedShape = shapes.find(s => s.id === selectedId) || null

  const createNewShape = useCallback((type: Tool, startX: number, startY: number): Shape | null => {
    if (type === 'select') return null
    const base = {
      id: uuidv4(),
      x: startX,
      y: startY,
      fill: '#ffffff',
      stroke: '#333333',
      strokeWidth: 2,
      rotation: 0,
    }
    switch (type) {
      case 'circle':
        return { ...base, type: 'circle', radius: 50 }
      case 'rect':
        return { ...base, type: 'rect', width: 100, height: 80 }
      case 'triangle':
        return { ...base, type: 'triangle', width: 100, height: 80 }
      case 'line':
        return { ...base, type: 'line', width: 100, height: 0 }
      case 'path':
        return { ...base, type: 'path', points: `${startX},${startY}` }
      default:
        return null
    }
  }, [])

  return (
    <div className="app-container">
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        onUndo={undo}
        onRedo={redo}
        canUndo={undoStackRef.current.length > 0}
        canRedo={redoStackRef.current.length > 0}
        onClear={() => setShowClearModal(true)}
      />

      <div className="online-users glass" title="在线用户">
        {users.slice(0, 6).map(u => (
          <div
            key={u.id}
            className={`user-avatar ${(u as any)._leaving ? 'fade-out' : ''}`}
            style={{ background: u.color }}
            title={u.username}
          >
            {u.username.charAt(0)}
          </div>
        ))}
        {users.length > 6 && (
          <div className="user-avatar" style={{ background: 'rgba(255,255,255,0.2)' }}>
            +{users.length - 6}
          </div>
        )}
      </div>

      <Canvas
        shapes={shapes}
        selectedId={selectedId}
        tool={tool}
        onSelect={setSelectedId}
        onAddShape={addShape}
        onUpdateShape={updateShape}
        onCursorMove={sendCursor}
        users={users.filter(u => u.id !== currentUserId)}
        isClearing={isClearing}
        createNewShape={createNewShape}
      />

      <PropertyPanel
        shape={selectedShape}
        onUpdate={(updates) => selectedId && updateShape(selectedId, updates)}
        presetColors={PRESET_COLORS}
      />

      {showClearModal && (
        <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>清除画布</h2>
            <p>确定要清除画布上所有图形吗？此操作可以通过撤销恢复。</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowClearModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={() => clearAll()}>
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
