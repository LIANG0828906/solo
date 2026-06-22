import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
import { ROWS, COLS, VIP_BG, VipLevel, AVATAR_COLORS } from '@/types';
import useAppStore from '@/store';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  row: number;
  col: number;
}

export default function SeatingChart() {
  const guests = useAppStore((s) => s.guests);
  const seats = useAppStore((s) => s.seats);
  const assignSeat = useAppStore((s) => s.assignSeat);
  const clearSeat = useAppStore((s) => s.clearSeat);

  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    row: -1,
    col: -1,
  });

  const contextMenuRef = useRef<HTMLDivElement>(null);

  const getGuest = useCallback(
    (guestId: string | null) => {
      if (!guestId) return null;
      return guests.find((g) => g.id === guestId) ?? null;
    },
    [guests]
  );

  const getAvatarColor = useCallback((name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, row: number, col: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverCell(`${row}-${col}`);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, row: number, col: number) => {
      e.preventDefault();
      setDragOverCell(null);
      const guestId = e.dataTransfer.getData('text/plain');
      if (guestId) {
        assignSeat(row, col, guestId);
      }
    },
    [assignSeat]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      const key = `${row}-${col}`;
      if (seats[key]) {
        e.preventDefault();
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          row,
          col,
        });
      }
    },
    [seats]
  );

  const handleClearSeat = useCallback(() => {
    clearSeat(contextMenu.row, contextMenu.col);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, [clearSeat, contextMenu.row, contextMenu.col]);

  useEffect(() => {
    const handleClickAway = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickAway);
    }
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [contextMenu.visible]);

  const renderSeat = (row: number, col: number) => {
    const key = `${row}-${col}`;
    const guestId = seats[key] ?? null;
    const guest = getGuest(guestId);
    const isDragOver = dragOverCell === key;
    const isOccupied = !!guest;

    const bgColor = isOccupied
      ? VIP_BG[guest!.vipLevel as VipLevel]
      : '#F8F9FA';
    const borderColor = isOccupied
      ? 'transparent'
      : '#CED4DA';
    const borderStyle = isOccupied ? 'solid' : 'dashed';

    return (
      <motion.div
        key={key}
        whileHover={{
          y: -3,
          boxShadow: isOccupied
            ? '0 6px 16px rgba(0,0,0,0.15)'
            : '0 4px 12px rgba(0,0,0,0.08)',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onDragOver={(e) => handleDragOver(e, row, col)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, row, col)}
        onContextMenu={(e) => handleContextMenu(e, row, col)}
        style={{
          width: 80,
          height: 80,
          borderRadius: 8,
          backgroundColor: isDragOver
            ? '#D6EAF8'
            : bgColor,
          border: isDragOver
            ? '2px dashed #3498DB'
            : `1px ${borderStyle} ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isOccupied ? 'context-menu' : 'default',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 0.2s, background-color 0.2s',
          boxSizing: 'border-box',
        }}
      >
        {isOccupied ? (
          <>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: getAvatarColor(guest!.name),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 4,
                flexShrink: 0,
              }}
            >
              {guest!.name.charAt(0)}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#2C3E50',
                lineHeight: 1.2,
                textAlign: 'center',
                maxWidth: 72,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {guest!.name}
            </div>
            <div
              style={{
                fontSize: 8,
                color: '#7F8C8D',
                lineHeight: 1.2,
                textAlign: 'center',
                maxWidth: 72,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {guest!.company}
            </div>
          </>
        ) : (
          <UserPlus size={20} color="#BDC3C7" />
        )}
      </motion.div>
    );
  };

  const rows = Array.from({ length: ROWS }, (_, r) => r);
  const cols = Array.from({ length: COLS }, (_, c) => c);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 80px)`,
          gridTemplateRows: `repeat(${ROWS}, 80px)`,
          gap: 0,
        }}
      >
        {rows.map((row) =>
          cols.map((col) => {
            const showRightDashed =
              col < COLS - 1;
            const showBottomDashed =
              row < ROWS - 1;
            return (
              <div
                key={`${row}-${col}`}
                style={{
                  position: 'relative',
                  padding: 1,
                }}
              >
                {renderSeat(row, col)}
                {showRightDashed && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: -1,
                      width: 2,
                      height: 0,
                      borderTop: '1px dashed #E0E0E0',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {showBottomDashed && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      left: '50%',
                      height: 2,
                      width: 0,
                      borderLeft: '1px dashed #E0E0E0',
                      transform: 'translateX(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
            backgroundColor: '#fff',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '4px 0',
            minWidth: 120,
          }}
        >
          <button
            onClick={handleClearSeat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: '#E74C3C',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#FDF2F2';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <X size={14} />
            清除座位
          </button>
        </div>
      )}
    </div>
  );
}
