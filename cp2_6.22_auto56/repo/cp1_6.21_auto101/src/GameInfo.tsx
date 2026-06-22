import React from 'react';
import type { Piece, PlayerColor, PieceType } from './types';
import { PIECE_SYMBOLS, PIECE_NAMES } from './types';

interface Props {
  title: string;
  color: 'self' | 'opponent';
  playerColor: PlayerColor;
  revealedPieces: Piece[];
  totalPieces: number;
}

const TYPE_ORDER: PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
const INITIAL_COUNTS: Record<PieceType, number> = {
  king: 1, queen: 1, rook: 2, bishop: 2, knight: 2, pawn: 8,
};

export default function GameInfo({ title, color, playerColor, revealedPieces, totalPieces }: Props) {
  // 统计剩余棋子数量（所有棋子中，未被吃的 = board里的。要显示：已揭示 / 剩余总数）
  // 这里我们用 revealedPieces（已揭示的），和16-总数差值=被吃数
  // 注意：revealedPieces 只包含已揭示且还存活的
  const revealedCount = revealedPieces.length;
  // 剩余总数：需要外部传入的是 board.pieces 中对应 color 的总数
  // 但本组件接口只接收 revealedPieces，我们根据 revealedPieces 无法推导未揭示还活着的
  // 改进：根据 revealedPieces 和初始总数 16 的关系：被吃 = 16 - (revealed + stillHiddenAlive)
  // 由于接口限制，这里我们做一个合理显示：
  //   已揭示: N / 已揭示中各类统计
  //   剩余未知: (total - revealed)  // totalPieces 是传入的当前存活总数
  //   已被吃: 16 - totalPieces

  const eatenCount = 16 - totalPieces;
  const hiddenAlive = totalPieces - revealedCount;

  // 统计各类已揭示数量
  const revealedByType: Record<PieceType, number> = {
    king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0,
  };
  for (const p of revealedPieces) {
    revealedByType[p.type]++;
  }

  // 各类剩余 = 初始 - 被吃（假设按比例推断，但无法精确）
  // 只能显示：已揭示的各类具体数量

  const isSelf = color === 'self';
  const cardBg = isSelf ? '#F5F5F5' : '#ECEFF1';
  const accentBorder = isSelf ? '#FFD700' : '#455A64';

  return (
    <div style={{
      background: cardBg,
      borderRadius: 8,
      padding: 12,
      color: '#424242',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.6)',
      borderTop: `3px solid ${accentBorder}`,
    }}>
      <div style={{
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 10,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        color: isSelf ? '#5D4037' : '#37474F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>{title}</span>
        <span style={{
          fontSize: 10,
          color: '#757575',
          fontWeight: 500,
          padding: '2px 6px',
          background: 'rgba(0,0,0,0.06)',
          borderRadius: 4,
        }}>
          存活 {totalPieces}/16
        </span>
      </div>

      {/* 数量小统计 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
        marginBottom: 12,
      }}>
        <StatMini label="已揭示" value={revealedCount} color="#2196F3" />
        <StatMini label="暗棋" value={hiddenAlive} color="#9E9E9E" />
        <StatMini label="阵亡" value={eatenCount} color="#F44336" />
      </div>

      {/* 各类明细 */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#616161', marginBottom: 6 }}>
        已揭示棋子
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {TYPE_ORDER.map((type) => {
          const count = revealedByType[type];
          const initial = INITIAL_COUNTS[type];
          const symbol = PIECE_SYMBOLS[type][playerColor];
          return (
            <div key={type} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 6px',
              borderRadius: 4,
              background: count > 0 ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.01)',
              opacity: count > 0 ? 1 : 0.45,
              fontSize: 13,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 20,
                  lineHeight: 1,
                  color: playerColor === 'white' ? '#FFFFFF' : '#212121',
                  textShadow: playerColor === 'white'
                    ? '0 0 1px #000, 1px 1px 1px #000, -1px -1px 1px #000'
                    : '0 0 1px rgba(255,255,255,0.3)',
                  width: 22,
                  textAlign: 'center',
                }}>
                  {symbol}
                </span>
                <span style={{ fontWeight: 500 }}>{PIECE_NAMES[type]}</span>
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: count === 0 ? '#BDBDBD' : count < initial ? '#F57C00' : '#388E3C',
              }}>
                {count}/{initial}
              </span>
            </div>
          );
        })}
      </div>

      {revealedCount === 0 && (
        <div style={{
          fontSize: 11,
          color: '#9E9E9E',
          textAlign: 'center',
          padding: '8px 0',
          fontStyle: 'italic',
        }}>
          尚无已揭示棋子
        </div>
      )}
    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '6px 4px',
      borderRadius: 6,
      background: 'rgba(255,255,255,0.5)',
      border: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div style={{
        fontSize: 18,
        fontWeight: 800,
        color,
        lineHeight: 1.1,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10,
        color: '#757575',
        marginTop: 2,
      }}>
        {label}
      </div>
    </div>
  );
}
