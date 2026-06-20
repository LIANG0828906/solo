import { GalaxyParams, GalaxyType } from '../types';

export const encodeParamsToURL = (params: GalaxyParams): string => {
  try {
    const jsonStr = JSON.stringify(params);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    return encoded;
  } catch (error) {
    console.error('Error encoding params:', error);
    return '';
  }
};

export const decodeURLToParams = (hash: string): GalaxyParams | null => {
  try {
    if (!hash || hash.length < 10) return null;
    const jsonStr = decodeURIComponent(escape(atob(hash)));
    const params = JSON.parse(jsonStr);
    
    if (!validateParams(params)) {
      console.warn('Invalid params in URL');
      return null;
    }
    
    return params;
  } catch (error) {
    console.error('Error decoding params:', error);
    return null;
  }
};

const validateParams = (params: unknown): params is GalaxyParams => {
  if (typeof params !== 'object' || params === null) return false;
  
  const p = params as Record<string, unknown>;
  
  if (!Object.values(GalaxyType).includes(p.type as GalaxyType)) return false;
  if (typeof p.rotationSpeed !== 'number' || p.rotationSpeed < 0 || p.rotationSpeed > 100) return false;
  if (typeof p.gravityStrength !== 'number' || p.gravityStrength < 0 || p.gravityStrength > 100) return false;
  if (typeof p.dispersionRange !== 'number' || p.dispersionRange < 0 || p.dispersionRange > 100) return false;
  if (typeof p.particleCount !== 'number' || p.particleCount < 500 || p.particleCount > 5000) return false;
  
  return true;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      console.error('Failed to copy:', err);
      return false;
    }
  }
};

export const getURLHash = (): string => {
  return window.location.hash.replace('#', '');
};

export const setURLHash = (hash: string): void => {
  window.location.hash = hash;
};
