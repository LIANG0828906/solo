import React from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { Volume2, VolumeX, Mic, Square } from 'lucide-react';

interface MixerControlsProps {
  isRecording: boolean;
  recordingTime: number;
  onToggleRecording: () => void;
}

const MixerControls: React.FC<MixerControlsProps> = ({
  isRecording,
  recordingTime,
  onToggleRecording,
}) => {
  const { tracks, masterVolume, setMasterVolume, setTrackVolume, setTrackPan, toggleTrack } =
    useAudioStore();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mixer-controls">
      <div className="mixer-header">
        <h3>混音控制台</h3>
        <div className="recording-section">
          <span className={`recording-time ${isRecording ? 'active' : ''}`}>
            {isRecording && <span className="recording-dot" />}
            {formatTime(recordingTime)}
          </span>
          <button
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            onClick={onToggleRecording}
          >
            {isRecording ? <Square className="btn-icon" /> : <Mic className="btn-icon" />}
            <span>{isRecording ? '停止录制' : '开始录制'}</span>
          </button>
        </div>
      </div>

      <div className="mixer-tracks">
        {tracks.map((track) => (
          <div key={track.id} className={`mixer-track ${track.enabled ? 'enabled' : ''}`}>
            <div className="track-header">
              <span className="track-name">{track.name}</span>
              <button
                className="mute-btn"
                onClick={() => toggleTrack(track.id)}
                title={track.enabled ? '静音' : '取消静音'}
              >
                {track.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
            <div className="track-controls">
              <div className="volume-slider">
                <label>音量</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={track.volume}
                  onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
                  disabled={!track.enabled}
                />
                <span className="value">{Math.round(track.volume * 100)}%</span>
              </div>
              <div className="pan-slider">
                <label>声像</label>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={track.pan}
                  onChange={(e) => setTrackPan(track.id, parseFloat(e.target.value))}
                  disabled={!track.enabled}
                />
                <span className="value">
                  {track.pan === 0
                    ? 'C'
                    : track.pan < 0
                      ? `L${Math.abs(Math.round(track.pan * 100))}`
                      : `R${Math.round(track.pan * 100)}`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="master-section">
        <div className="master-volume">
          <Volume2 className="master-icon" />
          <span className="master-label">主音量</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          />
          <span className="master-value">{Math.round(masterVolume * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default MixerControls;
