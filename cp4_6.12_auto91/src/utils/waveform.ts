export async function generateWaveformData(file: File): Promise<number[]> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0);
  const samples = 40;
  const blockSize = Math.floor(channelData.length / samples);
  const waveformData: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    let sum = 0;

    for (let j = start; j < end; j++) {
      sum += channelData[j] * channelData[j];
    }

    const rms = Math.sqrt(sum / blockSize);
    waveformData.push(rms);
  }

  const max = Math.max(...waveformData);
  if (max > 0) {
    for (let i = 0; i < waveformData.length; i++) {
      waveformData[i] = waveformData[i] / max;
    }
  }

  audioContext.close();
  return waveformData;
}
