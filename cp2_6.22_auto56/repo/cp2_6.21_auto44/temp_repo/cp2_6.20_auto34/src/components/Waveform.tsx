import React, { useMemo } from 'react';
import { Stage, Graphics } from '@pixi/react';

interface WaveformProps {
  audioBuffer: AudioBuffer | null;
  width: number;
  height: number;
  bpm?: number;
  currentTime?: number;
  onDrop?: (effectType: string) => void;
  isDragOver?: boolean;
}

const Waveform: React.FC<WaveformProps> = ({
  audioBuffer,
  width,
  height,
  bpm = 120,
  currentTime = 0,
  onDrop,
  isDragOver = false,
}) => {
  const frequencyData = useMemo(() => {
    if (!audioBuffer) return [];

    const rawData = audioBuffer.getChannelData(0);
    const samples = 512;
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData: { value: number; freq: 'low' | 'mid' | 'high' }[] = [];

    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j]);
      }
      const avg = sum / blockSize;
      const position = i / samples;
      let freq: 'low' | 'mid' | 'high';
      if (position < 0.33) freq = 'low';
      else if (position < 0.66) freq = 'mid';
      else freq = 'high';
      filteredData.push({ value: avg, freq });
    }

    return filteredData;
  }, [audioBuffer]);

  const beatLines = useMemo(() => {
    if (!audioBuffer || bpm <= 0) return [];

    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.length / sampleRate;
    const beatDuration = 60 / bpm;
    const lines: number[] = [];

    for (let t = 0; t < duration; t += beatDuration) {
      lines.push((t / duration) * width);
    }

    return lines;
  }, [audioBuffer, bpm, width]);

  const getFrequencyColor = (freq: 'low' | 'mid' | 'high', alpha: number) => {
    switch (freq) {
      case 'low':
        return [59, 130, 246, alpha];
      case 'mid':
        return [34, 197, 94, alpha];
      case 'high':
        return [239, 68, 68, alpha];
    }
  };

  const playheadX = audioBuffer
    ? (currentTime / (audioBuffer.length / audioBuffer.sampleRate)) * width
    : 0;

  const maxValue = Math.max(...frequencyData.map((d) => d.value), 0.001);

  const drawWaveform = (g: any) => {
    g.clear();

    g.beginFill(0x16213e);
    g.drawRect(0, 0, width, height);
    g.endFill();

    beatLines.forEach((x) => {
      g.lineStyle(1, 0x4a5568, 0.5);
      g.moveTo(x, 0);
      g.lineTo(x, height);
    });

    const barWidth = width / frequencyData.length;
    const centerY = height / 2;

    frequencyData.forEach((data, index) => {
      const x = index * barWidth;
      const normalizedValue = data.value / maxValue;
      const barHeight = normalizedValue * (height * 0.8);

      const [r, g_, b_, a] = getFrequencyColor(data.freq, 0.7);
      g.beginFill((r << 16) | (g_ << 8) | b_, a);

      const y1 = centerY - barHeight / 2;
      const y2 = centerY + barHeight / 2;

      g.drawRoundedRect(x + 1, y1, barWidth - 2, barHeight, 1);
      g.endFill();

      const [r2, g2, b2, a2] = getFrequencyColor(data.freq, 0.4);
      g.beginFill((r2 << 16) | (g2 << 8) | b2, a2);
      g.drawRoundedRect(x + 1, y1, barWidth - 2, (y2 - y1) * 0.3, 1);
      g.endFill();
    });

    if (playheadX > 0 && playheadX < width) {
      g.lineStyle(2, 0x63b3ed, 1);
      g.moveTo(playheadX, 0);
      g.lineTo(playheadX, height);

      g.beginFill(0x63b3ed, 0.3);
      g.drawRect(0, 0, playheadX, height);
      g.endFill();
    }
  };

  const drawDragOverlay = (g: any) => {
    if (!isDragOver) return;
    g.clear();
    g.beginFill(0x63b3ed, 0.1);
    g.drawRect(0, 0, width, height);
    g.endFill();
    g.lineStyle(2, 0x63b3ed, 0.8);
    g.drawRect(2, 2, width - 4, height - 4);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const effectType = e.dataTransfer.getData('effectType');
    if (effectType && onDrop) {
      onDrop(effectType);
    }
  };

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{ width, height }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Stage
        width={width}
        height={height}
        options={{ antialias: true, backgroundColor: 0x16213e }}
      >
        <Graphics draw={drawWaveform} />
        {isDragOver && <Graphics draw={drawDragOverlay} />}
      </Stage>
      {!audioBuffer && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm bg-[#16213e]">
          拖放音频文件到此处
        </div>
      )}
    </div>
  );
};

export default Waveform;
