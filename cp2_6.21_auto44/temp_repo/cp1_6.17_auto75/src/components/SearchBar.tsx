import { useRef } from 'react'
import { useBookStore } from '../store/bookStore'

interface SearchBarProps {
  onScanClick: () => void
}

export default function SearchBar({ onScanClick }: SearchBarProps) {
  const searchQuery = useBookStore((s) => s.searchQuery)
  const setSearchQuery = useBookStore((s) => s.setSearchQuery)
  const btnRef = useRef<HTMLButtonElement>(null)

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const circle = document.createElement('span')
    const diameter = Math.max(button.clientWidth, button.clientHeight)
    const radius = diameter / 2
    const rect = button.getBoundingClientRect()
    circle.style.width = circle.style.height = `${diameter}px`
    circle.style.left = `${event.clientX - rect.left - radius}px`
    circle.style.top = `${event.clientY - rect.top - radius}px`
    circle.classList.add('ripple-effect')
    const existingRipple = button.getElementsByClassName('ripple-effect')[0]
    if (existingRipple) existingRipple.remove()
    button.appendChild(circle)
    setTimeout(() => circle.remove(), 600)
  }

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 搜索书名、作者或ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          ref={btnRef}
          className="ripple-btn"
          onClick={(e) => {
            createRipple(e)
            onScanClick()
          }}
        >
          📷 扫描ISBN
        </button>
      </div>
    </div>
  )
}
