import { useState, useEffect, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { ShapeItem } from "../types";

const SHAPE_COLORS = [
  "#EF4444",
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

function ShapeSVG({ type, size = 40 }: { type: number; size?: number }) {
  const color = SHAPE_COLORS[type] || "#6366F1";
  const half = size / 2;

  switch (type) {
    case 0:
      return (
        <svg width={size} height={size} viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill={color} />
        </svg>
      );
    case 1:
      return (
        <svg width={size} height={size} viewBox="0 0 50 50">
          <polygon points="25,5 45,45 5,45" fill={color} />
        </svg>
      );
    case 2:
      return (
        <svg width={size} height={size} viewBox="0 0 50 50">
          <polygon points="25,5 45,25 25,45 5,25" fill={color} />
        </svg>
      );
    case 3: {
      const pts = [
        "25,3", "30.9,16.9", "44,18.8", "34.5,28.1",
        "36.8,41.2", "25,35", "13.2,41.2", "15.5,28.1",
        "6,18.8", "19.1,16.9",
      ].join(" ");
      return (
        <svg width={size} height={size} viewBox="0 0 50 50">
          <polygon points={pts} fill={color} />
        </svg>
      );
    }
    case 4: {
      const pts = [
        "25,5", "42.3,15", "42.3,35", "25,45",
        "7.7,35", "7.7,15",
      ].join(" ");
      return (
        <svg width={size} height={size} viewBox="0 0 50 50">
          <polygon points={pts} fill={color} />
        </svg>
      );
    }
    case 5:
      return (
        <svg width={size} height={size} viewBox="0 0 50 50">
          <path
            d="M25,44 C25,44 5,30 5,18 C5,9 12,4 25,14 C38,4 45,9 45,18 C45,30 25,44 25,44 Z"
            fill={color}
          />
        </svg>
      );
    default:
      return null;
  }
}

interface CellState {
  highlightBorder: boolean;
  correctOverlay: boolean;
  wrongFlash: boolean;
  shape: ShapeItem | null;
}

interface GameBoardProps {
  sequence: ShapeItem[];
  phase: string;
  isCurrentPlayer: boolean;
  onCellClick: (gridIndex: number) => void;
  socket: Socket | null;
}

export default function GameBoard({
  sequence,
  phase,
  isCurrentPlayer,
  onCellClick,
  socket,
}: GameBoardProps) {
  const [cellStates, setCellStates] = useState<CellState[]>(
    () => Array.from({ length: 25 }, () => ({
      highlightBorder: false,
      correctOverlay: false,
      wrongFlash: false,
      shape: null,
    }))
  );
  const [displayShapes, setDisplayShapes] = useState<boolean>(true);
  const prevPhaseRef = useRef(phase);
  const prevSeqRef = useRef<string>("");

  useEffect(() => {
    const seqKey = sequence.map((s) => `${s.gridIndex}-${s.shapeType}`).join(",");
    if (prevSeqRef.current !== seqKey) {
      prevSeqRef.current = seqKey;
      setCellStates(
        Array.from({ length: 25 }, () => ({
          highlightBorder: false,
          correctOverlay: false,
          wrongFlash: false,
          shape: null,
        }))
      );
      setDisplayShapes(true);
    }
  }, [sequence]);

  useEffect(() => {
    if (phase === "input" && prevPhaseRef.current === "displaying") {
      setDisplayShapes(false);
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (!socket) return;

    const onClickResult = (data: {
      correct: boolean;
      gridIndex: number;
      clickIndex?: number;
    }) => {
      if (data.correct) {
        setCellStates((prev) => {
          const next = [...prev];
          next[data.gridIndex] = {
            ...next[data.gridIndex],
            highlightBorder: true,
            correctOverlay: true,
          };
          return next;
        });
      } else {
        setCellStates((prev) => {
          const next = [...prev];
          next[data.gridIndex] = {
            ...next[data.gridIndex],
            wrongFlash: true,
          };
          return next;
        });
        setTimeout(() => {
          setCellStates((prev) => {
            const next = [...prev];
            next[data.gridIndex] = {
              ...next[data.gridIndex],
              wrongFlash: false,
            };
            return next;
          });
        }, 600);
      }
    };

    socket.on("click-result", onClickResult);
    return () => {
      socket.off("click-result", onClickResult);
    };
  }, [socket]);

  const handleClick = useCallback(
    (gridIndex: number) => {
      if (phase !== "input" || !isCurrentPlayer) return;
      onCellClick(gridIndex);
    },
    [phase, isCurrentPlayer, onCellClick]
  );

  const shapeMap = new Map<number, ShapeItem>();
  if (displayShapes || phase === "displaying") {
    for (const item of sequence) {
      shapeMap.set(item.gridIndex, item);
    }
  }

  const shapeSize = 40;

  return (
    <div className="grid-container">
      {Array.from({ length: 25 }, (_, i) => {
        const cell = cellStates[i];
        const shape = shapeMap.get(i);
        const isClickable = phase === "input" && isCurrentPlayer && !cell.correctOverlay;

        let cls = "grid-cell";
        if (isClickable) cls += " clickable";
        if (cell.highlightBorder) cls += " highlight-border";
        if (cell.correctOverlay) cls += " correct-overlay";
        if (cell.wrongFlash) cls += " wrong-flash";

        return (
          <div
            key={i}
            className={cls}
            onClick={() => handleClick(i)}
          >
            {shape && (
              <ShapeSVG type={shape.shapeType} size={shapeSize} />
            )}
          </div>
        );
      })}
    </div>
  );
}
