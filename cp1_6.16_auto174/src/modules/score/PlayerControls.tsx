import { useEffect, useRef, useCallback } from 'react';
import { Slider } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, SoundOutlined } from '@ant-design/icons';
import * as Tone from 'tone';
import { useScoreStore, Note, durationToBeats } from '../../store/scoreStore';

const DURATION_MAP: Record<string, number> = {
  'w': 4, 'h': 2, 'q': 1, '8': 0.5, '16': 0.25
};

function PlayerControls() {
  const store = useScoreStore();
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const metronomeSynthRef = useRef<Tone.MembraneSynth | null>(null);
  const transportRef = useRef<ReturnType<typeof Tone.getTransport> | null>(null);
  const scheduledEventsRef = useRef<number[]>([]);
  const metronomeEventsRef = useRef<number[]>([]);
  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    }).toDestination();

    metronomeSynthRef.current = new Tone.MembraneSynth().toDestination();

    transportRef.current = Tone.Transport;

    return () => {
      clearProgressInterval();
      Tone.Transport.stop();
      Tone.Transport.cancel();
      synthRef.current?.dispose();
      metronomeSynthRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = store.volume;
    }
  }, [store.volume]);

  useEffect(() => {
    if (metronomeSynthRef.current) {
      metronomeSynthRef.current.volume.value = store.metronomeVolume;
    }
  }, [store.metronomeVolume]);

  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const pitchToNote = (pitch: string): string => {
    const m = pitch.match(/^([A-G])(#|b)?(\d)$/);
    if (!m) return 'C4';
    const base = m[1];
    const acc = m[2] === '#' ? '#' : m[2] === 'b' ? 'b' : '';
    const oct = m[3];
    return `${base}${acc}${oct}`;
  };

  const scheduleNotes = useCallback(() => {
    if (!transportRef.current || !synthRef.current) return;

    transportRef.current.cancel();
    scheduledEventsRef.current = [];
    metronomeEventsRef.current = [];

    store.project.voices.forEach(voiceData => {
      voiceData.notes.forEach(note => {
        const startTime = getNoteStartTime(note);
        const duration = DURATION_MAP[note.duration] * (60 / store.project.tempo);
        const noteName = pitchToNote(note.pitch);

        const eventId = transportRef.current!.schedule((time) => {
          synthRef.current!.triggerAttackRelease(noteName, duration, time);
          Tone.Draw.schedule(() => {
            store.highlightNote(note.id, true);
            setTimeout(() => {
              store.highlightNote(note.id, false);
            }, duration * 1000);
          }, time);
        }, startTime);

        scheduledEventsRef.current.push(eventId);
      });
    });

    if (store.metronomeEnabled) {
      scheduleMetronome();
    }
  }, [store.project, store.metronomeEnabled]);

  const scheduleMetronome = () => {
    if (!transportRef.current || !metronomeSynthRef.current) return;

    const beatsPerMeasure = parseInt(store.project.timeSignature.split('/')[0]);
    const totalBeats = beatsPerMeasure * store.project.totalMeasures;
    const beatDuration = 60 / store.project.tempo;

    for (let beat = 0; beat < totalBeats; beat++) {
      const time = beat * beatDuration;
      const isDownbeat = beat % beatsPerMeasure === 0;

      const eventId = transportRef.current!.schedule((t) => {
        metronomeSynthRef.current!.triggerAttackRelease(
          isDownbeat ? 'C2' : 'G1',
          '8n',
          t
        );
        Tone.Draw.schedule(() => {
          store.setMetronomeBeat((beat % beatsPerMeasure) + 1);
          setTimeout(() => store.setMetronomeBeat(0), 150);
        }, t);
      }, time);

      metronomeEventsRef.current.push(eventId);
    }
  };

  const getNoteStartTime = (note: Note): number => {
    const beatsPerMeasure = parseInt(store.project.timeSignature.split('/')[0]);
    const beatsBefore = note.measure * beatsPerMeasure + note.position;
    return beatsBefore * (60 / store.project.tempo);
  };

  const handlePlay = async () => {
    if (!synthRef.current) return;

    await Tone.start();

    if (store.playState === 'stopped') {
      scheduleNotes();
    }

    Tone.Transport.start();
    store.setPlayState('playing');

    const totalDur = store.getTotalDuration();
    const startTs = performance.now();
    const startPos = store.currentTime;

    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = (performance.now() - startTs) / 1000;
      const current = Math.min(totalDur, startPos + elapsed);
      store.setCurrentTime(current);

      if (current >= totalDur - 0.05) {
        handleStop();
      }
    }, 50);
  };

  const handlePause = () => {
    Tone.Transport.pause();
    store.setPlayState('paused');
    clearProgressInterval();
  };

  const handleStop = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    store.setPlayState('stopped');
    store.setCurrentTime(0);
    store.setMetronomeBeat(0);
    clearProgressInterval();

    store.project.voices.forEach(v => {
      v.notes.forEach(n => store.highlightNote(n.id, false));
    });
  };

  const handleProgressChange = async (value: number) => {
    if (!transportRef.current) return;
    store.setCurrentTime(value as number);
    if (store.playState === 'playing') {
      Tone.Transport.seconds = value;
    } else if (store.playState === 'paused') {
      Tone.Transport.seconds = value;
    }
  };

  const totalDuration = store.getTotalDuration();
  const progressPercent = totalDuration > 0 ? (store.currentTime / totalDuration) * 100 : 0;

  return (
    <div className="player-controls-bar">
      {store.playState === 'playing' ? (
        <button className="control-btn" onClick={handlePause} title="暂停">
          <PauseCircleOutlined />
        </button>
      ) : (
        <button className="control-btn" onClick={handlePlay} title="播放">
          <PlayCircleOutlined />
        </button>
      )}

      <button className="control-btn" onClick={handleStop} title="停止">
        <StopOutlined />
      </button>

      <Slider
        className="progress-slider"
        min={0}
        max={totalDuration || 1}
        step={0.01}
        value={store.currentTime}
        onChange={handleProgressChange}
        tooltip={{ formatter: (v) => v?.toFixed(2) + 's' }}
      />

      <SoundOutlined className="volume-icon" />
      <Slider
        className="volume-slider"
        min={-20}
        max={0}
        value={store.volume}
        onChange={(v) => store.setVolume(v as number)}
        tooltip={{ formatter: (v) => v + ' dB' }}
      />

      <span style={{ color: '#ccc', fontSize: 12, minWidth: 50 }}>
        {formatTime(store.currentTime)} / {formatTime(totalDuration)}
      </span>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default PlayerControls;
