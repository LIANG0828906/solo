import QRCode from 'qrcode';

export async function generateQR(recipeId: string, baseUrl: string): Promise<string> {
  const shareUrl = `${baseUrl}/share/${recipeId}`;
  try {
    const dataUrl = await QRCode.toDataURL(shareUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF'
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('QR code generation failed:', error);
    return '';
  }
}
