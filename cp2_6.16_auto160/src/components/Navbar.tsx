import { Palette } from 'lucide-react';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-logo">
          <Palette className="navbar-icon" size={24} />
          <span className="navbar-title">ExhibitionHub</span>
        </div>
        <div className="navbar-spacer" />
      </div>
    </nav>
  );
}

export default Navbar;
