const ctx: any = self as any;

let audioBuffer: AudioBuffer | null = null;

ctx.onmessage = async (e: MessageEvent) => {
  const { type, ...payload } = e.data;

  switch (type) {
    case 'decode': {
      try {
        const arrayBuffer: ArrayBuffer = payload.buffer;
        const offlineCtx = new OfflineAudioContext(1, 1, 44100);
        audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);

        const channelData = audioBuffer.getChannelData(0);
        const duration = audioBuffer.duration;
        const sampleRate = audioBuffer.sampleRate;

        ctx.postMessage(
          {
            type: 'decoded',
            channelData: channelData.buffer,
            duration,
            sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels,
          },
          [channelData.buffer]
        );
      } catch (err: any) {
        ctx.postMessage({ type: 'error', message: err.message });
      }
      break;
    }
  }
};
