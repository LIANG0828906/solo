import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface UseQRCodeOptions {
  text: string;
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export function useQRCode(options: UseQRCodeOptions) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!options.text) {
        setDataUrl('');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const url = await QRCode.toDataURL(options.text, {
          width: options.width || 256,
          margin: options.margin || 1,
          color: {
            dark: options.color?.dark || '#000000',
            light: options.color?.light || '#ffffff',
          },
        });
        setDataUrl(url);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to generate QR code'));
      } finally {
        setLoading(false);
      }
    };

    generateQRCode();
  }, [options.text, options.width, options.margin, options.color?.dark, options.color?.light]);

  return {
    dataUrl,
    loading,
    error,
  };
}
