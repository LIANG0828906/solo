import { useEffect, useRef, useState, useCallback } from 'react';
import { Scene3D } from './Scene3D';
import { analyzeSentiment, getSentimentLabel } from './sentiment';
import type { SentimentType } from './sentiment';
import { createInitialBubbles, createBubbleData } from './mockData';
import type { BubbleData } from './mockData';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene3D | null>(null);

  const [selectedBubble, setSelectedBubble] = useState<BubbleData | null>(null);
  const [connectedBubbles, setConnectedBubbles] = useState<BubbleData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState('');
  const [inputText, setInputText] = useState('');
  const [isRoaming, setIsRoaming] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new Scene3D(containerRef.current, {
      onBubbleClick: (data: BubbleData) => {
        setSelectedBubble(data);
        const connectedIds = scene.getConnectedBubbleIds(data.id);
        const connected: BubbleData[] = [];
        for (const id of connectedIds) {
          const d = scene.getBubbleData(id);
          if (d) connected.push(d);
        }
        setConnectedBubbles(connected);
      },
      onBackgroundClick: () => {
        setSelectedBubble(null);
        setConnectedBubbles([]);
      },
    });

    const initialBubbles = createInitialBubbles();
    for (const data of initialBubbles) {
      scene.addBubble(data);
    }

    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  const handleSendQuick = useCallback(() => {
    if (!inputText.trim() || !sceneRef.current) return;
    const sentiment = analyzeSentiment(inputText);
    const data = createBubbleData(inputText, sentiment);
    sceneRef.current.addBubble(data);
    setInputText('');
  }, [inputText]);

  const handleModalSubmit = useCallback(() => {
    if (!modalText.trim() || !sceneRef.current) return;
    const sentiment = analyzeSentiment(modalText);
    const data = createBubbleData(modalText, sentiment);
    sceneRef.current.addBubble(data);
    setModalText('');
    setShowModal(false);
  }, [modalText]);

  const handleRelatedClick = useCallback((id: string) => {
    if (!sceneRef.current) return;
    sceneRef.current.focusOnBubble(id);
  }, []);

  const handleRoamToggle = useCallback(() => {
    if (!sceneRef.current) return;
    const roaming = sceneRef.current.toggleAutoRoam();
    setIsRoaming(roaming);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showModal) {
          setShowModal(false);
          setModalText('');
        } else if (selectedBubble) {
          setSelectedBubble(null);
          setConnectedBubbles([]);
          sceneRef.current?.deselectBubble();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, selectedBubble]);

  const getSentimentClass = (s: SentimentType) => {
    switch (s) {
      case 'positive': return 'sentiment-positive';
      case 'neutral': return 'sentiment-neutral';
      case 'negative': return 'sentiment-negative';
    }
  };

  const getSentimentDotColor = (s: SentimentType) => {
    switch (s) {
      case 'positive': return '#FF6B6B';
      case 'neutral': return '#4ECDC4';
      case 'negative': return '#1A535C';
    }
  };

  return (
    <>
      <div ref={containerRef} className="scene-container" />

      <div className="app-title">气泡密语</div>

      <button className="add-btn" onClick={() => setShowModal(true)}>+</button>

      <button
        className={`roam-btn ${isRoaming ? 'active' : ''}`}
        onClick={handleRoamToggle}
      >
        漫游
      </button>

      <div className="input-bar">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSendQuick(); }}
          placeholder="输入一条消息..."
        />
        <button className="send-btn" onClick={handleSendQuick}>发射</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowModal(false);
            setModalText('');
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>添加新消息</h3>
            <textarea
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              placeholder="写下你想说的话..."
              autoFocus
            />
            <button className="submit-btn" onClick={handleModalSubmit}>放入气泡</button>
          </div>
        </div>
      )}

      {selectedBubble && (
        <div className="detail-panel">
          <div className="detail-text">{selectedBubble.text}</div>
          <span className={`sentiment-tag ${getSentimentClass(selectedBubble.sentiment)}`}>
            {getSentimentLabel(selectedBubble.sentiment)}
          </span>

          {connectedBubbles.length > 0 && (
            <>
              <div className="related-label">关联气泡</div>
              {connectedBubbles.map((b) => (
                <div
                  key={b.id}
                  className="related-item"
                  onClick={() => handleRelatedClick(b.id)}
                >
                  <div
                    className="related-dot"
                    style={{ background: getSentimentDotColor(b.sentiment) }}
                  />
                  <span className="related-text">{b.text}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
}

export default App;
