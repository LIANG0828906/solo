import { Hourglass } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  fadingOut?: boolean
}

export default function GlobalLoading({ fadingOut }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])
  if (!mounted) return null
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm ${
        fadingOut ? 'loading-fade' : ''
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-sea-blue/20 blur-2xl animate-pulse" />
          <Hourglass
            className="relative h-14 w-14 text-sea-blue animate-hourglassSpin"
            strokeWidth={1.6}
          />
        </div>
        <p className="text-sm tracking-wide text-sea-blue-600">加载中…</p>
      </div>
    </div>
  )
}
