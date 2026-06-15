import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface ImageUploaderProps {
  onImageSelect: (imageData: ImageData) => void
  currentImage: string | null
}

export function ImageUploader({ onImageSelect, currentImage }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
