import React, { useEffect, useReducer, useRef, useCallback } from 'react';
import type { AppState, AppAction, StyleType, FilterParams } from './types';
import ImageUploader from './components/ImageUploader';
import StyleSelector from './components/StyleSelector';
import ParamSlider from './components/ParamSlider';

const initialState: AppState = {
  originalImage: null,
  originalImageData: null,
  processedImageData: null,
  currentStyle: 'oil',
  params: {
    intensity: 50,
    brightness: 0,
    saturation: 0
  },
  isProcessing: false,
  shareCode: null,
  showToast: false,
  toastMessage: ''
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_IMAGE':
      return {
        ...state,
        originalImage: action.payload.image,
        originalImageData: action.payload.imageData,
        processedImageData: null
      };
    case 'SET_STYLE':
      return {
        ...state,
        currentStyle: action.payload
      };
    case 'SET_PARAMS':
      return {
        ...state,
        params: { ...state.params, ...action.payload }
      };
    case 'SET_PROCESSED':
      return {
        ...state,
        processedImageData: action.payload
      };
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload
      };
    case 'SET_SHARE_CODE':
      return {
        ...state,
        shareCode: action.payload
      };
    case 'SHOW_TOAST':
      return {
        ...state,
        showToast: true,
        toastMessage: action.payload
      };
    case 'HIDE_TOAST':
      return {
        ...state,
        showToast: false,
        toastMessage: ''
      };
    default:
      return state;
  }
}

