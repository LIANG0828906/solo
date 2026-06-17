import React, { memo, useEffect, useRef, useState } from 'react';
import { Play, Heart, Headphones } from 'lucide-react';
import { useAudioStore, AudioClip } from '@/stores/audioStore';
import { audioEngine } from '@/utils/audioEngine';

const AVAILABLE_TAGS = ['雨声', '森林', '城市', '咖啡馆', '海洋', '夜晚'];

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const getHeatColor = (_intensity: number, likeCount: number): string => {
  const heat = Math.min(1, likeCount / 500);
  const r = Math.floor(108 + heat * (255 - 108));
  const g = Math.floor(99 - heat * 99);
  const b = Math.floor(255 - heat * (255 - 107));
  return `rgb(${r}, ${g}, ${b})`;
};

interface AudioCardProps {
  audio: AudioClip;
  index: number;
  onPlay: (audio: AudioClip) => void;
}

const AudioCard: React.FC<AudioCardProps> = memo(({ audio, index, onPlay }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const currentAudioId = useAudioStore((state) => state.currentAudio?.id);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const isCurrentPlaying = currentAudioId === audio.id && isPlaying;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    onPlay(audio);
  };

  const staggerOffset = (index % 5) * 4;
  const cardStagger = index % 3 === 0 ? 0 : (index % 3 === 1 ? 8 : 16);

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="audio-card cursor-pointer break-inside-avoid"
      style={{
        backgroundColor: '#1E1E2E',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: `${16 + staggerOffset}px`,
        marginTop: `${cardStagger}px`,
        boxShadow: isHovered
          ? '0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(108, 99, 255, 0.15)'
          : '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? (isHovered ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)')
          : 'translateY(20px)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative mb-3">
        <div className="flex items-end justify-center gap-1 h-16 overflow-visible">
          {audio.waveformData.map((height, i) => {
            const baseHeight = Math.max(8, height * 64);
            const breatheHeight = isCurrentPlaying
              ? baseHeight
              : baseHeight;
            return (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: isVisible ? `${breatheHeight}px` : '0px',
                  backgroundColor: isCurrentPlaying
                    ? getHeatColor(height, audio.likeCount + 100)
                    : getHeatColor(height, audio.likeCount),
                  transition: 'height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transitionDelay: isVisible ? `${i * 0.06}s` : `${(9 - i) * 0.03}s`,
                  animation: isVisible && !isCurrentPlaying
                    ? `breathe-${i} 2.5s ease-in-out ${0.3 + i * 0.1}s infinite`
                    : (isCurrentPlaying ? `pulse-bar-${i} 0.5s ease-in-out infinite alternate` : 'none'),
                  opacity: isVisible ? 1 : 0,
                  transformOrigin: 'bottom',
                }}
              />
            );
          })}
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', opacity: 0 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0';
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(108, 99, 255, 0.9)' }}
          >
            <Play className="w-5 h-5 text-white ml-1" fill="white" />
          </div>
        </div>
      </div>

      <h3
        className="text-white text-sm font-medium mb-2 truncate"
        style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {audio.title}
      </h3>

      <div className="flex flex-wrap gap-2 mb-3">
        {audio.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: '#3A3A5C', fontSize: '12px', color: 'white' }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1" style={{ color: '#888', fontSize: '12px' }}>
          <Headphones className="w-3 h-3" />
          <span>{formatNumber(audio.playCount)}</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: '#FF6B6B', fontSize: '12px' }}>
          <Heart className={`w-3 h-3 ${audio.isLiked ? 'fill-current' : ''}`} />
          <span>{formatNumber(audio.likeCount)}</span>
        </div>
      </div>
    </div>
  );
});

AudioCard.displayName = 'AudioCard';

