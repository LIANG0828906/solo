import React, { useState } from 'react';
import { Mic, Waves } from 'lucide-react';
import AudioList from '@/components/AudioList';
import Uploader from '@/components/Uploader';
import Player from '@/components/Player';
import { useAudioStore } from '@/stores/audioStore';

const App: React.FC = () => {
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const currentAudio = useAudioStore((state) => state.currentAudio);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#121220',
        padding: '16px',
        paddingBottom: currentAudio ? '200px' : '16px',
      }}
    >
      <div
        className="max-w-5xl mx-auto"
        style={{ paddingBottom: '100px' }}
      >
        <header className="mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#6C63FF' }}
            >
              <Waves className="w-5 h-5 text-white" />
            </div>
            <h1
              className="text-2xl font-bold text-white"
              style={{
                fontFamily: "'Playfair Display', serif",
                letterSpacing: '0.5px',
              }}
            >
              SoundScape
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#888' }}>
            发现、录制并分享来自世界各地的环境声音
          </p>
        </header>

        <main>
          <AudioList />
        </main>

        <button
          onClick={() => setIsUploaderOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all z-30"
          style={{
            backgroundColor: '#6C63FF',
            boxShadow: '0 4px 20px rgba(108, 99, 255, 0.4)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(108, 99, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(108, 99, 255, 0.4)';
          }}
        >
          <Mic className="w-6 h-6 text-white" />
        </button>

        <Uploader isOpen={isUploaderOpen} onClose={() => setIsUploaderOpen(false)} />
        <Player />
      </div>
    </div>
  );
};

export default App;
