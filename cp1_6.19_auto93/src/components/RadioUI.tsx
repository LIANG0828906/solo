import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadio } from '../context/RadioContext';
import { TuningKnob } from './TuningKnob';
import { FrequencyDisplay } from './FrequencyDisplay';
import { SpectrumVisualizer } from './SpectrumVisualizer';
import { VolumeSlider } from './VolumeSlider';
import { NoiseSlider } from './NoiseSlider';
import { ChannelInfo } from './ChannelInfo';
import { ChannelList } from './ChannelList';
import type { Channel } from '../types';
import { audioEngine } from '../engine/AudioEngine';
import { FaMusic, FaInfoCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

export function RadioUI() {
  const {
    channels,
    tuningState,
    audioState,
    setTuningAngle,
    setVolume,
    setNoiseMix,
  } = useRadio();

  const [bgColor, setBgColor] = useState('#1F2833');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (tuningState.nearestChannel && tuningState.signalStrength > 50) {
      setBgColor(tuningState.nearestChannel.themeColor);
    } else {
      setBgColor('#1F2833');
    }
  }, [tuningState.nearestChannel, tuningState.signalStrength]);

  const handleTuningChange = useCallback((angle: number) => {
    if (!isInitialized) {
      audioEngine.init().then(() => {
        setIsInitialized(true);
        setShowWelcome(false);
        toast.success('电台已开启，开始探索音乐世界吧！');
      });
    }
    setTuningAngle(angle);
  }, [isInitialized, setTuningAngle]);

  const handleChannelClick = useCallback((channel: Channel) => {
    if (!isInitialized) {
      audioEngine.init().then(() => {
        setIsInitialized(true);
        setShowWelcome(false);
        toast.success(`已调谐到 ${channel.name}`);
      });
    }
    setTuningAngle(channel.angle);
    toast(`调谐到 ${channel.name}`, {
      icon: '🎵',
      style: {
        background: `${channel.themeColor}30`,
        border: `1px solid ${channel.themeColor}`,
        color: channel.themeColor,
      },
    });
  }, [isInitialized, setTuningAngle]);

  const screws = [
    { top: '10px', left: '10px' },
    { top: '10px', right: '10px' },
    { bottom: '10px', left: '10px' },
    { bottom: '10px', right: '10px' },
  ];

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #0B0C10 0%, ${bgColor}50 50%, #1F2833 100%)`,
        transition: 'background 1.5s ease-in-out',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              backgroundColor: '#C0FFC0',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.5 + Math.random() * 1.5,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="hidden lg:flex flex-col items-start justify-center w-64 p-6 absolute left-0 top-1/2 -translate-y-1/2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: '#F5E6CC' }}>
            <FaInfoCircle /> 关于电台
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,230,204,0.7)' }}>
            欢迎来到独立音乐电台。旋转调谐旋钮，探索不同风格的音乐世界。
            从爵士到蓝调，从古典到电子，每种声音都在等待被发现。
          </p>
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(245,230,204,0.1)' }}>
            <p className="text-xs" style={{ color: 'rgba(245,230,204,0.6)' }}>
              提示：接近频道中心时信号最清晰，偏离时会有静电噪声。
            </p>
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-col items-start justify-center w-64 p-6 absolute right-0 top-1/2 -translate-y-1/2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full"
        >
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: '#F5E6CC' }}>
            <FaMusic /> 正在播放
          </h2>
          <AnimatePresence mode="wait">
            {tuningState.nearestChannel && tuningState.signalStrength > 50 ? (
              <motion.div
                key={tuningState.nearestChannel.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-lg"
                style={{ backgroundColor: `${tuningState.nearestChannel.themeColor}20` }}
              >
                <div
                  className="font-bold text-lg mb-1"
                  style={{ color: tuningState.nearestChannel.themeColor }}
                >
                  {tuningState.nearestChannel.name}
                </div>
                <div className="text-sm mb-2" style={{ color: 'rgba(245,230,204,0.8)' }}>
                  {tuningState.nearestChannel.currentTrack}
                </div>
                <div className="text-xs" style={{ color: 'rgba(245,230,204,0.5)' }}>
                  {tuningState.nearestChannel.description}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="static"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'rgba(245,230,204,0.1)' }}
              >
                <div className="text-sm" style={{ color: 'rgba(245,230,204,0.6)' }}>
                  调谐中...
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(245,230,204,0.4)' }}>
                  旋转旋钮找到一个频道
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="hidden md:block lg:hidden absolute right-4 top-1/2 -translate-y-1/2 w-48">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h3 className="text-sm font-bold mb-2" style={{ color: '#F5E6CC' }}>
            <FaMusic className="inline mr-1" /> 正在播放
          </h3>
          {tuningState.nearestChannel && tuningState.signalStrength > 50 && (
            <div className="text-xs" style={{ color: 'rgba(245,230,204,0.7)' }}>
              <div style={{ color: tuningState.nearestChannel.themeColor }}>
                {tuningState.nearestChannel.name}
              </div>
              <div className="truncate">
                {tuningState.nearestChannel.currentTrack}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        className="relative rounded-2xl"
        style={{
          width: '600px',
          height: '400px',
          maxWidth: '95vw',
          backgroundColor: '#4A2C2A',
          boxShadow: `
            0 30px 60px rgba(0,0,0,0.5),
            0 15px 30px rgba(0,0,0,0.4),
            0 5px 15px rgba(0,0,0,0.3),
            inset 0 2px 10px rgba(255,255,255,0.1),
            inset 0 -2px 10px rgba(0,0,0,0.3)
          `,
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
        {screws.map((pos, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              ...pos,
              width: '8px',
              height: '8px',
              backgroundColor: '#666',
              boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.2)',
            }}
          />
        ))}

        <div
          className="absolute inset-4 rounded-xl flex overflow-hidden"
          style={{
            backgroundColor: '#1A1A1A',
            border: '2px solid #444',
          }}
        >
          <div className="w-1/2 p-4 flex flex-col gap-3">
            <FrequencyDisplay
              frequency={tuningState.currentFrequency}
              signalStrength={tuningState.signalStrength}
            />

            <ChannelInfo
              channel={tuningState.nearestChannel}
              signalStrength={tuningState.signalStrength}
            />

            <div className="flex-1 flex items-center justify-center">
              <TuningKnob
                angle={tuningState.currentAngle}
                onChange={handleTuningChange}
              />
            </div>
          </div>

          <div className="w-1/2 p-4 flex flex-col gap-3">
            <ChannelList
              channels={channels}
              currentChannel={tuningState.signalStrength > 50 ? tuningState.nearestChannel : null}
              onChannelClick={handleChannelClick}
            />

            <div className="flex-1 flex items-center justify-center gap-6">
              <VolumeSlider
                value={audioState.volume}
                onChange={setVolume}
              />
              <NoiseSlider
                value={audioState.noiseMix}
                onChange={setNoiseMix}
              />
            </div>

            <SpectrumVisualizer data={audioState.spectrumData} />

            <div className="text-center text-xs text-gray-600 font-mono">
              {isInitialized ? (audioState.isPlaying ? '● PLAYING' : '○ STANDBY') : '○ CLICK TO START'}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showWelcome && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center rounded-2xl z-20"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center p-8">
                <motion.div
                  className="text-4xl mb-4"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  📻
                </motion.div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#C0FFC0' }}>
                  独立音乐电台
                </h2>
                <p className="text-gray-400 mb-4">
                  旋转调谐旋钮开始探索音乐世界
                </p>
                <motion.div
                  className="text-sm text-gray-500"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  点击或拖拽旋钮开始
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        @media (max-width: 768px) {
          .radio-container {
            width: 95vw !important;
            height: auto !important;
            min-height: 400px;
          }
        }
      `}</style>
    </div>
  );
}
