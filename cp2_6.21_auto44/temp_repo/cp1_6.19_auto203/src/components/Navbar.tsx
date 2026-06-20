import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-[var(--color-primary-dark)] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold tracking-wide">
            书香阁
          </Link>
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="hover:text-[var(--color-accent-gold)] transition-colors duration-200"
            >
              活动列表
            </Link>
            <Link
              to="/create"
              className="bg-[var(--color-accent-gold)] text-[var(--color-primary-dark)] px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity duration-200"
            >
              创建活动
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
