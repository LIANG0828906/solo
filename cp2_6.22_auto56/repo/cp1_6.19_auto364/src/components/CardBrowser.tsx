import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeckStore, Deck } from '@/stores/deckStore'

interface CardBrowserProps {
  onStartReview: (deckId: string) => void
}

const ITEM_HEIGHT = 260
const OVERSCAN = 5

export default function CardBrowser({ onStartReview }: CardBrowserProps) {
  const decks = useDeckStore((s) => s.decks)
  const createDeck = useDeckStore((s) => s.createDeck)
  const getDeckDueCount = useDeckStore((s) => s.getDeckDueCount)
  const addCard = useDeckStore((s) => s.addCard)

  const [showModal, setShowModal] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [newDeckDesc, setNewDeckDesc] = useState('')
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [showCardModal, setShowCardModal] = useState(false)
  const [cardFront, setCardFront] = useState('')
  const [cardBack, setCardBack] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)
  const [columns, setColumns] = useState(3)

  const handleResize = useCallback(() => {
    const width = window.innerWidth
    if (width < 768) setColumns(1)
    else if (width < 1024) setColumns(2)
    else setColumns(3)
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight)
    }
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const rowCount = Math.ceil(decks.length / columns)
  const totalHeight = rowCount * ITEM_HEIGHT
  const startRow = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
  const endRow = Math.min(
    rowCount,
    startRow + Math.ceil(containerHeight / ITEM_HEIGHT) + OVERSCAN * 2
  )
  const visibleDecks = useMemo(() => {
    const result: { deck: Deck; index: number }[] = []
    for (let r = startRow; r < endRow; r++) {
      for (let c = 0; c < columns; c++) {
        const idx = r * columns + c
        if (idx < decks.length) {
          result.push({ deck: decks[idx], index: idx })
        }
      }
    }
    return result
  }, [decks, startRow, endRow, columns])

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return
    createDeck(newDeckName.trim(), newDeckDesc.trim())
    setNewDeckName('')
    setNewDeckDesc('')
    setShowModal(false)
  }

  const handleAddCard = () => {
    if (!selectedDeck || !cardFront.trim() || !cardBack.trim()) return
    addCard(selectedDeck.id, cardFront.trim(), cardBack.trim())
    setCardFront('')
    setCardBack('')
  }

  const renderDeckCard = (deck: Deck, index: number) => {
    const dueCount = getDeckDueCount(deck.id)
    const row = Math.floor(index / columns)
    const col = index % columns
    const top = row * ITEM_HEIGHT
    const left = col * (180 + 24)

    return (
      <motion.div
        key={deck.id}
        layout
        initial={{ y: -100, opacity: 0, rotateX: -15 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: Math.min(index * 0.05, 0.5)
        }}
        whileHover={{
          y: -4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
        }}
        style={{
          position: 'absolute',
          top,
          left,
          width: 180,
          height: 240,
          borderRadius: 12,
          background: 'linear-gradient(145deg, #1e1e2e, #2a2a3a)',
          padding: 16,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(102, 126, 234, 0.1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease'
        }}
        onClick={() => onStartReview(deck.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          setSelectedDeck(deck)
          setShowCardModal(true)
        }}
      >
        {dueCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
            }}
          />
        )}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 12
          }}
        >
          {deck.name.charAt(0).toUpperCase()}
        </div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#f8f9fa',
            marginBottom: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {deck.name}
        </h3>
        <p
          style={{
            fontSize: 12,
            color: '#9ca3af',
            marginBottom: 12,
            flex: 1,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {deck.description || '暂无描述'}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: '#6b7280'
          }}
        >
          <span>{deck.cards.length} 张卡片</span>
          {dueCount > 0 && (
            <span
              style={{
                color: '#ef4444',
                fontWeight: 500
              }}
            >
              {dueCount} 待复习
            </span>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 6,
              background: 'linear-gradient(135deg, #f8f9fa, #9ca3af)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            我的卡片组
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            共 {decks.length} 个卡片组，点击进入复习 · 右键添加卡片
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          style={{
            padding: '12px 24px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span style={{ fontSize: 18 }}>+</span>
          新建卡片组
        </motion.button>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          position: 'relative',
          height: 'calc(100vh - 220px)',
          overflow: 'auto',
          paddingRight: 16
        }}
      >
        <div style={{ position: 'relative', height: totalHeight }}>
          {visibleDecks.map(({ deck, index }) => renderDeckCard(deck, index))}
        </div>
        {decks.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60%',
              color: '#6b7280'
            }}
          >
            <div
              style={{
                fontSize: 64,
                marginBottom: 16,
                opacity: 0.3
              }}
            >
              📚
            </div>
            <p style={{ fontSize: 16 }}>还没有卡片组</p>
            <p style={{ fontSize: 14, marginTop: 4 }}>
              点击右上角「新建卡片组」开始创建
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 1000
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                maxWidth: '90vw',
                padding: 32,
                borderRadius: 16,
                background: 'linear-gradient(145deg, #1e1e2e, #252538)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
                zIndex: 1001
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  marginBottom: 24,
                  color: '#f8f9fa'
                }}
              >
                新建卡片组
              </h2>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: '#9ca3af',
                    marginBottom: 8
                  }}
                >
                  名称
                </label>
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="例如：英语词汇"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #374151',
                    backgroundColor: '#16162a',
                    color: '#f8f9fa',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = '#667eea')
                  }
                  onBlur={(e) => (e.target.style.borderColor = '#374151')}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: '#9ca3af',
                    marginBottom: 8
                  }}
                >
                  描述
                </label>
                <textarea
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  placeholder="简要描述这个卡片组的内容..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #374151',
                    backgroundColor: '#16162a',
                    color: '#f8f9fa',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = '#667eea')
                  }
                  onBlur={(e) => (e.target.style.borderColor = '#374151')}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'flex-end'
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid #374151',
                    backgroundColor: 'transparent',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  取消
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateDeck}
                  disabled={!newDeckName.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: newDeckName.trim() ? 'pointer' : 'not-allowed',
                    fontSize: 14,
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: '#fff',
                    opacity: newDeckName.trim() ? 1 : 0.5
                  }}
                >
                  创建
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCardModal && selectedDeck && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCardModal(false)
                setSelectedDeck(null)
              }}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 1000
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 480,
                maxWidth: '90vw',
                padding: 32,
                borderRadius: 16,
                background: 'linear-gradient(145deg, #1e1e2e, #252538)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
                zIndex: 1001
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: '#f8f9fa'
                }}
              >
                「{selectedDeck.name}」添加卡片
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: '#6b7280',
                  marginBottom: 24
                }}
              >
                当前共 {selectedDeck.cards.length} 张卡片
              </p>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: '#9ca3af',
                    marginBottom: 8
                  }}
                >
                  正面（问题）
                </label>
                <input
                  type="text"
                  value={cardFront}
                  onChange={(e) => setCardFront(e.target.value)}
                  placeholder="例如：Apple 的中文意思是？"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #374151',
                    backgroundColor: '#16162a',
                    color: '#f8f9fa',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: '#9ca3af',
                    marginBottom: 8
                  }}
                >
                  背面（答案）
                </label>
                <textarea
                  value={cardBack}
                  onChange={(e) => setCardBack(e.target.value)}
                  placeholder="例如：苹果"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #374151',
                    backgroundColor: '#16162a',
                    color: '#f8f9fa',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowCardModal(false)
                      setSelectedDeck(null)
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: '1px solid #374151',
                      backgroundColor: 'transparent',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    关闭
                  </motion.button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddCard}
                  disabled={!cardFront.trim() || !cardBack.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    cursor:
                      cardFront.trim() && cardBack.trim()
                        ? 'pointer'
                        : 'not-allowed',
                    fontSize: 14,
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: '#fff',
                    opacity:
                      cardFront.trim() && cardBack.trim() ? 1 : 0.5
                  }}
                >
                  添加卡片
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
