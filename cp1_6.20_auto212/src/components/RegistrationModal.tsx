import { useState } from 'react'
import { X, User, Phone, Package } from 'lucide-react'
import type { Equipment } from '@/types'

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { memberName: string; phone: string; equipmentIds: string[] }) => void
  equipment: Equipment[]
}

export default function RegistrationModal({
  isOpen,
  onClose,
  onSubmit,
  equipment,
}: RegistrationModalProps) {
  const [memberName, setMemberName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [isClosing, setIsClosing] = useState(false)

  const handleSubmit = () => {
    if (!memberName.trim() || !phone.trim()) return
    onSubmit({
      memberName: memberName.trim(),
      phone: phone.trim(),
      equipmentIds: selectedEquipment,
    })
    resetForm()
  }

  const resetForm = () => {
    setMemberName('')
    setPhone('')
    setSelectedEquipment([])
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
      resetForm()
    }, 200)
  }

  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id]
    )
  }

  if (!isOpen && !isClosing) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
    >
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
      <div
        className={`relative w-full max-w-md mx-4 bg-surface-card rounded-2xl shadow-xl
          transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-text-primary">活动报名</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              <User size={14} className="inline mr-1" />
              姓名
            </label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="请输入姓名"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest
                placeholder:text-text-secondary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              <Phone size={14} className="inline mr-1" />
              手机号
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest
                placeholder:text-text-secondary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Package size={14} className="inline mr-1" />
              装备需求
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {equipment.map((eq) => {
                const remaining = eq.totalStock - eq.allocated
                const isSelected = selectedEquipment.includes(eq.id)
                const isUnavailable = remaining <= 0 && !isSelected
                return (
                  <label
                    key={eq.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
                      ${isSelected ? 'bg-forest-50 border border-forest/30' : 'border border-transparent'}
                      ${isUnavailable ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !isUnavailable && toggleEquipment(eq.id)}
                      disabled={isUnavailable}
                      className="w-4 h-4 rounded border-gray-300 text-forest focus:ring-forest/30"
                    />
                    <span className="flex-1 text-sm text-text-primary">{eq.name}</span>
                    <span className={`text-xs ${remaining > 0 ? 'text-text-secondary' : 'text-difficulty-hard'}`}>
                      剩余 {remaining}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-sm text-text-secondary rounded-lg hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!memberName.trim() || !phone.trim()}
            className="px-5 py-2.5 text-sm font-medium bg-forest text-white rounded-lg
              hover:bg-forest-light transition-colors
              active:scale-[0.96]
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认报名
          </button>
        </div>
      </div>
    </div>
  )
}
