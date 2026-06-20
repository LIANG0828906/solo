import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BoxSeries, Artwork } from '../../shared/types';
import { apiService } from '../services/api';
import { useStore } from '../store/useStore';
import BoxReveal from '../components/BoxReveal';

function FlipCard({ series, onBuy, onView }: { series: BoxSeries; onBuy: () => void; onView: () => void }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      style={{ perspective: 1200, width: '100%', aspectRatio: '3/4', cursor: 'pointer' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={onView}
    >
      <motion.div
        style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      >
        <div
          className="glass-card scanline"
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            padding: 0,
            overflow: 'hidden',
            border: '1.5px solid rgba(0, 240, 255, 0.35)',
            boxShadow: flipped
              ? '0 0 28px rgba(0, 240, 255, 0.45), 0 0 56px rgba(255, 0, 170, 0.25)'
              : '0 0 14px rgba(0, 240, 255, 0.2)'
          }}
        >
          <div
            style={{
              width: '100%',
              height: '68%',
              background: `linear-gradient(135deg, #1a0a2e 0%, #0a0a0f 100%)`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at 30% 30%, rgba(0,240,255,0.35), transparent 55%), radial-gradient(circle at 70% 70%, rgba(255,0,170,0.35), transparent 55%)`
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                gap: 8,
                padding: 20
              }}
            >
              {series.artworks.slice(0, 6).map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    borderRadius: 6,
                    background: `linear-gradient(${45 + i * 30}deg, rgba(0,240,255,0.4), rgba(255,0,170,0.4))`,
                    boxShadow: `0 0 8px rgba(0,240,255,0.3)`,
                    opacity: 0.7
                  }}
                />
              ))}
            </div>
            <div
              className="font-display"
              style={{
                position: 'absolute',
                bottom: 10,
                left: 16,
                fontSize: 11,
                letterSpacing: '0.25em',
                color: '#00f0ff',
                textShadow: '0 0 8px rgba(0, 240, 255, 0.9)'
              }}
            >
              SERIES // {series.artworks.length} PIECES
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div className="font-display glow-text" style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
              {series.name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <div className="tag-chip-pink tag-chip">{series.totalCount - series.soldCount} LEFT</div>
              <div className="font-display" style={{ fontSize: 18, fontWeight: 700, color: '#ff00aa' }}>
                ¥{series.price}
              </div>
            </div>
          </div>
        </div>

        <div
          className="glass-card-strong scanline"
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1.5px solid rgba(255, 0, 170, 0.4)',
            boxShadow: '0 0 30px rgba(255, 0, 170, 0.35)'
          }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.25em', color: '#7a7a8e', marginBottom: 4 }}>
              SERIES DETAILS
            </div>
            <div className="font-display glow-text-pink" style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
              {series.name}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 16
              }}
            >
              <div className="glass-card" style={{ padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#7a7a8e', letterSpacing: '0.15em' }}>TOTAL</div>
                <div className="font-display glow-text" style={{ fontSize: 22, fontWeight: 800 }}>
                  {series.totalCount}
                </div>
              </div>
              <div className="glass-card" style={{ padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#7a7a8e', letterSpacing: '0.15em' }}>SOLD</div>
                <div className="font-display glow-text-pink" style={{ fontSize: 22, fontWeight: 800 }}>
                  {series.soldCount}
                </div>
              </div>
            </div>
            <div style={{ height: 4, background: 'rgba(0, 240, 255, 0.15)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(series.soldCount / series.totalCount) * 100}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #00f0ff, #ff00aa)',
                  boxShadow: '0 0 10px #00f0ff'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="neon-btn"
              style={{ flex: 1, padding: '10px 16px', fontSize: 12 }}
              onClick={e => {
                e.stopPropagation();
                onView();
              }}
            >
              VIEW
            </button>
            <button
              className="neon-btn neon-btn-pink"
              style={{ flex: 1, padding: '10px 16px', fontSize: 12 }}
              onClick={e => {
                e.stopPropagation();
                onBuy();
              }}
            >
              BUY ¥{series.price}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailModal({ series, onClose, onBuy }: { series: BoxSeries; onClose: () => void; onBuy: () => void }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const artworks = series.artworks;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(5, 5, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'grid',
        placeItems: 'center',
        padding: 40
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        className="glass-card-strong"
        style={{
          width: 'min(960px, 100%)',
          maxHeight: '88vh',
          overflow: 'auto',
          padding: 28,
          border: '1.5px solid rgba(0, 240, 255, 0.35)',
          boxShadow: '0 0 60px rgba(0, 240, 255, 0.2), 0 0 120px rgba(255, 0, 170, 0.1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.25em', color: '#7a7a8e', marginBottom: 4 }}>
              SERIES // LIMITED EDITION
            </div>
            <h2 className="glow-text" style={{ fontSize: 28 }}>{series.name}</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 0, 170, 0.15)',
              border: '1px solid rgba(255, 0, 170, 0.4)',
              color: '#ff00aa',
              cursor: 'pointer',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        <div
          className="glass-card"
          style={{
            position: 'relative',
            width: '100%',
            paddingTop: '45%',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 20
          }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={slideIdx}
              src={artworks[slideIdx].previewImage}
              alt={artworks[slideIdx].title}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </AnimatePresence>
          <div
            style={{
              position: 'absolute',
              left: 16,
              bottom: 16,
              display: 'flex',
              gap: 8
            }}
          >
            {artworks.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIdx(i)}
                style={{
                  width: i === slideIdx ? 28 : 10,
                  height: 10,
                  borderRadius: 99,
                  border: 'none',
                  cursor: 'pointer',
                  background: i === slideIdx
                    ? 'linear-gradient(90deg, #00f0ff, #ff00aa)'
                    : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s',
                  boxShadow: i === slideIdx ? '0 0 10px #00f0ff' : 'none'
                }}
              />
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              right: 16,
              bottom: 16,
              padding: '6px 12px',
              borderRadius: 99,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 12,
              letterSpacing: '0.1em',
              color: '#00f0ff'
            }}
          >
            {slideIdx + 1} / {artworks.length}
          </div>
        </div>

        <p style={{ color: '#c9c9d6', lineHeight: 1.7, marginBottom: 20 }}>{series.description}</p>

        <div style={{ marginBottom: 20 }}>
          <div className="font-display" style={{ fontSize: 13, color: '#7a7a8e', letterSpacing: '0.2em', marginBottom: 10 }}>
            UNIQUE CODES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {artworks.map(a => (
              <div
                key={a.id}
                className="glass-card"
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <img src={a.thumbnail} alt="" style={{ width: 34, height: 46, borderRadius: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.title}
                  </div>
                  <div className="tag-chip" style={{ fontSize: 10, padding: '2px 6px' }}>{a.code}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 22px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(255, 0, 170, 0.1))',
            border: '1px solid rgba(0, 240, 255, 0.25)'
          }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.25em', color: '#7a7a8e' }}>PRICE PER BOX</div>
            <div className="font-display glow-text-pink" style={{ fontSize: 30, fontWeight: 800 }}>
              ¥{series.price}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.25em', color: '#7a7a8e' }}>REMAINING</div>
            <div className="font-display glow-text" style={{ fontSize: 30, fontWeight: 800 }}>
              {series.totalCount - series.soldCount} / {series.totalCount}
            </div>
          </div>
          <button className="neon-btn neon-btn-pink" style={{ padding: '14px 36px', fontSize: 14 }} onClick={onBuy}>
            UN