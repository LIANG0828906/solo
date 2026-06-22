export const generateQRCodeData = (participantId: string, activityId: string): string => {
  const data = `READING-CLUB:${activityId}:${participantId}:${Date.now()}`;
  return btoa(data);
};

export const generateQRCodeSVG = (data: string, size: number = 200): string => {
  const modules = [];
  const gridSize = 21;
  const moduleSize = size / gridSize;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const idx = (i * gridSize + j) % data.length;
      const hash = data.charCodeAt(idx);
      const shouldFill = (data.charCodeAt(hash % data.length) + i + j) % 3 !== 0;
      const isCorner = 
        (i < 7 && j < 7) || 
        (i < 7 && j >= gridSize - 7) || 
        (i >= gridSize - 7 && j < 7);
      
      if (isCorner || shouldFill) {
        modules.push(
          `<rect x="${j * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${isCorner ? '#1E293B' : '#334155'}"/>`
        );
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="#FFFFFF"/>
      ${modules.join('')}
    </svg>
  `;
};
