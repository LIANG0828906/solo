import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { generateQRCodeSVG } from '@/utils/qrcode';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  label?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  data,
  size = 200,
  label,
}) => {
  const [svgContent, setSvgContent] = useState('');

  useEffect(() => {
    setSvgContent(generateQRCodeSVG(data, size));
  }, [data, size]);

  const handleDownload = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="qrcode-container">
      <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      {label && <p className="qrcode-label">{label}</p>}
      <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }} onClick={handleDownload}>
        <Download size={14} />
        下载二维码
      </button>
    </div>
  );
};
