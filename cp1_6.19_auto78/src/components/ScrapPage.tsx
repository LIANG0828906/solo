import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaStickyNote } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { generateScraps } from '../data/mockData';
import type { Book, ScrapPiece, Annotation } from '../types';

interface ScrapPageProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onPuzzleComplete: (bookId: string) => void;
  annotations: Annotation[];
  onAddAnnotation: (bookId: string, sentenceIndex: number, content: string) => void;
  isCompleted: boolean;
}

interface DragState {
  isDragging: boolean;
  pieceId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  currentX: number;
  currentY: number;
}

const ScrapPage = ({
  book,
  isOpen,
  onClose,
  onPuzzleComplete,
  annotations,
  onAddAnnotation,
  isCompleted,
}: ScrapPageProps) => {
  const [scraps, setScraps] = useState<ScrapPiece[]>([]);
  const [placedPieces, setPlacedPieces] = useState<Record<string, boolean>>({});
  const [showFullReview, setShowFullReview] = useState(false);
  const [activeAnnotationSentence, setActiveAnnotationSentence] = useState<number | null>(null);
  const [annotationInput, setAnnotationInput] = useState('');
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [glowEffect, setGlowEffect] = useState(false);

  const dragStateRef = useRef<DragState>({
    isDragging: false,
    pieceId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [, forceUpdate] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const piecePositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  const shuffledScraps = useMemo(() => {
    const s = [...scraps];
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
  }, [scraps]);

  useEffect(() => {
    if (book) {
      const newScraps = generateScraps(book.id, book.title);
      setScraps(newScraps);
      setPlacedPieces({});
      setShowFullReview(isCompleted);
      setActiveAnnotationSentence(null);
      setAnnotationInput('');
      piecePositionsRef.current = {};
    }
  }, [book, isCompleted]);

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging) return;
      dragStateRef.current.currentX = e.clientX - dragStateRef.current.offsetX;
      dragStateRef.current.currentY = e.clientY - dragStateRef.current.offsetY;
      forceUpdate((n) => n + 1);
    };

    const handleMouseUp = () => {
      if (!dragStateRef.current.isDragging) return;
      const { pieceId } = dragStateRef.current;
      dragStateRef.current.isDragging = false;

      if (pieceId && slotRef.current && panelRef.current) {
        const slotRect = slotRef.current.getBoundingClientRect();
        const pieceRect = {
          left: dragStateRef.current.currentX,
          right: dragStateRef.current.currentX + 200,
          top: dragStateRef.current.currentY,
          bottom: dragStateRef.current.currentY + 80,
        };

        const isInSlot =
          pieceRect.left < slotRect.right &&
          pieceRect.right > slotRect.left &&
          pieceRect.top < slotRect.bottom &&
          pieceRect.bottom > slotRect.top;

        if (isInSlot) {
          const piece = scraps.find((s) => s.id === pieceId);
          if (piece) {
            const expectedOrder = Object.keys(placedPieces).length;
            if (piece.order === expectedOrder) {
              const newPlaced = { ...placedPieces, [pieceId]: true };
              setPlacedPieces(newPlaced);

              if (Object.keys(newPlaced).length === scraps.length) {
                setGlowEffect(true);
                setTimeout(() => {
                  setShowFullReview(true);
                  setGlowEffect(false);
                  if (book) {
                    onPuzzleComplete(book.id);
                  }
                }, 500);
              }
            } else {
              toast.error('顺序不对，再试试！', { duration: 1500 });
            }
          }
        }
      }

      piecePositionsRef.current[pieceId!] = { x: 0, y: 0 };
      dragStateRef.current.pieceId = null;
      forceUpdate((n) => n + 1);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, scraps, placedPieces, book, onPuzzleComplete]);

  const handlePieceMouseDown = (e: React.MouseEvent, pieceId: string) => {
    if (placedPieces[pieceId] || showFullReview) return;
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dragStateRef.current = {
      isDragging: true,
      pieceId,
      startX: rect.left,
      startY: rect.top,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      currentX: rect.left,
      currentY: rect.top,
    };
    forceUpdate((n) => n + 1);
  };

  const handleSaveAnnotation = (sentenceIndex: number) => {
    if (!annotationInput.trim() || !book) return;
    onAddAnnotation(book.id, sentenceIndex, annotationInput.trim());
    setAnnotationInput('');
    setActiveAnnotationSentence(null);
  };

  const getAnnotationForSentence = (sentenceIndex: number) => {
    return annotations.filter((a) => a.sentenceIndex === sentenceIndex);
  };

  const sortedReview = useMemo(() => {
    return [...scraps].sort((a, b) => a.order - b.order);
  }, [scraps]);

  if (!book) return null;

  const ds = dragStateRef.current;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 40,
            }}
          />
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '560px',
              maxWidth: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(253, 245, 230, 0.95)',
              backdropFilter: 'blur(10px)',
              zIndex: 50,
              overflowY: 'auto',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                padding: '24px 28px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#333',
                      marginBottom: '6px',
                    }}
                  >
                    {book.title}
                  </h2>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    {book.author} · {book.category}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                  }}
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {!showFullReview ? (
                <>
                  <p
                    style={{
                      color: '#666',
                      fontSize: '13px',
                      marginBottom: '20px',
                      lineHeight: '1.6',
                    }}
                  >
                    将书评碎片按正确顺序拖入下方槽位，拼出完整书评。
                  </p>

                  <div
                    ref={slotRef}
                    style={{
                      position: 'relative',
                      minHeight: '120px',
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px dashed ${glowEffect ? '#87CEEB' : '#D4AF37'}`,
                      backgroundColor: glowEffect
                        ? 'rgba(135, 206, 235, 0.1)'
                        : 'rgba(212, 175, 55, 0.05)',
                      marginBottom: '24px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      boxShadow: glowEffect
                        ? '0 0 30px rgba(135, 206, 235, 0.6)'
                        : 'none',
                      transition: 'box-shadow 0.5s ease, border-color 0.5s ease',
                    }}
                  >
                    {sortedReview.map((piece, idx) =>
                      placedPieces[piece.id] ? (
                        <motion.div
                          key={piece.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(184, 134, 11, 0.1)',
                            border: '1px solid #B8860B',
                            fontSize: '13px',
                            color: '#333',
                            lineHeight: '1.5',
                            maxWidth: '100%',
                          }}
                        >
                          <span
                            style={{
                              color: '#B8860B',
                              fontWeight: '600',
                              marginRight: '6px',
                            }}
                          >
                            {idx + 1}.
                          </span>
                          {piece.content}
                        </motion.div>
                      ) : (
                        <div
                          key={`placeholder-${piece.id}`}
                          style={{
                            minWidth: '80px',
                            height: '36px',
                            borderRadius: '8px',
                            border: '1px dashed rgba(184, 134, 11, 0.3)',
                            backgroundColor: 'rgba(184, 134, 11, 0.03)',
                          }}
                        />
                      )
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      justifyContent: 'center',
                      padding: '16px 0',
                    }}
                  >
                    {shuffledScraps.map((piece) => {
                      if (placedPieces[piece.id]) return null;
                      const isDragging = ds.pieceId === piece.id && ds.isDragging;
                      const pos = piecePositionsRef.current[piece.id] || { x: 0, y: 0 };

                      return (
                        <div
                          key={piece.id}
                          onMouseDown={(e) => handlePieceMouseDown(e, piece.id)}
                          style={{
                            position: isDragging ? 'fixed' : 'relative',
                            left: isDragging ? ds.currentX : pos.x,
                            top: isDragging ? ds.currentY : pos.y,
                            width: '200px',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#fff',
                            border: `2px solid #D4AF37`,
                            boxShadow: isDragging
                              ? '0 8px 24px rgba(0,0,0,0.2)'
                              : '0 2px 8px rgba(0,0,0,0.08)',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            fontSize: '13px',
                            color: '#333',
                            lineHeight: '1.5',
                            zIndex: isDragging ? 1000 : 1,
                            transform: `rotate(${(piece.order % 2 === 0 ? 1 : -1) * (piece.order % 3)}deg)`,
                            userSelect: 'none',
                            transition: isDragging ? 'none' : 'box-shadow 0.2s',
                          }}
                        >
                          {piece.content}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    marginTop: '16px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    完整书评
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    {sortedReview.map((piece, idx) => {
                      const sentenceAnnotations = getAnnotationForSentence(idx);
                      return (
                        <div
                          key={piece.id}
                          style={{
                            position: 'relative',
                            padding: '12px 16px',
                            paddingRight: sentenceAnnotations.length > 0 ? '44px' : '16px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(184, 134, 11, 0.04)',
                            border: '1px solid rgba(184, 134, 11, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onClick={() => {
                            setActiveAnnotationSentence(
                              activeAnnotationSentence === idx ? null : idx
                            );
                            setAnnotationInput('');
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'rgba(184, 134, 11, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'rgba(184, 134, 11, 0.04)';
                          }}
                        >
                          <span
                            style={{
                              color: '#B8860B',
                              fontWeight: '600',
                              marginRight: '8px',
                            }}
                          >
                            {idx + 1}.
                          </span>
                          <span style={{ lineHeight: '1.7', color: '#333' }}>
                            {piece.content}
                          </span>

                          {sentenceAnnotations.length > 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                gap: '2px',
                              }}
                            >
                              {sentenceAnnotations.map((anno, i) => (
                                <div
                                  key={anno.id}
                                  style={{
                                    position: 'relative',
                                  }}
                                  onMouseEnter={() => setHoveredAnnotation(anno.id)}
                                  onMouseLeave={() => setHoveredAnnotation(null)}
                                >
                                  <div
                                    style={{
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '50%',
                                      backgroundColor: '#B8860B',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#fff',
                                      fontSize: '10px',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <FaStickyNote size={9} />
                                  </div>

                                  <AnimatePresence>
                                    {hoveredAnnotation === anno.id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1.05 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                          position: 'absolute',
                                          bottom: '100%',
                                          right: 0,
                                          marginBottom: '8px',
                                          width: '220px',
                                          padding: '12px 14px',
                                          borderRadius: '10px',
                                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                          backdropFilter: 'blur(12px)',
                                          border: '1px solid rgba(184, 134, 11, 0.2)',
                                          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                          zIndex: 10,
                                          fontSize: '12px',
                                          color: '#333',
                                          lineHeight: '1.5',
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: '11px',
                                            color: '#B8860B',
                                            marginBottom: '6px',
                                            fontWeight: '600',
                                          }}
                                        >
                                          批注 #{i + 1}
                                        </div>
                                        {anno.content}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}
                            </div>
                          )}

                          <AnimatePresence>
                            {activeAnnotationSentence === idx && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                  marginTop: '12px',
                                  paddingTop: '12px',
                                  borderTop: '1px dashed rgba(184, 134, 11, 0.2)',
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <textarea
                                  value={annotationInput}
                                  onChange={(e) => setAnnotationInput(e.target.value)}
                                  placeholder="写下你的阅读批注..."
                                  style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(184, 134, 11, 0.3)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                    backdropFilter: 'blur(8px)',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    color: '#333',
                                    outline: 'none',
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.borderColor = '#B8860B';
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(184, 134, 11, 0.3)';
                                  }}
                                />
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                    marginTop: '8px',
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      setActiveAnnotationSentence(null);
                                      setAnnotationInput('');
                                    }}
                                    style={{
                                      padding: '6px 14px',
                                      borderRadius: '6px',
                                      border: '1px solid rgba(0,0,0,0.1)',
                                      backgroundColor: 'transparent',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      color: '#666',
                                      transition: 'all 0.2s',
                                    }}
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={() => handleSaveAnnotation(idx)}
                                    disabled={!annotationInput.trim()}
                                    style={{
                                      padding: '6px 16px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: annotationInput.trim()
                                        ? '#B8860B'
                                        : 'rgba(184, 134, 11, 0.4)',
                                      cursor: annotationInput.trim()
                                        ? 'pointer'
                                        : 'not-allowed',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: '#fff',
                                      transition: 'all 0.2s',
                                    }}
                                  >
                                    保存批注
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ScrapPage;
