export interface ShareData {
  centerLat: number;
  centerLng: number;
  zoom: number;
  markerIds: string[];
}

export const encodeShareLink = (data: ShareData): string => {
  const shortIds = data.markerIds.map(id => id.slice(0, 8)).join(',');
  const payload = `${data.centerLat.toFixed(6)}|${data.centerLng.toFixed(6)}|${data.zoom}|${shortIds}`;
  let result = '';
  for (let i = 0; i < payload.length; i++) {
    result += String.fromCharCode(payload.charCodeAt(i));
  }
  const encoded = btoa(unescape(encodeURIComponent(result)));
  return encoded.slice(0, 200);
};

export const decodeShareLink = (encoded: string): ShareData | null => {
  try {
    const decoded = decodeURIComponent(escape(atob(encoded)));
    const parts = decoded.split('|');
    if (parts.length < 4) return null;
    const [latStr, lngStr, zoomStr, idsStr] = parts;
    const markerIds = idsStr ? idsStr.split(',').filter(Boolean) : [];
    return {
      centerLat: parseFloat(latStr),
      centerLng: parseFloat(lngStr),
      zoom: parseInt(zoomStr, 10),
      markerIds,
    };
  } catch (e) {
    return null;
  }
};
