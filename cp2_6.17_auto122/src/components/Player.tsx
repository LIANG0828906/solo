import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Heart, MessageCircle, Volume2, VolumeX, Send, X } from 'lucide-react';
import { useAudioStore, Comment } from '@/stores/audioStore';
import { audioEngine } from '@/utils/audioEngine';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatCommentTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${Math.floor(diff / 86400000)}天前`;
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

const Player: React.FC = () => {
  const currentAudio = useAudioStore((state) => state.currentAudio);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const currentTime = useAudioStore((state) => state.currentTime);
  const volume = useAudioStore((state) => state.volume);
  const showComments = useAudioStore((state) => state.showComments);
  const togglePlay = useAudioStore((state) => state.togglePlay);
  const updateTime = useAudioStore((state) => state.updateTime);
  const setVolume = useAudioStore((state) => state.setVolume);
  const likeAudio = useAudioStore((state) => state.likeAudio);
  const addComment = useAudioStore((state) => state.addComment);
  const setShowComments = useAudioStore((state) => state.setShowComments);
  const stopPlayback = useAudioStore((state) => state.stopPlayback);

  const [commentText, setCommentText] = useState('');
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  const prevAudioId = useRef<string | null>(null);

  useEffect(() => {
    if (currentAudio && currentAudio.id !== prevAudioId.current) {
      if (currentAudio.blobData) {
        const audioUrl = URL.createObjectURL(
          b64toBlob(currentAudio.blobData.split(',')[1], 'audio/webm')
        );
        audioEngine.playAudio(audioUrl, (time) => {
          updateTime(time);
          if (time === 0) {
            togglePlay();
          }
        });
        audioEngine.setVolume(isMuted ? 0 : volume);
      }
      prevAudioId.current = currentAudio.id;
    }
  }, [currentAudio, updateTime, togglePlay, volume, isMuted]);

  useEffect(() => {
    audioEngine.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  useEffect(() => {
    if (!isPlaying && currentAudio) {
      audioEngine.pauseAudio();
    } else if (isPlaying && currentAudio) {
      audioEngine.resumeAudio();
    }
  }, [isPlaying, currentAudio]);

  useEffect(() => {
    if (showComments && commentsContainerRef.current) {
      commentsContainerRef.current.scrollTop = 0;
    }
  }, [showComments]);

  const handlePlayToggle = useCallback(() => {
    if (!currentAudio) return;
    togglePlay();
  }, [currentAudio, togglePlay]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !currentAudio) return;

      const rect = progressRef.current.getBoundingClientRect();
      const percentage = (e.clientX - rect.left) / rect.width;
      const newTime = percentage * currentAudio.duration;

      audioEngine.seekTo(newTime);
      updateTime(newTime);
    },
    [currentAudio, updateTime]
  );

  const handleProgressMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleProgressMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !progressRef.current || !currentAudio) return;

      const rect = progressRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = percentage * currentAudio.duration;

      audioEngine.seekTo(newTime);
      updateTime(newTime);
    },
    [isDragging, currentAudio, updateTime]
  );

  const handleProgressMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleProgressMouseMove);
      window.addEventListener('mouseup', handleProgressMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleProgressMouseMove);
        window.removeEventListener('mouseup', handleProgressMouseUp);
      };
    }
  }, [isDragging, handleProgressMouseMove, handleProgressMouseUp]);

  const handleLike = useCallback(() => {
    if (!currentAudio) return;
    setIsLikeAnimating(true);
    likeAudio(currentAudio.id);
    setTimeout(() => setIsLikeAnimating(false), 150);
  }, [currentAudio, likeAudio]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      if (newVolume > 0) setIsMuted(false);
    },
    [setVolume]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleSubmitComment = useCallback(() => {
    if (!currentAudio || !commentText.trim()) return;
    addComment(currentAudio.id, commentText.trim());
    setCommentText('');
  }, [currentAudio, commentText, addComment]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitComment();
      }
    },
    [handleSubmitComment]
  );

  const handleClose = useCallback(() => {
    audioEngine.stopAudio();
    stopPlayback();
    prevAudioId.current = null;
  }, [stopPlayback]);

  const progressPercentage = currentAudio
    ? (currentTime / currentAudio.duration) * 100
    : 0;

  if (!currentAudio) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      {showComments && (
        <div
          ref={commentsContainerRef}
          className="w-full mx-auto overflow-y-auto px-4"
          style={{
            maxWidth: '1200px',
            backgroundColor: '#1A1A2E',
            borderRadius: '12px 12px 0 0',
            padding: '12px',
            maxHeight: '300px',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white text-sm font-medium">评论 ({currentAudio.comments.length})</h4>
            <button
              onClick={() => setShowComments(false)}
              className="p-1 rounded transition-colors"
              style={{ color: '#888' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#888';
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {currentAudio.comments.length === 0 ? (
              <p className="text-center py-4 text-sm" style={{ color: '#888' }}>
                暂无评论，来说点什么吧
              </p>
            ) : (
              currentAudio.comments.map((comment: Comment) => (
                <div key={comment.id} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-xs font-medium" style={{ fontSize: '12px' }}>
                      {comment.nickname}
                    </span>
                    <span className="text-xs" style={{ color: '#888', fontSize: '10px' }}>
                      {formatCommentTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#888', fontSize: '14px' }}>
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="写下你的评论...（最多100字）"
              maxLength={100}
              className="flex-1 px-3 py-2 rounded-lg text-white placeholder-gray-500 outline-none transition-all"
              style={{
                backgroundColor: '#2A2A3D',
                fontSize: '12px',
                border: '1px solid #3A3A5C',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6C63FF';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#3A3A5C';
              }}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className="px-3 py-2 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#6C63FF',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#5A52D5';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#6C63FF';
                }
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div
        className="w-full mx-auto px-4 flex items-center gap-4 player-container"
        style={{
          maxWidth: '1200px',
          backgroundColor: 'rgba(42, 42, 61, 0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px 16px 0 0',
          height: '80px',
        }}
      >
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <h4
              className="text-white font-medium truncate flex-1 min-w-0"
              style={{ fontSize: '14px' }}
            >
              {currentAudio.title}
            </h4>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <span style={{ color: '#888', fontSize: '12px' }}>{formatTime(currentTime)}</span>
            <div
              ref={progressRef}
              className="relative cursor-pointer flex-shrink-0"
              style={{
                width: '60%',
                minWidth: '200px',
                height: '6px',
                backgroundColor: '#3A3A5C',
                borderRadius: '3px',
              }}
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: '#6C63FF',
                  borderRadius: '3px',
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                style={{
                  left: `calc(${progressPercentage}% - 6px)`,
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </div>
            <span style={{ color: '#888', fontSize: '12px' }}>
              {formatTime(currentAudio.duration)}
            </span>
          </div>
        </div>

        <div className="md:hidden w-full flex items-center gap-2 mb-1">
          <span style={{ color: '#888', fontSize: '12px' }}>{formatTime(currentTime)}</span>
          <div
            ref={progressRef}
            className="relative cursor-pointer flex-1"
            style={{
              height: '6px',
              backgroundColor: '#3A3A5C',
              borderRadius: '3px',
            }}
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: '#6C63FF',
                borderRadius: '3px',
              }}
            />
          </div>
          <span style={{ color: '#888', fontSize: '12px' }}>
            {formatTime(currentAudio.duration)}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <button
            onClick={handlePlayToggle}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            style={{
              backgroundColor: '#6C63FF',
              transition: 'all 0.2s ease',
              width: '40px',
              height: '40px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5A52D5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6C63FF';
            }}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="hidden md:flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: '#888' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#888';
            }}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="hidden md:block w-24 accent-purple-500 flex-shrink-0"
            style={{
              width: '120px',
              accentColor: '#6C63FF',
            }}
          />

          <button
            onClick={handleLike}
            className="flex items-center justify-center transition-all flex-shrink-0"
            style={{
              color: currentAudio.isLiked ? '#FF6B6B' : '#888',
              transform: isLikeAnimating ? 'scale(0.8)' : 'scale(1)',
              transition: 'transform 0.15s ease, color 0.2s ease',
            }}
          >
            <Heart
              className={`w-5 h-5 ${currentAudio.isLiked ? 'fill-current' : ''}`}
            />
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: showComments ? '#6C63FF' : '#888' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = showComments ? '#6C63FF' : 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = showComments ? '#6C63FF' : '#888';
            }}
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          <button
            onClick={handleClose}
            className="hidden md:flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: '#888' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FF6B6B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#888';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          .player-container {
            height: 100px !important;
          }
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        
        input[type="range"]::-webkit-slider-track {
          background: #3A3A5C;
          height: 4px;
          border-radius: 2px;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #6C63FF;
          margin-top: -4px;
          transition: transform 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        input[type="range"]::-moz-range-track {
          background: #3A3A5C;
          height: 4px;
          border-radius: 2px;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #6C63FF;
          border: none;
          transition: transform 0.2s ease;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default Player;
