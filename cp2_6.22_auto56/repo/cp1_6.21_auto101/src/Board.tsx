import React, { useMemo, CSSProperties } from 'react';
import type { BoardState, Piece, PlayerColor, Position } from './types';
import { PIECE_SYMBOLS } from './types';

interface Props {
  board: BoardState;
  playerColor: PlayerColor;
  selectedPieceId: string | null;
  legalTargets: Position[];
  shockwavePos: Position | null;
  capturedAnim: { pos: Position; piece: Piece } | null;
  revealAnim: Position | null;
  onSquareClick: (row: number, col: number) => void;
}

const BOARD_SIZE = 8;
const LIGHT_SQUARE = '#DEB887';
const DARK_SQUARE = '#8B4513';
const HOVER_COLOR = 'rgba(224, 224, 224, 0.45)';
const LEGAL_DOT = 'rgba(76, 175, 80, 0.55)';

export default function Board(props: Props) {
  const { board, playerColor, selectedPieceId, legalTargets, shockwavePos, capturedAnim, revealAnim, onSquareClick } = props;

  // 渲染时翻转棋盘：黑方视角要180翻转
  const isBlackView = playerColor === 'black';

  const pieceMap = useMemo(() => {
    const map = new Map<string, Piece>();
    for (const p of board.pieces) {
      map.set(`${p.position.row},${p.position.col}`, p);
    }
    return map;
  }, [board.pieces]);

  const legalSet = useMemo(() => {
    const s = new Set<string>();
    for (const t of legalTargets) s.add(`${t.row},${t.col}`);
    return s;
  }, [legalTargets]);

  // 生成格子顺序：如果是黑方视角，行列都倒序
  const rows = isBlackView ? [...Array(BOARD_SIZE).keys()].reverse() : [...Array(BOARD_SIZE).keys()];
  const cols = isBlackView ? [...Array(BOARD_SIZE).keys()].reverse() : [...Array(BOARD_SIZE).keys()];

  return (
    <div
      style={boardContainerStyle}
    >
      {/* 列标签 a-h */}
      <div style={colLabelsStyle}>
        {cols.map((c) => (
          <div key={c} style={labelStyle}>
            {String.fromCharCode(97 + c)}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex' }}>
        {/* 行标签 1-8 */}
        <div style={rowLabelsStyle}>
          {rows.map((r) => (
            <div key={r} style={labelStyle}>
              {r + 1}
            </div>
          ))}
        </div>

        {/* 棋盘主体 */}
        <div style={boardGridStyle}>
          {rows.map((r) => (
            <React.Fragment key={r}>
              {cols.map((c) => {
                const isLight = (r + c) % 2 === 0;
                const bg = isLight ? LIGHT_SQUARE : DARK_SQUARE;
                const piece = pieceMap.get(`${r},${c}`);
                const isSelected = piece?.id === selectedPieceId;
                const isLegalTarget = legalSet.has(`${r},${c}`);
                const isShockwave = shockwavePos?.row === r && shockwavePos?.col === c;
                const isCapturedHere = capturedAnim?.pos.row === r && capturedAnim?.pos.col === c;
                const isRevealHere = revealAnim?.row === r && revealAnim?.col === c;

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => onSquareClick(r, c)}
                    style={{
                      ...squareStyle,
                      background: bg,
                      cursor: piece || isLegalTarget ? 'pointer' : 'default',
                    }}
                    className="chess-square"
                  >
                    {/* 悬停高亮使用 :hover 伪类 */}
                    <HoverOverlay />

                    {/* 合法目标提示点 */}
                    {isLegalTarget && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: piece ? '70%' : 14,
                        height: piece ? '70%' : 14,
                        borderRadius: '50%',
                        border: piece ? '3px solid rgba(76, 175, 80, 0.55)' : 'none',
                        background: piece ? 'rgba(76, 175, 80, 0.15)' : LEGAL_DOT,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }} />
                    )}

                    {/* 棋子渲染 */}
                    {piece && (
                      <PieceView
                        piece={piece}
                        selected={isSelected}
                        viewAsBlack={isBlackView}
                        revealAnim={isRevealHere}
                      />
                    )}

                    {/* 吃子动画（覆盖在目标格上） */}
                    {isCapturedHere && capturedAnim && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          fontSize: 38,
                          lineHeight: 1,
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                          zIndex: 5,
                          animation: 'capturedDie 0.5s ease-in forwards',
                          transform: 'translate(-50%, -50%)',
                          color: capturedAnim.piece.color === 'white' ? '#FFFFFF' : '#212121',
                          textShadow: capturedAnim.piece.color === 'white'
                            ? '0 0 2px #000, 0 0 2px #000'
                            : '0 0 2px #fff',
                        }}
                      >
                        {PIECE_SYMBOLS[capturedAnim.piece.type][capturedAnim.piece.color]}
                      </div>
                    )}

                    {/* 落子冲击波 */}
                    {isShockwave && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.6)',
                          pointerEvents: 'none',
                          zIndex: 4,
                          animation: 'shockwave 0.5s ease-out forwards',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function PieceView({
  piece,
  selected,
  viewAsBlack,
  revealAnim,
}: {
  piece: Piece;
  selected: boolean;
  viewAsBlack: boolean;
  revealAnim: boolean;
}) {
  // 已揭示 → 显示符号
  if (piece.revealed) {
    const symbol = PIECE_SYMBOLS[piece.type][piece.color];
    const isWhite = piece.color === 'white';
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          fontSize: 40,
          lineHeight: 1,
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: viewAsBlack
            ? 'translate(-50%, -50%) rotate(180deg)'
            : 'translate(-50%, -50%)',
          zIndex: selected ? 4 : 3,
          borderRadius: '50%',
          animation: selected
            ? 'selectedGlow 0.6s ease-in-out infinite'
            : revealAnim
            ? 'revealFlip 0.4s ease-out'
            : undefined,
          color: isWhite ? '#FFFFFF' : '#212121',
          textShadow: isWhite
            ? '0 0 1px #000, 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000'
            : '0 0 1px rgba(255,255,255,0.4)',
          fontWeight: 700,
        }}
      >
        {symbol}
      </div>
    );
  }

  // 未揭示 → 灰色圆形问号
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: viewAsBlack
          ? 'translate(-50%, -50%) rotate(180deg)'
          : 'translate(-50%, -50%)',
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #9E9E9E, #616161)',
        border: selected ? 'none' : '2px solid rgba(0,0,0,0.3)',
        color: '#757575',
        fontSize: 24,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        zIndex: selected ? 4 : 3,
        boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.4)',
        animation: selected ? 'selectedGlow 0.6s ease-in-out infinite' : undefined,
      }}
    >
      ?
    </div>
  );
}

