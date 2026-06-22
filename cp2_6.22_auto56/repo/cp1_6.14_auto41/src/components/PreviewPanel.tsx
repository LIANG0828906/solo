import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import type { DialogueNode, Character, Connection, Emotion } from '../types';
import { EMOTION_COLORS, EMOTION_LABELS } from '../types';

interface PreviewPanelProps {
  characters: Character[];
  nodes: DialogueNode[];
  connections: Connection[];
  rootNodeId: string | null;
}

interface HistoryEntry {
  nodeId: string;
  portIndex?: number;
}

const BASE_TYPE_INTERVAL = 35;

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  characters,
  nodes,
  connections,
  rootNodeId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [typeSpeed, setTypeSpeed] = useState<1 | 2>(1);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(rootNodeId);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [showChoices, setShowChoices] = useState(false);

  const typingTimerRef = useRef<number | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const typeIntervalRef = useRef(BASE_TYPE_INTERVAL);

  const characterMap = useMemo(() => {
    const map = new Map<string, Character>();
    characters.forEach((c) => map.set(c.id, c));
    return map;
  }, [characters]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, DialogueNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const outgoingConnections = useMemo(() => {
    const map = new Map<string, Connection[]>();
    connections.forEach((c) => {
      const arr = map.get(c.sourceId) || [];
      arr.push(c);
      map.set(c.sourceId, arr);
    });
    return map;
  }, [connections]);

  const getNextNodeByPort = useCallback(
    (sourceId: string, portIndex: number): string | null => {
      const conns = outgoingConnections.get(sourceId) || [];
      const conn = conns.find((c) => c.sourcePort === portIndex);
      return conn?.targetId || null;
    },
    [outgoingConnections]
  );

  const getAutoNextNode = useCallback(
    (sourceId: string): string | null => {
      const conns = outgoingConnections.get(sourceId) || [];
      if (conns.length === 0) return null;
      const port0 = conns.find((c) => c.sourcePort === 0);
      return port0?.targetId || null;
    },
    [outgoingConnections]
  );

  const clearTypingTimer = useCallback(() => {
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  const clearAutoAdvanceTimer = useCallback(() => {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, []);

  const currentNode = currentNodeId ? nodeMap.get(currentNodeId) : null;
  const currentCharacter = currentNode ? characterMap.get(currentNode.characterId) : null;

  const startTyping = useCallback(
    (text: string) => {
      clearTypingTimer();
      clearAutoAdvanceTimer();
      setDisplayedText('');
      setIsTyping(true);
      setShowChoices(false);

      if (!text) {
        setIsTyping(false);
        return;
      }

      let index = 0;
      const interval = typeSpeed === 2 ? BASE_TYPE_INTERVAL / 2 : BASE_TYPE_INTERVAL;
      typeIntervalRef.current = interval;

      const typeNext = () => {
        index++;
        setDisplayedText(text.slice(0, index));
        if (index < text.length) {
          typingTimerRef.current = window.setTimeout(typeNext, typeIntervalRef.current);
        } else {
          setIsTyping(false);
        }
      };
      typingTimerRef.current = window.setTimeout(typeNext, typeIntervalRef.current);
    },
    [clearTypingTimer, clearAutoAdvanceTimer, typeSpeed]
  );

  useEffect(() => {
    if (currentNode) {
      startTyping(currentNode.text);
    }
    return () => {
      clearTypingTimer();
      clearAutoAdvanceTimer();
    };
  }, [currentNodeId, currentNode, startTyping, clearTypingTimer, clearAutoAdvanceTimer]);

  useEffect(() => {
    if (!isPlaying || isTyping || !currentNodeId) return;

    const node = nodeMap.get(currentNodeId);
    if (!node) return;

    const hasBranches = (node.branchLabels || []).filter((l) => l && l.trim()).length > 1;
    const hasChoices = (outgoingConnections.get(currentNodeId) || []).length > 1;

    if (hasBranches || hasChoices) {
      setShowChoices(true);
      return;
    }

    const delay = speed === 2 ? 600 : 1200;
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      const nextId = getAutoNextNode(currentNodeId);
      if (nextId) {
        setHistory((h) => [...h, { nodeId: currentNodeId }]);
        setCompletedNodes((s) => new Set(s).add(currentNodeId));
        setCurrentNodeId(nextId);
      } else {
        setIsPlaying(false);
      }
    }, delay);

    return () => clearAutoAdvanceTimer();
  }, [isPlaying, isTyping, currentNodeId, nodeMap, outgoingConnections, getAutoNextNode, speed]);

  const handleChoiceSelect = useCallback(
    (portIndex: number) => {
      if (!currentNodeId) return;
      const nextId = getNextNodeByPort(currentNodeId, portIndex);
      if (nextId) {
        setHistory((h) => [...h, { nodeId: currentNodeId, portIndex }]);
        setCompletedNodes((s) => new Set(s).add(currentNodeId));
        setCurrentNodeId(nextId);
        setShowChoices(false);
      }
    },
    [currentNodeId, getNextNodeByPort]
  );

  const handleSkipTyping = useCallback(() => {
    if (isTyping && currentNode) {
      clearTypingTimer();
      setDisplayedText(currentNode.text);
      setIsTyping(false);
    }
  }, [isTyping, currentNode, clearTypingTimer]);

  const handlePlayPause = useCallback(() => {
    if (!currentNodeId && rootNodeId) {
      setCurrentNodeId(rootNodeId);
      setHistory([]);
      setCompletedNodes(new Set());
      setIsPlaying(true);
      return;
    }
    if (isTyping) {
      handleSkipTyping();
      return;
    }
    setIsPlaying((p) => !p);
  }, [currentNodeId, rootNodeId, isTyping, handleSkipTyping]);

  const handleNext = useCallback(() => {
    if (!currentNodeId) return;
    if (isTyping) {
      handleSkipTyping();
      return;
    }
    const node = nodeMap.get(currentNodeId);
    if (!node) return;

    const hasChoices = (outgoingConnections.get(currentNodeId) || []).length > 1;
    const hasLabels = (node.branchLabels || []).filter((l) => l && l.trim()).length > 1;

    if (hasChoices || hasLabels) {
      setShowChoices(true);
      setIsPlaying(false);
      return;
    }

    const nextId = getAutoNextNode(currentNodeId);
    if (nextId) {
      setHistory((h) => [...h, { nodeId: currentNodeId }]);
      setCompletedNodes((s) => new Set(s).add(currentNodeId));
      setCurrentNodeId(nextId);
      setIsPlaying(true);
    }
  }, [currentNodeId, isTyping, handleSkipTyping, nodeMap, outgoingConnections, getAutoNextNode]);

  const handlePrev = useCallback(() => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const last = newHistory.pop()!;
    setHistory(newHistory);
    setCompletedNodes((s) => {
      const next = new Set(s);
      next.delete(last.nodeId);
      return next;
    });
    setCurrentNodeId(last.nodeId);
    setShowChoices(false);
    setIsPlaying(false);
  }, [history]);

  const handleRestart = useCallback(() => {
    clearTypingTimer();
    clearAutoAdvanceTimer();
    setHistory([]);
    setCompletedNodes(new Set());
    setDisplayedText('');
    setShowChoices(false);
    setIsTyping(false);
    setCurrentNodeId(rootNodeId);
    setIsPlaying(true);
  }, [rootNodeId, clearTypingTimer, clearAutoAdvanceTimer]);

  const toggleSpeed = useCallback(() => {
    setSpeed((s) => (s === 1 ? 2 : 1));
  }, []);

  const toggleTypeSpeed = useCallback(() => {
    setTypeSpeed((s) => (s === 1 ? 2 : 1));
  }, []);

  const totalNodes = nodes.length;
  const progressPercent = totalNodes > 0 ? (completedNodes.size / totalNodes) * 100 : 0;

  const visibleChoices = useMemo(() => {
    if (!currentNode || !showChoices) return [];
    const conns = outgoingConnections.get(currentNode.id) || [];
    const labels = currentNode.branchLabels || [];
    return labels
      .map((label, idx) => {
        const conn = conns.find((c) => c.sourcePort === idx);
        const displayLabel = label && label.trim() ? label : `选项 ${idx + 1}`;
        return {
          portIndex: idx,
          label: displayLabel,
          hasTarget: !!conn,
        };
      })
      .filter((c, idx) => {
        const hasLabel = labels[idx] && labels[idx].trim();
        const hasConn = conns.some((cc) => cc.sourcePort === idx);
        return hasLabel || hasConn;
      });
  }, [currentNode, showChoices, outgoingConnections]);

  const historyNodes = useMemo(() => {
    return history
      .map((h) => {
        const node = nodeMap.get(h.nodeId);
        if (!node) return null;
        const char = characterMap.get(node.characterId);
        return {
          id: h.nodeId,
          text: node.text,
          emotion: node.emotion,
          characterName: char?.name || '未知',
          characterAvatar: char?.avatar || '👤',
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      text: string;
      emotion: Emotion;
      characterName: string;
      characterAvatar: string;
    }>;
  }, [history, nodeMap, characterMap]);

  if (!rootNodeId || nodes.length === 0) {
    return (
      <div className="preview-container">
        <div className="preview-empty">
          <div className="preview-empty-icon">🎬</div>
          <div className="preview-empty-text">
            暂无对话数据
            <br />
            请在左侧创建角色和对话节点
            <br />
            并将节点连接起来开始预览
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-container">
      <div className="preview-stage" onClick={isTyping ? handleSkipTyping : undefined}>
        <div className="preview-bg-decoration" />

        <div className="dialogue-history">
          {historyNodes.map((h) => (
            <div key={h.id} className="dialogue-line">
              <div className={`dialogue-avatar emotion-${h.emotion}`}>{h.characterAvatar}</div>
              <div className="dialogue-content">
                <div className="dialogue-name">{h.characterName}</div>
                <div className="dialogue-bubble">{h.text}</div>
              </div>
            </div>
          ))}
        </div>

        {currentNode && currentCharacter && (
          <div className="dialogue-line" style={{ opacity: 1 }}>
            <div className={`dialogue-avatar emotion-${currentNode.emotion}`}>
              {currentCharacter.avatar}
            </div>
            <div className="dialogue-content">
              <div className="dialogue-name">{currentCharacter.name}</div>
              <div className="dialogue-bubble">
                {displayedText}
                {isTyping && <span className="typing-cursor" />}
              </div>
            </div>
          </div>
        )}

        {showChoices && visibleChoices.length > 0 && (
          <div className="choice-list">
            {visibleChoices.map((choice) => (
              <button
                key={choice.portIndex}
                className="choice-btn"
                onClick={() => choice.hasTarget && handleChoiceSelect(choice.portIndex)}
                disabled={!choice.hasTarget}
              >
                {choice.label}
                {!choice.hasTarget && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>
                    (未连接)
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="preview-controls">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="control-buttons">
          <div className="control-group">
            <button
              className="control-btn"
              onClick={handleRestart}
              title="重新开始"
            >
              <RotateCcw size={16} />
            </button>
            <button
              className="control-btn"
              onClick={handlePrev}
              disabled={history.length === 0}
              title="上一步"
            >
              <SkipBack size={16} />
            </button>
            <button
              className={`control-btn ${isPlaying ? 'active' : ''}`}
              onClick={handlePlayPause}
              title={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              className="control-btn"
              onClick={handleNext}
              disabled={
                !currentNodeId ||
                (!isTyping &&
                  currentNode &&
                  (outgoingConnections.get(currentNodeId) || []).length === 0 &&
                  (currentNode.branchLabels || []).filter((l) => l && l.trim()).length === 0)
              }
              title="下一步"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <div className="time-display">
            {completedNodes.size} / {totalNodes}
          </div>

          <div className="control-group">
            <button
              className={`speed-toggle ${typeSpeed === 2 ? 'active' : ''}`}
              onClick={toggleTypeSpeed}
              title="打字速度"
            >
              <Gauge size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
              字{typeSpeed}x
            </button>
            <button
              className={`speed-toggle ${speed === 2 ? 'active' : ''}`}
              onClick={toggleSpeed}
              title="播放倍速"
            >
              {speed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
