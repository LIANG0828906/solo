import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import LickCard from './LickCard';
import { requestMicrophone, startRecording, extractWaveform, generateDemoWaveform, type RecordingResult } from '@/utils/audio';
import type { InstrumentType } from '@/types';
import { instrumentLabels } from '@/utils/colors';

const instruments: InstrumentType[] = ['vocal', 'guitar', 'keyboard', 'drums', 'bass'];

export default function LickPanel() {
  const licks = useAppStore((s) => s.licks);
  const addLick = useAppStore((s) => s.addLick);
  const selectLick = useAppStore((s) => s.selectLick);

  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [instrument, setInstrument] = useState<InstrumentType>('guitar');
  const [error, setError] = useState<string | null>(null);
  const stopFnRef = useRef<(() => void) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (stopFnRef.current) stopFnRef.current();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleToggleRecord = async () => {
    if (isRecording) {
      if (stopFnRef.current) {
        stopFnRef.current();
        stopFnRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    setError(null);
    try {
      const stream = await requestMicrophone();
      streamRef.current = stream;
      setIsRecording(true);
      setRecordTime(0);

      const stop = startRecording(
        stream,
        async (result: RecordingResult) => {
          setIsRecording(false);
          let waveform: number[];
          try {
            waveform = await extractWaveform(result.blob);
          } catch {
            waveform = generateDemoWaveform();
          }
          addLick({
            name: `乐句 ${licks.length + 1}`,
            audioBlob: result.blob,
            audioUrl: result.url,
            waveformData: waveform,
            duration: result.duration,
            instrument,
            key: 'C',
            bpm: 120,
            tags: [],
          });
        },
        (t) => setRecordTime(t),
        60,
      );
      stopFnRef.current = stop;
    } catch (e) {
      setError('无法访问麦克风，请检查权限设置');
      setIsRecording(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#121212',
        borderRight: '1px solid #424242',
      }}
    >
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid #424242',
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: '#64B5F6',
            letterSpacing: 1,
            marginBottom: 12,
            textTransform: 'uppercase',
          }}
        >
          ♪ 灵感乐句
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {instruments.map((ins) => (
            <button
              key={ins}
              onClick={() => setInstrument(ins)}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                backgroundColor: instrument === ins ? '#64B5F6' : '#2A2A2A',
                color: instrument === ins ? '#121212' : '#B0B0B0',
                fontWeight: instrument === ins ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              {instrumentLabels[ins]}
            </button>
          ))}
        </div>

        <motion.button
          onClick={handleToggleRecord}
          whileTap={{ scale: 0.96 }}
          animate={isRecording ? {
            boxShadow: [
              '0 0 0 0 rgba(239, 83, 80, 0.7)',
              '0 0 0 12px rgba(239, 83, 80, 0)',
            ],
          } : {}}
          transition={isRecording ? { repeat: Infinity, duration: 1.2 } : {}}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            backgroundColor: isRecording ? '#EF5350' : '#64B5F6',
            color: '#121212',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: isRecording ? 2 : '50%',
              backgroundColor: '#121212',
              transition: 'border-radius 0.2s ease',
            }}
          />
          {isRecording ? `停止  ${recordTime.toFixed(1)}s / 60s` : '● 录制乐句'}
        </motion.button>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: 8,
                padding: '6px 10px',
                backgroundColor: '#EF535022',
                color: '#EF5350',
                fontSize: 11,
                borderRadius: 4,
                border: '1px solid #EF535044',
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {licks.length === 0 ? (
          <div
            style={{
              color: '#757575',
              fontSize: 12,
              textAlign: 'center',
              padding: 40,
            }}
          >
            还没有乐句，点击上方按钮开始录制
          </div>
        ) : (
          licks.map((lick) => <LickCard key={lick.id} lick={lick} />)
        )}
      </div>
    </div>
  );
}
