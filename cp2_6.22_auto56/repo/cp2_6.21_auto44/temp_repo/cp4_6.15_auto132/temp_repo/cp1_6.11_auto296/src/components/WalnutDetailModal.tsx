
import { useState, useEffect, useRef } from 'react';
import { WalnutViewer } from './WalnutViewer';
import { Walnut } from '../types';
import { getGradeColor, calculateGrade } from '../utils/gradeCalculator';
import { useAppStore } from '../store/useStore';
import { api } from '../services/api';
import './WalnutDetailModal.css';

interface WalnutDetailModalProps {
  walnut: Walnut | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WalnutDetailModal({ walnut, isOpen, onClose }: WalnutDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showWave, setShowWave] = useState(false);
  const [calculatedGrade, setCalculatedGrade] = useState(walnut?.grade || '中品');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const user = useAppStore(state => state.user);
  const favorites = useAppStore(state => state.favorites);
  const addFavorite = useAppStore(state => state.addFavorite);
  const removeFavorite = useAppStore(state => state.removeFavorite);
  const updateUserBalance = useAppStore(state => state.updateUserBalance);
  const setUser = useAppStore(state => state.setUser);

  const isFavorite = favorites.some(f => f.id === walnut?.id);

  useEffect(() => {
    if (walnut) {
      const grade = calculateGrade(walnut.textureDensity, walnut.symmetry, walnut.soundFrequency);
      setCalculatedGrade(grade);
    }
  }, [walnut]);

  if (!isOpen || !walnut) return null;

  const handlePlaySound = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setShowWave(true);

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContext();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const oscillator2 = audioCtx.createOscillator();
    const gainNode2 = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800 + walnut.soundFrequency * 8, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(1200 + walnut.soundFrequency * 6, audioCtx.currentTime + 0.05);
    gainNode2.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.05);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator2.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
    oscillator2.stop(audioCtx.currentTime + 0.4);

    setTimeout(() => {
      setIsPlaying(false);
      setShowWave(false);
      audioCtx.close();
    }, 600);
  };

  const handleToggleFavorite = async () => {
    if (!user) return;
    
    try {
      if (isFavorite) {
        const result = await api.user.removeFavorite(walnut.id);
        removeFavorite(walnut.id);
        setUser(result.user);
      } else {
        const result = await api.user.addFavorite(walnut.id);
        addFavorite(walnut);
        setUser(result.user);
      }
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const handleBuy = async () => {
    if (!user) return;
    
    try {
      const result = await api.walnuts.buy(walnut.id);
      updateUserBalance(result.user.balance, result.user.transactionCount);
      addFavorite(result.walnut);
      setUser(result.user);
      alert('恭喜藏家，喜得珍宝！');
      onClose();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="walnut-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="detail-content">
          <div className="walnut-viewer-section">
            <h2 className="walnut-title">{walnut.name}</h2>
            <p className="walnut-subtitle">{walnut.variety}</p>
            <WalnutViewer 
              textureSeed={walnut.textureSeed} 
              size={280}
              interactive={true}
            />
            <p className="viewer-hint">拖拽旋转 · 滚轮缩放</p>
            
            <div className="sound-section">
              <button 
                className={`sound-btn ${showWave ? 'playing' : ''}`}
                onClick={handlePlaySound}
                disabled={isPlaying}
              >
                {showWave && <span className="wave-ring ring-1"></span>}
                {showWave && <span className="wave-ring ring-2"></span>}
                {showWave && <span className="wave-ring ring-3"></span>}
                <span className="sound-icon">🔊</span>
                <span className="sound-text">听 声</span>
              </button>
            </div>
          </div>
          
          <div className="info-section">
            <div className="grade-section">
              <h3>品相评级</h3>
              <div 
                className="grade-badge"
                style={{ 
                  color: getGradeColor(calculatedGrade),
                  borderColor: getGradeColor(calculatedGrade),
                }}
              >
                {calculatedGrade}
              </div>
            </div>

            <div className="stats-section">
              <div className="stat-item">
                <span className="stat-label">纹理密集度</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill" 
                    style={{ width: `${walnut.textureDensity}%` }}
                  ></div>
                </div>
                <span className="stat-value">{walnut.textureDensity}</span>
              </div>
              
              <div className="stat-item">
                <span className="stat-label">对称性</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill"
                    style={{ width: `${walnut.symmetry}%` }}
                  ></div>
                </div>
                <span className="stat-value">{walnut.symmetry}</span>
              </div>
              
              <div className="stat-item">
                <span className="stat-label">音色频率</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill"
                    style={{ width: `${walnut.soundFrequency}%` }}
                  ></div>
                </div>
                <span className="stat-value">{walnut.soundFrequency}</span>
              </div>
            </div>

            <div className="price-section">
              <h3>参考估价</h3>
              <p className="price-value">{walnut.price} <span className="price-unit">文钱</span></p>
            </div>

            <div className="action-section">
              <button 
                className={`btn-brush favorite-btn ${isFavorite ? 'favorited' : ''}`}
                onClick={handleToggleFavorite}
              >
                {isFavorite ? '★ 已收藏' : '☆ 加入收藏'}
              </button>
              
              {walnut.isForSale && (
                <button 
                  className="btn-brush btn-primary buy-btn"
                  onClick={handleBuy}
                >
                  购 买
                </button>
              )}
              
              {!walnut.isForSale && walnut.ownerId && (
                <span className="owned-badge">已被收藏</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