const SearchBar: React.FC = () => {
  const [localQuery, setLocalQuery] = useState('');
  const setSearchQuery = useAudioStore((state) => state.setSearchQuery);
  const searchQuery = useAudioStore((state) => state.searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  return (
    <input
      type="text"
      placeholder="搜索音频标题或标签..."
      value={localQuery}
      onChange={(e) => setLocalQuery(e.target.value)}
      className="w-full text-white placeholder-gray-500 outline-none transition-all"
      style={{
        height: '44px',
        backgroundColor: '#2A2A3D',
        borderRadius: '22px',
        padding: '0 16px',
        fontSize: '14px',
        border: '1px solid transparent',
        transition: 'border-color 0.2s ease',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#6C63FF';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'transparent';
      }}
    />
  );
};

const TagFilter: React.FC = () => {
  const selectedTag = useAudioStore((state) => state.selectedTag);
  const setSelectedTag = useAudioStore((state) => state.setSelectedTag);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setSelectedTag(null)}
        className="px-4 py-1.5 rounded-full text-white text-sm transition-all"
        style={{
          backgroundColor: selectedTag === null ? '#6C63FF' : '#3A3A5C',
          fontSize: '12px',
          padding: '6px 16px',
          borderRadius: '20px',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (selectedTag !== null) {
            e.currentTarget.style.backgroundColor = '#4A4A6C';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedTag !== null) {
            e.currentTarget.style.backgroundColor = '#3A3A5C';
          }
        }}
      >
        全部
      </button>
      {AVAILABLE_TAGS.map((tag) => (
        <button
          key={tag}
          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
          className="px-4 py-1.5 rounded-full text-white text-sm transition-all"
          style={{
            backgroundColor: selectedTag === tag ? '#6C63FF' : '#3A3A5C',
            fontSize: '12px',
            padding: '6px 16px',
            borderRadius: '20px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (selectedTag !== tag) {
              e.currentTarget.style.backgroundColor = '#4A4A6C';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedTag !== tag) {
              e.currentTarget.style.backgroundColor = '#3A3A5C';
            }
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

const AudioList: React.FC = () => {
  const getFilteredAudioList = useAudioStore((state) => state.getFilteredAudioList);
  const playAudio = useAudioStore((state) => state.playAudio);
  const currentAudio = useAudioStore((state) => state.currentAudio);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const incrementPlayCount = useAudioStore((state) => state.incrementPlayCount);
  const updateTime = useAudioStore((state) => state.updateTime);
  const togglePlay = useAudioStore((state) => state.togglePlay);
  const setVolume = useAudioStore((state) => state.setVolume);
  const volume = useAudioStore((state) => state.volume);

  const audioList = getFilteredAudioList();

  const handlePlay = React.useCallback(
    (audio: AudioClip) => {
      const isSameAsCurrent = currentAudio?.id === audio.id;
      
      if (isSameAsCurrent) {
        if (isPlaying) {
          audioEngine.pauseAudio();
        } else {
          audioEngine.resumeAudio();
        }
        togglePlay();
      } else {
        if (audio.blobData) {
          const audioUrl = URL.createObjectURL(b64toBlob(audio.blobData.split(',')[1], 'audio/webm'));
          audioEngine.playAudio(audioUrl, (time) => {
            updateTime(time);
            if (time === 0) {
              togglePlay();
            }
          });
          audioEngine.setVolume(volume);
          playAudio(audio);
          incrementPlayCount(audio.id);
        } else {
          playAudio(audio);
          incrementPlayCount(audio.id);
        }
      }
      setVolume(volume);
    },
    [currentAudio, isPlaying, playAudio, togglePlay, incrementPlayCount, updateTime, volume, setVolume]
  );

  return (
    <div className="w-full">
      <div className="mb-5">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <SearchBar />
          </div>
        </div>
        <TagFilter />
      </div>

      <div
        className="columns-1 md:columns-2 gap-4"
        style={{ columnGap: '16px' }}
      >
        {audioList.map((audio, index) => (
          <AudioCard key={audio.id} audio={audio} index={index} onPlay={handlePlay} />
        ))}
      </div>

      {audioList.length === 0 && (
        <div className="text-center py-12" style={{ color: '#888' }}>
          <p className="text-lg mb-2">暂无匹配的音频</p>
          <p className="text-sm">试试其他搜索词或标签吧</p>
        </div>
      )}

      <style>{`
        @keyframes pulse-bar-0 {
          0% { height: 20px; }
          100% { height: 52px; }
        }
        @keyframes pulse-bar-1 {
          0% { height: 44px; }
          100% { height: 22px; }
        }
        @keyframes pulse-bar-2 {
          0% { height: 28px; }
          100% { height: 58px; }
        }
        @keyframes pulse-bar-3 {
          0% { height: 56px; }
          100% { height: 30px; }
        }
        @keyframes pulse-bar-4 {
          0% { height: 18px; }
          100% { height: 46px; }
        }
        @keyframes pulse-bar-5 {
          0% { height: 48px; }
          100% { height: 20px; }
        }
        @keyframes pulse-bar-6 {
          0% { height: 34px; }
          100% { height: 60px; }
        }
        @keyframes pulse-bar-7 {
          0% { height: 60px; }
          100% { height: 26px; }
        }
        @keyframes pulse-bar-8 {
          0% { height: 22px; }
          100% { height: 50px; }
        }
        @keyframes pulse-bar-9 {
          0% { height: 50px; }
          100% { height: 24px; }
        }

        @keyframes breathe-0 {
          0%, 100% {
            opacity: 0.85;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.08);
          }
        }
        @keyframes breathe-1 {
          0%, 100% {
            opacity: 0.9;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.06);
          }
        }
        @keyframes breathe-2 {
          0%, 100% {
            opacity: 0.82;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.1);
          }
        }
        @keyframes breathe-3 {
          0%, 100% {
            opacity: 0.88;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.05);
          }
        }
        @keyframes breathe-4 {
          0%, 100% {
            opacity: 0.83;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.09);
          }
        }
        @keyframes breathe-5 {
          0%, 100% {
            opacity: 0.87;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.07);
          }
        }
        @keyframes breathe-6 {
          0%, 100% {
            opacity: 0.84;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.08);
          }
        }
        @keyframes breathe-7 {
          0%, 100% {
            opacity: 0.89;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.04);
          }
        }
        @keyframes breathe-8 {
          0%, 100% {
            opacity: 0.86;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.06);
          }
        }
        @keyframes breathe-9 {
          0%, 100% {
            opacity: 0.81;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.09);
          }
        }
      `}</style>
    </div>
  );
};

function b64toBlob(b64Data: string, contentType: string): Blob {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: contentType });
}

export default AudioList;
