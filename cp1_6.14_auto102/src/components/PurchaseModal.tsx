import { useState } from 'react'
import { X, ShoppingBag, Download, Disc, Check, Copy } from 'lucide-react'
import type { Song } from '@/types'
import { purchaseSong } from '@/api'
import { useMusicStore } from '@/stores/musicStore'

interface PurchaseModalProps {
  song: Song
  type: 'digital' | 'cd'
  onClose: () => void
}

export default function PurchaseModal({ song, type, onClose }: PurchaseModalProps) {
  const [loading, setLoading] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const { addPurchase } = useMusicStore()

  const price = type === 'digital' ? song.priceDigital : song.priceCD

  const handlePurchase = async () => {
    setLoading(true)
    try {
      const result = await purchaseSong(song.id, type)
      if (result.success) {
        setPurchased(true)
        addPurchase(song.id)
        if (result.downloadUrl) setDownloadUrl(result.downloadUrl)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    const url = downloadUrl || `${window.location.origin}/song/${song.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="glass-modal p-6 w-full max-w-md relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors btn-press">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-3">
            {type === 'digital' ? <Download className="w-7 h-7 text-white" /> : <Disc className="w-7 h-7 text-white" />}
          </div>
          <h3 className="font-display font-bold text-lg text-white">{type === 'digital' ? '数字下载' : '实体CD'}</h3>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">作品名称</span>
            <span className="text-white">{song.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">音乐人</span>
            <span className="text-white">{song.artist}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">价格</span>
            <span className="text-white font-semibold">¥{price}</span>
          </div>
        </div>

        {!purchased ? (
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full py-3 rounded-xl gradient-bg text-white font-semibold btn-press hover:shadow-lg hover:shadow-brand-indigo/30 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                处理中...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                确认支付 ¥{price}
              </span>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/20 text-green-400 font-semibold">
              <Check className="w-5 h-5" />
              已购买
            </div>
            {downloadUrl && (
              <div className="flex items-center gap-2">
                <a
                  href={downloadUrl}
                  download
                  className="flex-1 py-2 rounded-lg bg-white/5 text-center text-sm text-gray-300 hover:bg-white/10 transition-colors"
                >
                  下载文件
                </a>
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors btn-press relative"
                >
                  <Copy className="w-4 h-4" />
                  {copied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded whitespace-nowrap animate-slide-up">
                      已复制
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