function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const processingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const workerCode = `
      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function applyBrightnessAndSaturation(data, brightness, saturation) {
        const brightnessFactor = brightness / 50;
        const saturationFactor = 1 + saturation / 50;
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
          r = clamp(r + brightnessFactor * 255, 0, 255);
          g = clamp(g + brightnessFactor * 255, 0, 255);
          b = clamp(b + brightnessFactor * 255, 0, 255);
          const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
          r = clamp(gray + (r - gray) * saturationFactor, 0, 255);
          g = clamp(gray + (g - gray) * saturationFactor, 0, 255);
          b = clamp(gray + (b - gray) * saturationFactor, 0, 255);
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      }

      function blendIntensity(original, filtered, intensity) {
        const factor = intensity / 100;
        const result = new Uint8ClampedArray(original.length);
        for (let i = 0; i < original.length; i += 4) {
          result[i] = clamp(original[i] + (filtered[i] - original[i]) * factor, 0, 255);
          result[i + 1] = clamp(original[i + 1] + (filtered[i + 1] - original[i + 1]) * factor, 0, 255);
          result[i + 2] = clamp(original[i + 2] + (filtered[i + 2] - original[i + 2]) * factor, 0, 255);
          result[i + 3] = original[i + 3];
        }
        return result;
      }

      function boxBlur(data, width, height, radius) {
        const result = new Uint8ClampedArray(data.length);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, count = 0;
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const idx = (ny * width + nx) * 4;
                  r += data[idx];
                  g += data[idx + 1];
                  b += data[idx + 2];
                  count++;
                }
              }
            }
            const idx = (y * width + x) * 4;
            result[idx] = r / count;
            result[idx + 1] = g / count;
            result[idx + 2] = b / count;
            result[idx + 3] = data[idx + 3];
          }
        }
        return result;
      }

      function applyOilFilter(source) {
        const { width, height, data } = source;
        const result = new Uint8ClampedArray(data.length);
        const radius = 3;
        const intensityLevels = 20;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const intensityCount = new Array(intensityLevels).fill(0);
            const rSum = new Array(intensityLevels).fill(0);
            const gSum = new Array(intensityLevels).fill(0);
            const bSum = new Array(intensityLevels).fill(0);
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const idx = (ny * width + nx) * 4;
                  const r = data[idx];
                  const g = data[idx + 1];
                  const b = data[idx + 2];
                  const intensity = Math.floor(((r + g + b) / 3) * intensityLevels / 256);
                  intensityCount[intensity]++;
                  rSum[intensity] += r;
                  gSum[intensity] += g;
                  bSum[intensity] += b;
                }
              }
            }
            let maxIdx = 0;
            let maxCount = 0;
            for (let i = 0; i < intensityLevels; i++) {
              if (intensityCount[i] > maxCount) {
                maxCount = intensityCount[i];
                maxIdx = i;
              }
            }
            const idx = (y * width + x) * 4;
            result[idx] = rSum[maxIdx] / maxCount;
            result[idx + 1] = gSum[maxIdx] / maxCount;
            result[idx + 2] = bSum[maxIdx] / maxCount;
            result[idx + 3] = data[idx + 3];
          }
        }
        for (let i = 0; i < result.length; i += 4) {
          result[i] = clamp(result[i] * 1.1, 0, 255);
          result[i + 1] = clamp(result[i + 1] * 1.05, 0, 255);
          result[i + 2] = clamp(result[i + 2] * 0.95, 0, 255);
        }
        return { data: result, width, height };
      }

      function applyWatercolorFilter(source) {
        const { width, height, data } = source;
        const blurred = boxBlur(data, width, height, 2);
        const result = new Uint8ClampedArray(blurred.length);
        const levels = 16;
        for (let i = 0; i < blurred.length; i += 4) {
          result[i] = Math.floor(blurred[i] / (256 / levels)) * (256 / levels);
          result[i + 1] = Math.floor(blurred[i + 1] / (256 / levels)) * (256 / levels);
          result[i + 2] = Math.floor(blurred[i + 2] / (256 / levels)) * (256 / levels);
          result[i + 3] = blurred[i + 3];
        }
        const moreBlurred = boxBlur(result, width, height, 1);
        for (let i = 0; i < moreBlurred.length; i += 4) {
          moreBlurred[i] = clamp(moreBlurred[i] * 1.15, 0, 255);
          moreBlurred[i + 1] = clamp(moreBlurred[i + 1] * 1.1, 0, 255);
          moreBlurred[i + 2] = clamp(moreBlurred[i + 2] * 1.2, 0, 255);
        }
        return { data: moreBlurred, width, height };
      }

      function applySketchFilter(source) {
        const { width, height, data } = source;
        const result = new Uint8ClampedArray(data.length);
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          result[i] = gray;
          result[i + 1] = gray;
          result[i + 2] = gray;
          result[i + 3] = data[i + 3];
        }
        const inverted = new Uint8ClampedArray(result.length);
        for (let i = 0; i < result.length; i += 4) {
          inverted[i] = 255 - result[i];
          inverted[i + 1] = 255 - result[i + 1];
          inverted[i + 2] = 255 - result[i + 2];
          inverted[i + 3] = result[i + 3];
        }
        const blurredInverted = boxBlur(inverted, width, height, 8);
        const final = new Uint8ClampedArray(result.length);
        for (let i = 0; i < result.length; i += 4) {
          const base = result[i];
          const blur = blurredInverted[i];
          const dodge = clamp((base * 255) / (256 - blur), 0, 255);
          final[i] = dodge;
          final[i + 1] = dodge;
          final[i + 2] = dodge;
          final[i + 3] = result[i + 3];
        }
        return { data: final, width, height };
      }

      function applyCyberpunkFilter(source) {
        const { width, height, data } = source;
        const result = new Uint8ClampedArray(data.length);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            let r = data[idx];
            let g = data[idx + 1];
            let b = data[idx + 2];
            r = clamp(r * 0.8 + b * 0.4, 0, 255);
            g = clamp(g * 0.7 + r * 0.3, 0, 255);
            b = clamp(b * 1.3 + r * 0.2, 0, 255);
            const brightness = (r + g + b) / 3;
            if (brightness > 128) {
              r = clamp(r * 1.2, 0, 255);
              g = clamp(g * 0.9, 0, 255);
              b = clamp(b * 1.4, 0, 255);
            } else {
              r = clamp(r * 0.9, 0, 255);
              g = clamp(g * 1.1, 0, 255);
              b = clamp(b * 1.2, 0, 255);
            }
            r = clamp((r - 128) * 1.3 + 128, 0, 255);
            g = clamp((g - 128) * 1.1 + 128, 0, 255);
            b = clamp((b - 128) * 1.4 + 128, 0, 255);
            result[idx] = r;
            result[idx + 1] = g;
            result[idx + 2] = b;
            result[idx + 3] = data[idx + 3];
          }
        }
        return { data: result, width, height };
      }

      self.onmessage = function(e) {
        const { type, imageData, style, params } = e.data;
        if (type === 'process') {
          try {
            const originalCopy = new Uint8ClampedArray(imageData.data);
            const source = { data: imageData.data, width: imageData.width, height: imageData.height };
            
            let filtered;
            switch (style) {
              case 'oil':
                filtered = applyOilFilter(source);
                break;
              case 'watercolor':
                filtered = applyWatercolorFilter(source);
                break;
              case 'sketch':
                filtered = applySketchFilter(source);
                break;
              case 'cyberpunk':
                filtered = applyCyberpunkFilter(source);
                break;
              default:
                filtered = { data: new Uint8ClampedArray(imageData.data), width: imageData.width, height: imageData.height };
            }
            
            const blendedData = blendIntensity(originalCopy, filtered.data, params.intensity);
            applyBrightnessAndSaturation(blendedData, params.brightness, params.saturation);
            
            self.postMessage({
              type: 'processed',
              imageData: {
                data: blendedData,
                width: imageData.width,
                height: imageData.height
              }
            }, [blendedData.buffer]);
          } catch (error) {
            console.error('Filter error:', error);
          }
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'processed') {
        const { data, width, height } = e.data.imageData;
        const processed = new ImageData(new Uint8ClampedArray(data), width, height);
        dispatch({ type: 'SET_PROCESSED', payload: processed });
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }
    };

    return () => {
      URL.revokeObjectURL(workerUrl);
      workerRef.current?.terminate();
    };
  }, []);

  const processImage = useCallback(() => {
    if (!state.originalImageData || !workerRef.current) return;

    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    dispatch({ type: 'SET_PROCESSING', payload: true });

    processingTimeoutRef.current = window.setTimeout(() => {
      const imageDataCopy = new ImageData(
        new Uint8ClampedArray(state.originalImageData!.data),
        state.originalImageData!.width,
        state.originalImageData!.height
      );

      workerRef.current!.postMessage({
        type: 'process',
        imageData: imageDataCopy,
        style: state.currentStyle,
        params: state.params
      }, [imageDataCopy.data.buffer as ArrayBuffer]);
    }, 16);
  }, [state.originalImageData, state.currentStyle, state.params]);

  useEffect(() => {
    if (state.originalImageData) {
      processImage();
    }
  }, [processImage, state.originalImageData]);

  useEffect(() => {
    if (state.originalImageData) {
      processImage();
    }
  }, [state.currentStyle, state.params]);

  useEffect(() => {
    if (state.processedImageData && previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        previewCanvasRef.current.width = state.processedImageData.width;
        previewCanvasRef.current.height = state.processedImageData.height;
        ctx.putImageData(state.processedImageData, 0, 0);
      }
    }
  }, [state.processedImageData]);

  const handleImageSelect = useCallback((image: HTMLImageElement, imageData: ImageData) => {
    dispatch({ type: 'SET_IMAGE', payload: { image, imageData } });
  }, []);

  const handleStyleChange = useCallback((style: StyleType) => {
    dispatch({ type: 'SET_STYLE', payload: style });
  }, []);

  const handleParamChange = useCallback((params: Partial<FilterParams>) => {
    dispatch({ type: 'SET_PARAMS', payload: params });
  }, []);

  const handleDownload = useCallback(() => {
    if (!state.processedImageData) return;

    const canvas = document.createElement('canvas');
    canvas.width = state.processedImageData.width;
    canvas.height = state.processedImageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(state.processedImageData, 0, 0);

    ctx.font = '14px system-ui';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Artify', canvas.width - 16, canvas.height - 16);

    const link = document.createElement('a');
    link.download = 'artify-styled.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [state.processedImageData]);

  const handleShare = useCallback(async () => {
    const code = generateShareCode();
    dispatch({ type: 'SET_SHARE_CODE', payload: code });

    const shareUrl = `${window.location.origin}?share=${code}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (e) {
      console.log('Fallback copy method');
    }

    dispatch({ type: 'SHOW_TOAST', payload: '链接已复制！' });
    setTimeout(() => {
      dispatch({ type: 'HIDE_TOAST' });
    }, 1500);
  }, []);

  useEffect(() => {
    if (state.showToast) {
      const timer = setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 1500);
      return () => clearTimeout(timer);
    }
  }, [state.showToast]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F172A',
      padding: '24px 16px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 700,
        color: '#F0F0F0',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        marginBottom: '32px'
      }}>
        🎨 Artify - 风格画廊
      </h1>

      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {!state.originalImageData ? (
          <ImageUploader onImageSelect={handleImageSelect} />
        ) : (
          <div>
            <div style={{
              backgroundColor: '#1A1A2E',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              position: 'relative'
            }}>
              <canvas
                ref={previewCanvasRef}
                style={{
                  maxWidth: '60%',
                  maxHeight: '500px',
                  borderRadius: '16px',
                  opacity: state.processedImageData ? 1 : 0,
                  transform: state.processedImageData ? 'scale(1)' : 'scale(0.8)',
                  transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}
              />
              {state.isProcessing && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#94A3B8',
                  fontSize: '14px',
                  zIndex: 10
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #334155',
                    borderTopColor: '#6366F1',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 12px'
                  }} />
                  处理中...
                </div>
              )}
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>

            <StyleSelector currentStyle={state.currentStyle} onStyleChange={handleStyleChange} />

            <div style={{
              backgroundColor: '#16213E',
              borderRadius: '16px',
              padding: '16px',
              marginTop: '24px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#F8FAFC',
                marginBottom: '16px'
              }}>
                参数调节
              </h3>
              <ParamSlider
                label="风格强度"
                value={state.params.intensity}
                min={1}
                max={100}
                onChange={(v) => handleParamChange({ intensity: v })}
              />
              <ParamSlider
                label="亮度"
                value={state.params.brightness}
                min={-50}
                max={50}
                onChange={(v) => handleParamChange({ brightness: v })}
              />
              <ParamSlider
                label="饱和度"
                value={state.params.saturation}
                min={-50}
                max={50}
                onChange={(v) => handleParamChange({ saturation: v })}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '24px'
            }}>
              <button
                onClick={handleDownload}
                disabled={!state.processedImageData}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  backgroundColor: state.processedImageData ? '#6366F1' : '#334155',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: state.processedImageData ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease-out'
                }}
                onMouseEnter={(e) => {
                  if (state.processedImageData) {
                    e.currentTarget.style.backgroundColor = '#818CF8';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = state.processedImageData ? '#6366F1' : '#334155';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                💾 下载 PNG
              </button>
              <button
                onClick={handleShare}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  backgroundColor: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1E293B';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🔗 分享链接
              </button>
            </div>

            <button
              onClick={() => {
                dispatch({ type: 'SET_IMAGE', payload: { image: null as any, imageData: null as any } });
                dispatch({ type: 'SET_PROCESSED', payload: null });
              }}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#94A3B8',
                border: '1px solid #334155',
                borderRadius: '12px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#F8FAFC';
                e.currentTarget.style.borderColor = '#475569';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94A3B8';
                e.currentTarget.style.borderColor = '#334155';
              }}
            >
              重新上传图片
            </button>
          </div>
        )}
      </div>

      {state.showToast && (
        <div style={{
          position: 'fixed',
          top: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          backgroundColor: '#1E293B',
          color: '#F8FAFC',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          fontSize: '14px',
          fontWeight: 500,
          zIndex: 1000,
          opacity: 1,
          animation: 'toastIn 0.3s ease-out'
        }}>
          ✅ {state.toastMessage}
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (max-width: 768px) {
          canvas {
            max-width: 100% !important;
          }
        }
      `}</style>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default App;
