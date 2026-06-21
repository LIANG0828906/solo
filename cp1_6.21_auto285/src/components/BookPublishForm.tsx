import { useState, useRef } from 'react'
import { Upload, X, BookOpen, User, Hash, FileText, Check } from 'lucide-react'
import { Book } from '@shared/types'
import { cn } from '@/lib/utils'

interface BookPublishFormProps {
  onPublish: (book: Omit<Book, 'id' | 'createdAt'>) => void
  currentUserId: string
}

export default function BookPublishForm({ onPublish, currentUserId }: BookPublishFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    coverImage: '',
    status: 'available' as const
  })