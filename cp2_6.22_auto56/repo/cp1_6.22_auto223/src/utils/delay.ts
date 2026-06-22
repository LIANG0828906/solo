export const simulateDelay = (): Promise<void> => {
  const delay = Math.random() * 500 + 300;
  return new Promise(resolve => setTimeout(resolve, delay));
};
