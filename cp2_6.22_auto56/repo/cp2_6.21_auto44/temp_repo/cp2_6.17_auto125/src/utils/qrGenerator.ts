import QRCode from 'qrcode'

export const generateQRCode = async (eventId: string): Promise<string> => {
  const checkinUrl = `eventpulse://checkin/${eventId}`
  try {
    const dataUrl = await QRCode.toDataURL(checkinUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1E1E3F',
        light: '#FFFFFF'
      }
    })
    return dataUrl
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    throw error
  }
}
