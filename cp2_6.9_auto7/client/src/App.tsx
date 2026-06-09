import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BubbleCanvas from './components/BubbleCanvas';
import Panel from './components/Panel';
import type { Bubble, Cluster, SentimentPoint, AnalyzeResponse } from './types';

const App: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [sentimentHistory, setSentimentHistory] = useState<SentimentPoint[]>([]);
  const [highlightedCluster, setHighlightedCluster] = useState<string | null>(null);
  const [filteredCluster, setFilteredCluster] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (bubbles.length > 0) {
        const sentiments = bubbles.map(b => b.sentiment ?? 50).filter(s => s !== undefined);
        if (sentiments.length > 0) {
          const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
          setSentimentHistory(prev => {
            const newHistory = [...prev, { time: Date.now(), value: avgSentiment }];
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            return newHistory.filter(p => p.time > fiveMinutesAgo).slice(-30);
          });
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [bubbles]);

  const analyzeBubbles = useCallback(async (currentBubbles: Bubble[]) => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bubbles: currentBubbles })
      });
      const data: AnalyzeResponse = await response.json();
      setClusters(data.clusters);
      setBubbles(prev => prev.map(b => ({
        ...b,
        sentiment: data.sentiments[b.id] ?? b.sentiment,
        cluster: data.clusters.find(c => c.bubbleIds.includes(b.id))?.name ?? b.cluster
      })));
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  }, []);

  const addBubble = useCallback((content: string, source: 'voice' | 'text') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newBubble: Bubble = {
      id: uuidv4(),
      content,
      source,
      timestamp: Date.now(),
      x: 50 + Math.random() * (rect.width - 200),
      y: rect.height - 100,
      createdAt: Date.now()
    };

    setBubbles(prev => {
      const updated = [...prev, newBubble];
      setTimeout(() => analyzeBubbles(updated), 100);
      return updated;
    });
  }, [analyzeBubbles]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          addBubble(data.text, 'voice');
        } catch (err) {
          console.error('Transcribe failed:', err);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Recording failed:', err);
      const fallbackTexts = [
        '新的创意想法',
        '优化产品体验',
        '技术架构改进',
        '用户增长策略',
        '品牌视觉升级'
      ];
      addBubble(fallbackTexts[Math.floor(Math.random() * fallbackTexts.length)], 'voice');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const updateBubble = useCallback((id: string, updates: Partial<Bubble>) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const deleteBubble = useCallback((id: string) => {
    setBubbles(prev => {
      const bubble = prev.find(b => b.id === id);
      if (!bubble) return prev;
      return prev.map(b => b.id === id ? { ...b, isDeleting: true } : b);
    });
    setTimeout(() => {
      setBubbles(prev => {
        const updated = prev.filter(b => b.id !== id);
        if (updated.length > 0) {
          analyzeBubbles(updated);
        } else {
          setClusters([]);
        }
        return updated;
      });
    }, 300);
  }, [analyzeBubbles]);

  const handleClusterClick = (clusterName: string) => {
    setHighlightedCluster(prev => prev === clusterName ? null : clusterName);
    setTimeout(() => setHighlightedCluster(null), 3000);
  };

  const handleChartClick = (clusterName: string | null) => {
    setFilteredCluster(prev => prev === clusterName ? null : clusterName);
  };

  const appStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    overflow: 'hidden'
  };

  const canvasContainerStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  const micButtonStyle: React.CSSProperties = {
    position: 'absolute' as const,
    bottom: '30px',
    left: '50%',
    transform: `translateX(-50%) scale(1)`,
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: isRecording ? '#f44336' : '#2196f3',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isRecording ? '0 0 20px rgba(244, 67, 54, 0.6)' : '0 4px 12px rgba(33, 150, 243, 0.4)',
    transition: 'all 0.2s ease',
    zIndex: 100
  };

  return (
    <div style={appStyle}>
      {!isMobile && (
        <Panel
          type="left"
          clusters={clusters}
          highlightedCluster={highlightedCluster}
          onClusterClick={handleClusterClick}
        />
      )}

      <div style={canvasContainerStyle}>
        {isMobile && (
          <Panel
            type="top"
            clusters={clusters}
            highlightedCluster={highlightedCluster}
            onClusterClick={handleClusterClick}
          />
        )}

        <div ref={canvasRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <BubbleCanvas
            bubbles={bubbles}
            clusters={clusters}
            highlightedCluster={highlightedCluster}
            filteredCluster={filteredCluster}
            onUpdateBubble={updateBubble}
            onDeleteBubble={deleteBubble}
            onAnalyze={() => analyzeBubbles(bubbles)}
          />

          <button
            style={micButtonStyle}
            onClick={toggleRecording}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              {isRecording ? (
                <rect x="6" y="6" width="12" height="12" rx="2" />
              ) : (
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              )}
            </svg>
          </button>
        </div>

        {isMobile && (
          <Panel
            type="bottom"
            clusters={clusters}
            sentimentHistory={sentimentHistory}
            filteredCluster={filteredCluster}
            onChartClick={handleChartClick}
          />
        )}
      </div>

      {!isMobile && (
        <Panel
          type="right"
          clusters={clusters}
          sentimentHistory={sentimentHistory}
          filteredCluster={filteredCluster}
          onChartClick={handleChartClick}
          style={{ borderRight: 'none', borderLeft: '1px solid #333' }}
        />
      )}
    </div>
  );
};

export default App;
