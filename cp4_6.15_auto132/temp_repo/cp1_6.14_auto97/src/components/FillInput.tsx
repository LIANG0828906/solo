import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface FillInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  inputRef?: React.RefObject<HTMLInputElement>
}

export default function FillInput({
  value = '',
  onChange,
  placeholder = '请输入答案',
  disabled = false,
  className,
  inputRef,
}: FillInputProps) {
  const internalRef = useRef<HTMLInputElement>(null)
  const ref = inputRef || internalRef
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = () => {
    if (!disabled) {
      setIsFocused(true)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full px-1 py-2 bg-transparent border-none outline-none',
          'text-darkBlue text-base font-mono',
          'placeholder:text-gray-400',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'min-w-[200px]'
        )}
      />

      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-300">
        <div
          className={cn(
            'h-full bg-primary transition-all duration-300 ease-out',
            isFocused ? 'w-full' : 'w-0'
          )}
          style={{
            transformOrigin: 'left center',
          }}
        />
      </div>
    </div>
  )
}
