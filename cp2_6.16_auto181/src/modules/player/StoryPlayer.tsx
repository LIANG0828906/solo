import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { PlayerControls } from './PlayerControls';
import type { Character, Panel } from '@/types/story';

const getDialogBubblePath = (direction: 'left' | 'right', w: number, h: number): string => {
  const r = 12;
  if (direction === 'right') {
    return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r + 20} ${h} L ${r + 8} ${h + 14} L ${r + 12} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
  } else {
    return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${w - r - 12} ${h} L ${w - r - 8} ${h + 14} L ${w - r - 20} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
  }
};

const wrapText = (text: string, maxCharsPerLine: number): string[] => {
  const result: string[] = [];
  const input = text.replace(/\r\n/g, '\n');
  const lines = input.split('\n');
  for (const line of lines) {
    if (line.length <= maxCharsPerLine) {
      result.push(line);
    } else {
      let cur = '';
      for (const ch of line) {
        if (cur.length >= maxCharsPerLine) {
          result.push(cur);
          cur = ch;
        } else {
          cur += ch;
        }
      }
      if (cur) result.push(cur);
    }
    if (result.length >= 2) break;
  }
  return result.slice(0, 2);
};

interface DialogBubbleProps {
  text: string;
  x: number;
  y: number;
  direction: 'left' | 'right';
  displayedText: string;
}

const DialogBubble: React.FC<DialogBubbleProps> = ({ text, x, y, direction, displayedText }) => {
  const lines = wrapText(text, 18);
  const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
  const bubbleW = Math.min(280, Math.max(140, maxLineLen * 17 + 50));
  const bubbleH = lines.length > 1 ? 84 : 56;
  let bx = direction === 'right' ? x + 56 : x - 56 - bubbleW;
  const by = y - bubbleH - 24;

  const showLines = wrapText(displayedText, 18);

  return (
    <g style={{ transformBox: 'fill-box' }}>
      <path
        d={getDialogBubblePath(direction, bubbleW, bubbleH)}
        transform={`translate(${bx}, ${by})`}
        fill="white"
        stroke="#4A2C2A"
        strokeWidth="4"
      />
      {lines.length > 0 && (
        <foreignObject x={bx + 16} y={by + 10} width={bubbleW - 32} height={bubbleH - 12}>
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#4A2C2A',
              lineHeight: lines.length > 1 ? '30px' : '34px',
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
            }}
          >
            {showLines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </foreignObject>
      )}
    </g>
  );
};

interface PlayerCharacterProps {
  character: Character;
  panel: Panel;
  animDelay: number;
  fadeOn: boolean;
  typingText: string;
}

const PlayerCharacter: React.FC<PlayerCharacterProps> = ({
  character,
  panel,
  animDelay,
  fadeOn,
  typingText,
}) => {
  const [visible, setVisible] = useState(!fadeOn);

  useEffect(() => {
    if (fadeOn) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), animDelay);
      return () => clearTimeout(t);
    }
  }, [fadeOn, animDelay, character.id]);

  return (
    <g style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease-out' }}>
      {character.dialog && (
        <DialogBubble
          text={character.dialog.text}
          x={character.x}
          y={character.y}
          direction={character.dialog.direction}
          displayedText={typingText}
        />
      )}
      <g>
        <rect
          x={character.x - 44}
          y={character.y - 22}
          width="88"
          height="26"
          rx="13"
          fill="#4A2C2A"
        />
        <text
          x={character.x}
          y={character.y - 5}
          textAnchor="middle"
          fontSize="15"
          fontWeight="bold"
          fill="#FFF8E7"
        >
          {character.name}
        </text>
        <circle
          cx={character.x}
          cy={character.y + 26}
          r="40"
          fill="rgba(74,44,42,0.08)"
        />
        <text
          x={character.x}
          y={character.y + 54}
          textAnchor="middle"
          fontSize="64"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {character.emoji}
        </text>
      </g>
    </g>
  );
};

