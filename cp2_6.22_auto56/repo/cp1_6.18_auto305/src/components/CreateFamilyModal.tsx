import { useState, useEffect } from 'react'
import { X, Check, Users } from 'lucide-react'
import { cn, generateAvatarColor } from '@/lib/utils'
import { themeList } from '@/utils/theme'
import { createFamily } from '@/utils/api'
import { useFamily } from '@/context/FamilyContext'
import type { Family, ThemeId } from '@/types'

interface CreateFamilyModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (family: Family) => void
}

export default function CreateFamilyModal({ isOpen, onClose, onCreated }: CreateFamilyModalProps) {
  const [name, setName] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('orange')
  const [creatorName, setCreatorName] = useState('')
  const [errors, setErrors] = useState<{ name?: string; creatorName?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showShareCode, setShowShareCode] = useState(false)
  const [createdFamily, setCreatedFamily] = useState<Family | null>(null)
  const { setMemberInfo } = useFamily()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setName('')
      setSelectedTheme('orange')
      setCreatorName('')
      setErrors({})
      setShowShareCode(false)
      setCreatedFamily(null)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const validate = () => {
