export interface AudioData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  sampleRate: number;
}

export interface AudioProcessorResult {
  audioElement: HTMLAudioElement;
  audioContext: AudioContext;
  analyser: AnalyserNode;
  source: MediaElementAudioSourceNode;
  getAudioData: () => AudioData;
  getFrequencyBands: () => FrequencyBands;
  getChannelTimeDomainData: () => ChannelTimeDomainData;
  destroy: () => void;
}

export interface FrequencyBands {
  low: number;
  mid: number;
  high: number;
  lowAvg: number;
  midAvg: number;
  highAvg: number;
}

export interface ChannelTimeDomainData {
  left: Float32Array;
  right: Float32Array;
  mixed: Float32Array;
}

const FFT_SIZE = 2048;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function loadAudioFile(file: File): Promise<AudioProcessorResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 50MB limit');
  }

  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/wave'];
  if (!validTypes.some(t => file.type.startsWith(t.split('/')[0])) && !file.name.match(/\.(mp3|wav)$/i)) {
    throw new Error('Only MP3 and WAV files are supported');
  }

  const audioContext = new AudioContext({ sampleRate: 44100 });
  const audioElement = new Audio();
  audioElement.crossOrigin = 'anonymous';

  const url = URL.createObjectURL(file);
  audioElement.src = url;

  await new Promise<void>((resolve, reject) => {
    audioElement.addEventListener('canplaythrough', () => resolve(), { once: true });
    audioElement.addEventListener('error', () => reject(new Error('Failed to load audio file')), { once: true });
    audioElement.load();
  });

  const source = audioContext.createMediaElementSource(audioElement);

  const splitter = audioContext.createChannelSplitter(2);
  const merger = audioContext.createChannelMerger(2);

  const analyserMain = audioContext.createAnalyser();
  analyserMain.fftSize = FFT_SIZE;
  analyserMain.smoothingTimeConstant = 0.8;

  const analyserLeft = audioContext.createAnalyser();
  analyserLeft.fftSize = FFT_SIZE;
  analyserLeft.smoothingTimeConstant = 0.8;

  const analyserRight = audioContext.createAnalyser();
  analyserRight.fftSize = FFT_SIZE;
  analyserRight.smoothingTimeConstant = 0.8;

  source.connect(splitter);
  source.connect(analyserMain);
  analyserMain.connect(audioContext.destination);

  splitter.connect(analyserLeft, 0);
  splitter.connect(analyserRight, 1);

  const frequencyData = new Uint8Array(analyserMain.frequencyBinCount);
  const timeDomainData = new Uint8Array(analyserMain.frequencyBinCount);

  const leftTimeDomain = new Float32Array(analyserLeft.frequencyBinCount);
  const rightTimeDomain = new Float32Array(analyserRight.frequencyBinCount);
  const mixedTimeDomain = new Float32Array(analyserMain.frequencyBinCount);

  const getAudioData = (): AudioData => {
    analyserMain.getByteFrequencyData(frequencyData);
    analyserMain.getByteTimeDomainData(timeDomainData);
    return {
      frequencyData,
      timeDomainData,
      sampleRate: audioContext.sampleRate,
    };
  };

  const getFrequencyBands = (): FrequencyBands => {
    analyserMain.getByteFrequencyData(frequencyData);
    const binCount = frequencyData.length;
    const nyquist = audioContext.sampleRate / 2;
    const binWidth = nyquist / binCount;

    const lowStart = Math.floor(20 / binWidth);
    const lowEnd = Math.floor(250 / binWidth);
    const midEnd = Math.floor(2000 / binWidth);
    const highEnd = Math.min(Math.floor(20000 / binWidth), binCount - 1);

    let lowSum = 0, midSum = 0, highSum = 0;
    let lowCount = 0, midCount = 0, highCount = 0;

    for (let i = lowStart; i <= lowEnd; i++) {
      lowSum += frequencyData[i];
      lowCount++;
    }
    for (let i = lowEnd + 1; i <= midEnd; i++) {
      midSum += frequencyData[i];
      midCount++;
    }
    for (let i = midEnd + 1; i <= highEnd; i++) {
      highSum += frequencyData[i];
      highCount++;
    }

    return {
      low: lowCount > 0 ? lowSum / lowCount / 255 : 0,
      mid: midCount > 0 ? midSum / midCount / 255 : 0,
      high: highCount > 0 ? highSum / highCount / 255 : 0,
      lowAvg: lowCount > 0 ? lowSum / lowCount : 0,
      midAvg: midCount > 0 ? midSum / midCount : 0,
      highAvg: highCount > 0 ? highSum / highCount : 0,
    };
  };

  const getChannelTimeDomainData = (): ChannelTimeDomainData => {
    analyserLeft.getFloatTimeDomainData(leftTimeDomain);
    analyserRight.getFloatTimeDomainData(rightTimeDomain);
    analyserMain.getFloatTimeDomainData(mixedTimeDomain);
    return {
      left: leftTimeDomain,
      right: rightTimeDomain,
      mixed: mixedTimeDomain,
    };
  };

  const destroy = () => {
    source.disconnect();
    audioContext.close();
    audioElement.pause();
    URL.revokeObjectURL(url);
  };

  return {
    audioElement,
    audioContext,
    analyser: analyserMain,
    source,
    getAudioData,
    getFrequencyBands,
    getChannelTimeDomainData,
    destroy,
  };
}
