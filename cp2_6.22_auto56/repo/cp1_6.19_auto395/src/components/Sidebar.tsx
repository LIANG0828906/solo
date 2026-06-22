import { motion } from 'framer-motion';

const Sidebar = () => {
  const icons = [
    { id: 'home', label: '首页', icon: '🏠' },
    { id: 'tasks', label: '任务', icon: '📋' },
    { id: 'calendar', label: '日历', icon: '📅' },
    { id: 'settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <div
      style={{
        width: '80px',
        backgroundColor: '#1E2A38',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '24px',
        gap: '20px',
      }}
    >
      {icons.map((icon) => (
        <motion.button
          key={icon.id}
          whileHover={{ backgroundColor: '#3A4B5C' }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'background-color 0.2s',
            position: 'relative',
            overflow: 'hidden',
          }}
          title={icon.label}
        >
          {icon.icon}
        </motion.button>
      ))}
    </div>
  );
};

export default Sidebar;
