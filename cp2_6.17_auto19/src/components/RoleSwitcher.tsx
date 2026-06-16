import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Role } from '../shared/types';
import './RoleSwitcher.css';

const roleConfig: Record<Role, { label: string; icon: string; route: string }> = {
  customer: { label: '顾客', icon: 'person', route: '/' },
  chef: { label: '厨师', icon: 'restaurant', route: '/kitchen' },
  manager: { label: '经理', icon: 'manage_accounts', route: '/admin' }
};

export const RoleSwitcher: React.FC = () => {
  const currentRole = useAppStore(state => state.currentRole);
  const setCurrentRole = useAppStore(state => state.setCurrentRole);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    navigate(roleConfig[role].route);
    setIsOpen(false);
  };

  const config = roleConfig[currentRole];

  return (
    <div className="role-switcher" ref={dropdownRef}>
      <button
        className="role-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="material-icons">{config.icon}</span>
        <span className="role-label">{config.label}</span>
        <span className="material-icons dropdown-arrow">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="role-dropdown animate-fade-in-scale">
          {(Object.keys(roleConfig) as Role[]).map(role => (
            <button
              key={role}
              className={`role-option ${role === currentRole ? 'active' : ''}`}
              onClick={() => handleRoleChange(role)}
            >
              <span className="material-icons">{roleConfig[role].icon}</span>
              <span>{roleConfig[role].label}</span>
              {role === currentRole && (
                <span className="material-icons check-icon">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
