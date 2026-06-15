import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MarkerPhoto {
  id: string
  url: string
  caption?: string
}

export interface MarkerPopupProps {
  name: string
  address?: string
  photos?: MarkerPhoto[]
  onClose?: () => void
}

export default function MarkerPopup({ name, address, photos, onClose }: MarkerPopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setVisible(false)
    if (onClose) {
      setTimeout(onClose, 150)
    }
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-2xl p-4 w-64 transform transition-all duration-200 origin-top-left',
        visible ? 'scale-100 opacity-100' : 'scale-85 opacity-0'
      )}
    >
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
      >
        <X size={16} />
      </button>

      <div className="pr-6">
        <h3 className="font-semibold text-gray-900 text-base mb-1">{name}</h3>
        {address && <p className="text-sm text-gray-500 mb-3">{address}</p>}
      </div>

      {photos && photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {photos.slice(0, 4).map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={photo.url}
                alt={photo.caption || name}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
          {photos.length > 4 && (
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">+{photos.length - 4}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
