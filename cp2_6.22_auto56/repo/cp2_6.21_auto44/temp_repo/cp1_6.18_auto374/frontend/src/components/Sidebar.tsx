import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { path: '/books', label: '书架', icon: '📚' },
  { path: '/events', label: '活动', icon: '🎉' },
  { path: '/community', label: '社区', icon: '💬' },
];

function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside
        className={`fixed left-0 top-[60px] h-[calc(100vh-60px)] w-[240px] bg-nord-sidebar z-30 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
      >
        <div className="py-6">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 text-gray-700 transition-all duration-200
                  ${isActive
                    ? 'bg-nord-hover border-l-[3px] border-l-nord-primary font-medium'
                    : 'hover:bg-nord-hover border-l-[3px] border-l-transparent'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
