export function formatTimeShort(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`
}

export function pxToSec(px: number, pxPerSec: number): number {
  return Math.max(0, px / pxPerSec)
}

export function secToPx(sec: number, pxPerSec: number): number {
  return Math.max(0, sec * pxPerSec)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function triggerFileInput(accept: string, cb: (file: File) => void, multiple = false) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.multiple = multiple
  input.style.display = 'none'
  input.onchange = () => {
    if (input.files && input.files.length > 0) {
      cb(input.files[0])
    }
  }
  document.body.appendChild(input)
  input.click()
  document.body.removeChild(input)
}

export function readFileAsJSON(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string))
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export function throttle<F extends (...args: any[]) => any>(fn: F, wait = 16) {
  let last = 0
  let raf = 0
  let lastArgs: any[] | null = null
  return function (this: any, ...args: any[]) {
    lastArgs = args
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      const now = performance.now()
      if (now - last >= wait) {
        last = now
        fn.apply(this, lastArgs as any[])
      }
    })
  }
}
