import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { DeviceConfig, CodePayload } from './types';

interface DeviceFrameProps {
  device: DeviceConfig;
  code: CodePayload;
  onScreenshotReady: (canvas: HTMLCanvasElement) => void;
  onError: (message: string) => void;
  onResize?: () => void;
}

export interface DeviceFrameRef {
  getCanvas: () => HTMLCanvasElement | null;
  refresh: () => void;
}

const DeviceFrame = forwardRef<DeviceFrameRef, DeviceFrameProps>(({
  device,
  code,
  onScreenshotReady,
  onError,
  onResize
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messageIdRef = useRef(0);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    refresh: () => sendCodeToIframe()
  }));

  const generateIframeContent = (): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=${device.width}, initial-scale=1.0">
          <style>${code.css}</style>
          <script>
            window.onerror = function(message, source, lineno, colno, error) {
              window.parent.postMessage({
                type: 'ERROR',
                message: message + ' (line ' + lineno + ')',
                id: ${messageIdRef.current}
              }, '*');
              return true;
            };
            
            const originalConsoleError = console.error;
            console.error = function(...args) {
              originalConsoleError.apply(console, args);
              window.parent.postMessage({
                type: 'ERROR',
                message: args.map(String).join(' '),
                id: ${messageIdRef.current}
              }, '*');
            };

            window.addEventListener('message', function(e) {
              if (e.data.type === 'CAPTURE') {
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = document.body.scrollWidth;
                  canvas.height = document.body.scrollHeight;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + canvas.width + '" height="' + canvas.height + '">' +
                      '<foreignObject width="100%" height="100%">' +
                      '<div xmlns="http://www.w3.org/1999/xhtml">' +
                      document.documentElement.innerHTML +
                      '</div></foreignObject></svg>';
                    const img = new Image();
                    img.onload = function() {
                      ctx.drawImage(img, 0, 0);
                      window.parent.postMessage({
                        type: 'SCREENSHOT',
                        dataUrl: canvas.toDataURL('image/png'),
                        width: canvas.width,
                        height: canvas.height,
                        id: e.data.id
                      }, '*');
                    };
                    img.onerror = function() {
                      window.parent.postMessage({
                        type: 'SCREENSHOT_FALLBACK',
                        id: e.data.id
                      }, '*');
                    };
                    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
                  }
                } catch (err) {
                  window.parent.postMessage({
                    type: 'SCREENSHOT_FALLBACK',
                    id: e.data.id
                  }, '*');
                }
              }
            });

            document.addEventListener('DOMContentLoaded', function() {
              window.parent.postMessage({ type: 'READY', id: ${messageIdRef.current} }, '*');
            });
          <\/script>
        </head>
        <body>${code.html}</body>
        <script>${code.js}<\/script>
      </html>
    `;
  };

  const sendCodeToIframe = () => {
    messageIdRef.current++;
    if (iframeRef.current) {
      iframeRef.current.srcdoc = generateIframeContent();
    }
  };

  const handleMessage = (event: MessageEvent) => {
    if (event.source !== iframeRef.current?.contentWindow) return;

    const { type, message, dataUrl, width, height, id } = event.data;

    if (id !== messageIdRef.current && type !== 'ERROR') return;

    switch (type) {
      case 'READY':
        setTimeout(() => {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
              type: 'CAPTURE',
              id: messageIdRef.current
            }, '*');
          }
        }, 100);
        break;
      case 'SCREENSHOT':
        renderScreenshot(dataUrl, width, height);
        break;
      case 'SCREENSHOT_FALLBACK':
        renderFallbackScreenshot();
        break;
      case 'ERROR':
        onError(message);
        break;
    }
  };

  const renderScreenshot = (dataUrl: string, width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maxWidth = 400;
    const scale = Math.min(maxWidth / width, 1);
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        onScreenshotReady(canvas);
      };
      img.src = dataUrl;
    }
  };

  const renderFallbackScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = device.width / 8;
    canvas.height = device.height / 8;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#999';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${device.name}预览`, canvas.width / 2, canvas.height / 2);
      onScreenshotReady(canvas);
    }
  };

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    sendCodeToIframe();

    const handleResizeEvent = () => {
      onResize?.();
    };
    window.addEventListener('resize', handleResizeEvent);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('resize', handleResizeEvent);
    };
  }, [code, device]);

  return (
    <div className="device-frame-wrapper">
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts allow-same-origin"
        style={{
          position: 'absolute',
          width: device.width,
          height: device.height,
          left: '-9999px',
          top: '-9999px',
          border: 'none',
          opacity: 0,
          pointerEvents: 'none'
        }}
        title={`${device.name}-preview`}
      />
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block'
        }}
      />
    </div>
  );
});

DeviceFrame.displayName = 'DeviceFrame';

export default DeviceFrame;
