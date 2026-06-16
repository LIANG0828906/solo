import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGameStore, type StoryNode } from '../../store/gameStore'
import AutoSave from './AutoSave'

export default function StoryEngine() {
  const { storyId } = useParams()
  const navigate = useNavigate()
  const {
    nodes,
    currentNodeId,
    setCurrentNode,
    playerState,
    makeDecision,
    addItem,
    initialNodeId,
    lastDecision,
    decisionVisible,
    hideDecision,
  } = useGameStore()

  const [fadeIn, setFadeIn] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)

  useEffect(() => {
    if (!currentNodeId && initialNodeId) {
      setCurrentNode(initialNodeId)
    }
  }, [currentNodeId, initialNodeId, setCurrentNode])

  useEffect(() => {
    setFadeIn(false)
    const t = setTimeout(() => setFadeIn(true), 50)
    return () => clearTimeout(t)
  }, [currentNodeId])

  const currentNode = nodes.find((n) => n.id === currentNodeId) ?? null

  const handleChoice = useCallback(
    (label: string, targetNodeId: string, choiceKey: string) => {
      setSelectedChoice(label)
      makeDecision(choiceKey, label)
      if (currentNode?.type === 'event') {
        const itemMatch = currentNode.text.match(/获得[：:](.+)/)
        if (itemMatch) {
          addItem(itemMatch[1].trim())
        }
      }
      setTimeout(() => {
        setCurrentNode(targetNodeId)
        setSelectedChoice(null)
      }, 300)
    },
    [makeDecision, setCurrentNode, addItem, currentNode]
  )

  const handleContinue = useCallback(
    (targetNodeId: string) => {
      setSelectedChoice('continue')
      setTimeout(() => {
        setCurrentNode(targetNodeId)
        setSelectedChoice(null)
      }, 200)
    },
    [setCurrentNode]
  )

  const handleBackToStart = () => {
    navigate('/')
  }

  if (!currentNode) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', color: '#4A4E69' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌌</div>
          <p style={{ fontSize: '18px', marginBottom: '24px' }}>故事尚未初始化</p>
          <button onClick={handleBackToStart} style={orangeBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E67E22' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F39C12' }}
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <AutoSave slotIndex={Number(storyId) || 0} />

      {decisionVisible && lastDecision && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            backgroundColor: '#2D2D3F',
            border: '1px solid #6C5CE7',
            borderRadius: '0 0 12px 12px',
            color: '#A29BFE',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(108,92,231,0.3)',
            animation: 'slideIn 0.4s ease-out forwards',
            zIndex: 1000,
          }}
          key={lastDecision}
        >
          决策已记录：{lastDecision}
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 100,
        }}
      >
        <button
          onClick={handleBackToStart}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2D2D3F',
            color: '#B2BEC3',
            border: '1px solid #4A4E69',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#A29BFE'; e.currentTarget.style.color = '#E2E8F0' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#4A4E69'; e.currentTarget.style.color = '#B2BEC3' }}
        >
          ← 返回
        </button>
      </div>

      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          zIndex: 100,
        }}
      >
        <div
          style={{
            padding: '6px 12px',
            backgroundColor: '#2D2D3F',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#B2BEC3',
            border: '1px solid #4A4E69',
          }}
        >
          {playerState.playerName}
        </div>
        {playerState.inventory.length > 0 && (
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: '#2D2D3F',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#F39C12',
              border: '1px solid #F39C12',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={playerState.inventory.join(', ')}
          >
            🎒 {playerState.inventory.join(', ')}
          </div>
        )}
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          padding: '0 24px',
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s, transform 0.5s',
        }}
      >
        <NodeRenderer
          node={currentNode}
          onChoice={handleChoice}
          onContinue={handleContinue}
          selectedChoice={selectedChoice}
        />
      </div>
    </div>
  )
}

function NodeRenderer({
  node,
  onChoice,
  onContinue,
  selectedChoice,
}: {
  node: StoryNode
  onChoice: (label: string, targetNodeId: string, key: string) => void
  onContinue: (targetNodeId: string) => void
  selectedChoice: string | null
}) {
  const typeLabel =
    node.type === 'dialogue' ? '💬 对话' : node.type === 'choice' ? '🔀 抉择' : '⚡ 事件'

  const typeColor =
    node.type === 'dialogue' ? '#4A4E69' : node.type === 'choice' ? '#9B59B6' : '#2ECC71'

  const renderRichText = (text: string): React.ReactNode => {
    const lines = text.split('\n')
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g)
      return (
        <React.Fragment key={lineIdx}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIdx} style={{ color: '#F39C12', fontWeight: 700 }}>
                  {part.slice(2, -2)}
                </strong>
              )
            }
            return <span key={partIdx}>{part}</span>
          })}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      )
    })
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-block',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          color: typeColor,
          backgroundColor: `${typeColor}22`,
          border: `1px solid ${typeColor}44`,
          marginBottom: '16px',
        }}
      >
        {typeLabel}
      </div>

      <h2
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#FFFFFF',
          marginBottom: '24px',
          letterSpacing: '1px',
        }}
      >
        {node.title}
      </h2>

      <div
        style={{
          fontSize: '17px',
          lineHeight: '1.8',
          color: '#E2E8F0',
          backgroundColor: '#2D2D3F',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #4A4E69',
          marginBottom: '32px',
          textAlign: 'left',
          wordWrap: 'break-word',
        }}
      >
        {renderRichText(node.text)}
      </div>

      {node.type === 'choice' && node.outputs.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          {node.outputs.map((output, idx) => (
            <button
              key={idx}
              onClick={() => onChoice(output.label, output.targetNodeId, `choice_${node.id}_${idx}`)}
              style={{
                width: '240px',
                height: '48px',
                fontSize: '18px',
                fontWeight: 500,
                color: '#FFFFFF',
                backgroundColor:
                  selectedChoice === output.label ? '#A29BFE' : '#6C5CE7',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s, transform 0.15s, box-shadow 0.2s',
                boxShadow: selectedChoice === output.label
                  ? '0 0 20px rgba(108,92,231,0.5)'
                  : '0 2px 8px rgba(0,0,0,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#A29BFE'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(108,92,231,0.4)'
              }}
              onMouseLeave={(e) => {
                if (selectedChoice !== output.label) {
                  e.currentTarget.style.backgroundColor = '#6C5CE7'
                }
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            >
              {output.label}
            </button>
          ))}
        </div>
      )}

      {(node.type === 'dialogue' || node.type === 'event') && node.outputs.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {node.outputs.map((output, idx) => (
            <button
              key={idx}
              onClick={() => onContinue(output.targetNodeId)}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 500,
                color: '#FFFFFF',
                backgroundColor: selectedChoice === 'continue' ? '#E67E22' : '#F39C12',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E67E22'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F39C12'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {output.label} →
            </button>
          ))}
        </div>
      )}

      {node.outputs.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌟</div>
          <p style={{ fontSize: '16px', color: '#B2BEC3', marginBottom: '20px' }}>
            故事至此结束
          </p>
        </div>
      )}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  backgroundColor: '#12121D',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'auto',
  position: 'relative',
}

const orangeBtnStyle: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: '#F39C12',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'background-color 0.2s',
}
