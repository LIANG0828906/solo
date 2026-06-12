let tickInterval: number | null = null;
let tickCount = 0;
const TICK_MS = 100;

self.onmessage = (event: MessageEvent) => {
  const { type } = event.data;

  switch (type) {
    case 'START':
      if (tickInterval !== null) return;
      tickCount = 0;
      tickInterval = self.setInterval(() => {
        tickCount++;
        self.postMessage({
          type: 'TICK',
          payload: {
            deltaSeconds: TICK_MS / 1000,
            tick: tickCount,
          },
        });
      }, TICK_MS) as unknown as number;
      break;

    case 'STOP':
      if (tickInterval !== null) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
      break;

    case 'PING':
      self.postMessage({ type: 'PONG', payload: { tick: tickCount } });
      break;
  }
};

export {};
