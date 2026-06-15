import { Link } from 'react-router-dom'

interface NavbarProps {
  pageTitle: string
}

export default function Navbar({ pageTitle }: NavbarProps) {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg className="logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="8" fill="#ffffff" />
          <circle cx="24" cy="24" r="14" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" fill="none" />
          <circle cx="24" cy="24" r="20" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
        </svg>
        <span>EventRipple</span>
      </Link>
      <span className="navbar-page-title">{pageTitle}</span>
    </nav>
  )
}
