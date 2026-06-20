import { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { Play } from 'lucide-react';
import { usePuzzleStore } from '../store/puzzleStore';

interface AudioPlayerProps {
  autoPlayPath?: string | null;
  onAutoPlayComplete?: () => void;
}

export function AudioPlayer({ autoPlayPath, onAutoPlayComplete }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentDecade = usePuzzleStore((s) => s.currentDecade);
  const audioRef = useRef<Howl | null>(null);
  const playedAutoRef = useRef<string | null>(null);

  const audioPaths: Record<string, string> = {
    '1980s': '/audio/1980s.mp3',
    '1990s': '/audio/1990s.mp3',
    '2000s': '/audio/2000s.mp3',
  };

  const currentPath = audioPaths[currentDecade];

  useEffect(() => {
    if (autoPlayPath && autoPlayPath !== playedAutoRef.current) {
      playedAutoRef.current = autoPlayPath;
      playSound(autoPlayPath, true);
    }
  }, [autoPlayPath]);

  const playSound = (path: string, auto = false) => {
    if (audioRef.current) {
      audioRef.current.stop();
    }

    audioRef.current = new Howl({
      src: [path],
      volume: 0,
      html5: true,
      onplay: () => {
        setIsPlaying(true);
        if (audioRef.current) {
          audioRef.current.fade(0, 0.8, 500);
        }
      },
      onend: () => {
        setIsPlaying(false);
        if (auto && onAutoPlayComplete) {
          onAutoPlayComplete();
        }
      },
      onstop: () => {
        setIsPlaying(false);
      },
    });

    audioRef.current.play();

    if (auto) {
      setTimeout(() => {
        if (audioRef.current && audioRef.current.playing()) {
          audioRef.current.fade(0.8, 0, 500);
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.stop();
              if (onAutoPlayComplete) {
                onAutoPlayComplete();
              }
            }
          }, 500);
        }
      }, 2500);
    }
  };

  const handleClick = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.fade(0.8, 0, 300);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.stop();
        }
      }, 300);
    } else {
      playSound(currentPath);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-12 h-12 rounded-full bg-[#3D3D5C] flex items-center justify-center text-white hover:bg-[#4D4D6C] transition-all duration-300"
      style={{
        animation: isPlaying ? 'spin 2s linear infinite' : 'none',
      }}
      aria-label="播放城市声音"
    >
      <Play size={20} fill="currentColor" />
    </button>
  );
}
