import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportAsPNG(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const link = document.createElement('a')
  link.download = `music-wrapped-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function exportAsPDF(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const pageHeight = 297
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * pageWidth) / canvas.width

  let yPosition = 0
  if (imgHeight > pageHeight) {
    const ratio = pageHeight / imgHeight
    const scaledWidth = imgWidth * ratio
    const xOffset = (pageWidth - scaledWidth) / 2
    pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, pageHeight)
  } else {
    const yOffset = (pageHeight - imgHeight) / 2
    pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight)
  }

  pdf.save(`music-wrapped-${Date.now()}.pdf`)
}

export function generateShareUrl(songCount: number, topArtist: string): string {
  const params = new URLSearchParams({
    songs: String(songCount),
    artist: encodeURIComponent(topArtist),
    t: String(Date.now()),
  })
  return `${window.location.origin}?${params.toString()}`
}
