import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  activityUrl: string;
}

function QRCodeDisplay({ activityUrl }: QRCodeDisplayProps) {
  const [qrSvg, setQrSvg] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const svg = await QRCode.toString(activityUrl, {
          type: 'svg',
          width: 200,
          margin: 1,
          color: {
            dark: '#1e3a8a',
            light: '#ffffff',
          },
        });
        setQrSvg(svg);
      } catch (err) {
        console.error('生成二维码失败:', err);
      }
    };
    generateQR();
  }, [activityUrl]);

  return (
    <div className="qr-section">
      <div
        dangerouslySetInnerHTML={{ __html: qrSvg }}
        style={{ width: '200px', height: '200px' }}
      />
      <p>{activityUrl}</p>
    </div>
  );
}

export default QRCodeDisplay;