interface PlayerPanelProps {
  panel: Panel;
  slideOffset: number;
  fadeChars: boolean;
  typingTexts: Record<string, string>;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({ panel, slideOffset, fadeChars, typingTexts }) => {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        transform: `translateX(${slideOffset * 100}%)`,
        transition: 'transform 0.8s ease-in-out',
      }}
    >
      <div
        className="relative shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl"
        style={{
          width: panel.width,
          height: panel.height,
          backgroundColor: panel.backgroundColor,
          backgroundImage: panel.backgroundImage ? `url(${panel.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '4px solid rgba(255,255,255,0.85)',
        }}
      >
        <svg
          viewBox={`0 0 ${panel.width} ${panel.height}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {panel.characters.map((ch, i) => (
            <PlayerCharacter
              key={ch.id}
              character={ch}
              panel={panel}
              animDelay={i * 300}
              fadeOn={fadeChars}
              typingText={typingTexts[ch.id] ?? ''}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export const StoryPlayer: React.FC = () => {
  const {
    story,
    currentPanelIndex,
    playbackStatus,
    playbackSpeed,
    exitPlayerMode,
    play,
    pause,
    nextPanel,
  } = useStore();

  const [slideIndices, setSlideIndices] = useState({
    current: currentPanelIndex,
    prev: -1,
    direction: 1 as 1 | -1,
  });
  const [fadeTrigger, setFadeTrigger] = useState(0);
  const [typingTexts, setTypingTexts] = useState<Record<string, string>>({});
  const rafRef = useRef<number | null>(null);
  const autoTimerRef = useRef<number | null>(null);
  const typingTimersRef = useRef<Record<string, number>>({});

  const currentPanel = story.panels[currentPanelIndex];

  const clearAllTimers = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (autoTimerRef.current !== null) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    Object.values(typingTimersRef.current).forEach((t) => window.clearTimeout(t));
    typingTimersRef.current = {};
  }, []);

  const startTypingEffect = useCallback(
    (panel: Panel) => {
      setTypingTexts({});
      Object.values(typingTimersRef.current).forEach((t) => window.clearTimeout(t));
      typingTimersRef.current = {};

      const totalDialogChars = panel.characters.reduce(
        (sum, c) => sum + (c.dialog?.text.length ?? 0),
        0
      );
      const basePerCharMs = 70 / playbackSpeed;
      const dialogueTime = totalDialogChars * basePerCharMs;
      const fadeTime = panel.characters.length * 300 + 500;
      const minPanelTime = (5000 / playbackSpeed);
      const panelDuration = Math.max(minPanelTime, dialogueTime + fadeTime + 1000);

      let startedAt: number | null = null;
      const tick = (ts: number) => {
        if (!startedAt) startedAt = ts;
        const elapsed = ts - startedAt;

        const perCharMs = Math.max(30, (panelDuration - fadeTime - 1500) / Math.max(totalDialogChars, 1) / playbackSpeed);

        setTypingTexts(() => {
          const next: Record<string, string> = {};
          let charStart = fadeTime;
          for (const ch of panel.characters) {
            if (!ch.dialog) continue;
            const text = ch.dialog.text;
            const charsVisible = Math.max(0, Math.min(text.length, Math.floor((elapsed - charStart) / perCharMs)));
            next[ch.id] = text.slice(0, charsVisible);
            charStart += text.length * perCharMs + 100;
          }
          return next;
        });

        if (elapsed < panelDuration) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          if (playbackStatus === 'playing') {
            autoTimerRef.current = window.setTimeout(() => {
              nextPanel();
            }, 100);
          }
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [playbackSpeed, playbackStatus, nextPanel]
  );

  useEffect(() => {
    setSlideIndices((prev) => ({
      current: currentPanelIndex,
      prev: prev.current,
      direction: currentPanelIndex >= prev.current ? 1 : -1,
    }));
    setFadeTrigger((t) => t + 1);
  }, [currentPanelIndex]);

  useEffect(() => {
    if (!currentPanel) return;
    clearAllTimers();
    if (playbackStatus === 'playing') {
      const transitionStart = window.setTimeout(() => {
        startTypingEffect(currentPanel);
      }, 400);
      typingTimersRef.current['_init'] = transitionStart;
    }
    return clearAllTimers;
  }, [currentPanelIndex, currentPanel, playbackStatus, clearAllTimers, startTypingEffect]);

  useEffect(() => {
    if (playbackStatus === 'paused') {
      clearAllTimers();
    } else if (playbackStatus === 'playing' && currentPanel && !Object.keys(typingTimersRef.current).length) {
      startTypingEffect(currentPanel);
    }
  }, [playbackStatus, currentPanel, clearAllTimers, startTypingEffect]);

  useEffect(() => {
    if (playbackStatus === 'playing') {
      clearAllTimers();
      if (currentPanel) {
        startTypingEffect(currentPanel);
      }
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackSpeed]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') exitPlayerMode();
    else if (e.key === ' ') {
      e.preventDefault();
      playbackStatus === 'playing' ? pause() : play();
    } else if (e.key === 'ArrowRight') {
      nextPanel();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackStatus]);

  if (!currentPanel) return null;

  const displayPanels: { panel: Panel; offset: number }[] = [];
  const { direction, prev } = slideIndices;
  if (prev >= 0 && prev !== currentPanelIndex && story.panels[prev]) {
    displayPanels.push({
      panel: story.panels[prev],
      offset: direction === 1 ? -1 : 1,
    });
  }
  displayPanels.push({ panel: currentPanel, offset: 0 });
  const nextIdx = currentPanelIndex + (direction === 1 ? 1 : -1);
  if (story.panels[nextIdx]) {
    displayPanels.push({
      panel: story.panels[nextIdx],
      offset: direction === 1 ? 1 : -1,
    });
  }

  return (
    <div className="player-mode select-none">
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {displayPanels.map(({ panel, offset }) => (
          <PlayerPanel
            key={panel.id + '-' + fadeTrigger}
            panel={panel}
            slideOffset={offset}
            fadeChars={offset === 0}
            typingTexts={offset === 0 ? typingTexts : {}}
          />
        ))}
      </div>

      {playbackStatus === 'finished' && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div
            className="px-10 py-8 rounded-3xl text-center animate-zoom-in"
            style={{
              backgroundColor: 'rgba(74,44,42,0.92)',
              border: '3px solid #E63946',
            }}
          >
            <div className="text-6xl mb-4">🎉</div>
            <div className="font-bangers text-4xl mb-2" style={{ color: '#FFF8E7', letterSpacing: '2px' }}>
              故事播放完毕！
            </div>
            <div className="text-white/70">按 空格键 重新播放 或 ESC 退出</div>
          </div>
        </div>
      )}

      <PlayerControls onExit={exitPlayerMode} />
    </div>
  );
};
