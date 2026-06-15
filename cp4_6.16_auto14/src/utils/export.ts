import type { Course, Page, AnyBlock } from '@/types'

export function exportAsJSON(
  course: Course,
  pages: Page[],
  blocks: AnyBlock[]
): void {
  const payload = JSON.stringify({ course, pages, blocks }, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${course.title.replace(/\s+/g, '_')}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function generateShareLink(courseId: string): string {
  return `${window.location.origin}/share/${courseId}`
}

export async function copyShareLink(courseId: string): Promise<boolean> {
  const link = generateShareLink(courseId)
  try {
    await navigator.clipboard.writeText(link)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = link
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch {
      document.body.removeChild(textarea)
      return false
    }
  }
}

export function importFromJSON(
  jsonString: string
): { course: Course; pages: Page[]; blocks: AnyBlock[] } | null {
  try {
    const parsed = JSON.parse(jsonString) as {
      course: Course
      pages: Page[]
      blocks: AnyBlock[]
    }
    if (!parsed.course || !parsed.pages || !parsed.blocks) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}
