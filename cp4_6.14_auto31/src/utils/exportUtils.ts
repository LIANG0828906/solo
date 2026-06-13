import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import axios from 'axios'

const HTML2CANVAS_OPTIONS = {
  useCORS: true,
  scale: 2,
  backgroundColor: '#ffffff',
}

function generateTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

function generateFileName(extension: 'png' | 'pdf'): string {
  return `resume_${generateTimestamp()}.${extension}`
}

export async function exportToPNG(element: HTMLElement, onLoadingChange?: (loading: boolean) => void): Promise<void> {
  try {
    onLoadingChange?.(true)

    const canvas = await html2canvas(element, {
      ...HTML2CANVAS_OPTIONS,
      width: 1200,
      windowWidth: 1200,
    })

    const dataUrl = canvas.toDataURL('image/png')
    const fileName = generateFileName('png')

    saveAs(dataUrl, fileName)
  } finally {
    onLoadingChange?.(false)
  }
}

export async function exportToPDF(element: HTMLElement, onLoadingChange?: (loading: boolean) => void): Promise<void> {
  try {
    onLoadingChange?.(true)

    const canvas = await html2canvas(element, {
      ...HTML2CANVAS_OPTIONS,
      width: 1200,
      windowWidth: 1200,
    })

    const dataUrl = canvas.toDataURL('image/png', 1.0)
    const fileName = generateFileName('pdf')

    saveAs(dataUrl, fileName)
  } finally {
    onLoadingChange?.(false)
  }
}

export interface ShareLinkResponse {
  success: boolean
  shareUrl: string
  message?: string
}

export async function generateShareLink(resumeData: unknown, onLoadingChange?: (loading: boolean) => void): Promise<string> {
  try {
    onLoadingChange?.(true)

    const response = await axios.post<ShareLinkResponse>('/api/resumes/share', {
      resume: resumeData,
    })

    if (!response.data.success) {
      throw new Error(response.data.message || '生成分享链接失败')
    }

    return response.data.shareUrl
  } finally {
    onLoadingChange?.(false)
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (!successful) {
        throw new Error('复制失败')
      }
    } catch (err) {
      document.body.removeChild(textArea)
      throw err
    }
    return
  }

  await navigator.clipboard.writeText(text)
}