function HoverOverlay() {
  // 用CSS变量hover effect，注入style
  return null;
}

// ---------- Styles ----------
const boardContainerStyle: CSSProperties = {
  display: 'inline-block',
  padding: 10,
  background: 'linear-gradient(145deg, #5D4037, #3E2723)',
  borderRadius: 10,
  boxShadow: '0 0 0 3px #5D4037, 0 12px 40px rgba(0,0,0,0.7), inset 0 2px 6px rgba(255,255,255,0.08)',
  width: '100%',
  maxWidth: 560,
  aspectRatio: '1 / 1',
};

const boardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
  gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
  width: '100%',
  aspectRatio: '1 / 1',
  border: '2px solid #3E2723',
  borderRadius: 4,
  overflow: 'hidden',
  position: 'relative',
};

const squareStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  transition: 'background-color 0.2s ease',
};

const colLabelsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
  paddingLeft: 20,
  marginBottom: 2,
};

const rowLabelsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: 18,
  marginRight: 2,
};

const labelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  fontSize: 11,
  color: '#D7CCC8',
  fontWeight: 600,
  minWidth: 0,
  aspectRatio: '1 / 1',
};

// 注入悬停样式
const injected = new WeakSet();
function injectHoverStyles() {
  if (typeof document === 'undefined') return;
  if (injected.has(document)) return;
  injected.add(document);
  const el = document.createElement('style');
  el.textContent = `
    .chess-square:hover {
      background-image: linear-gradient(${HOVER_COLOR}, ${HOVER_COLOR}) !important;
      background-blend-mode: overlay;
    }
    .chess-square:active {
      filter: brightness(0.95);
    }
    button[style*="btnPrimary"]:active {
      transform: translateY(2px) !important;
      box-shadow: 0 1px 0 #2E7D32, 0 2px 6px rgba(76, 175, 80, 0.3) !important;
    }
    button[style*="btnDanger"]:hover {
      background: rgba(244, 67, 54, 0.2) !important;
    }
    @media (max-width: 900px) {
      .board-wrap { max-width: 90vw !important; }
    }
  `;
  document.head.appendChild(el);
}
if (typeof window !== 'undefined') injectHoverStyles();
