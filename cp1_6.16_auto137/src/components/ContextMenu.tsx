import { usePosterStore } from '../store';

interface ContextMenuProps {
  x: number;
  y: number;
  elementId: string;
  onClose: () => void;
}

function ContextMenu({ x, y, elementId, onClose }: ContextMenuProps) {
  const {
    flipElement,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    removeElement,
  } = usePosterStore();

  const handleFlip = () => {
    flipElement(elementId);
    onClose();
  };

  const handleBringForward = () => {
    bringForward(elementId);
    onClose();
  };

  const handleSendBackward = () => {
    sendBackward(elementId);
    onClose();
  };

  const handleBringToFront = () => {
    bringToFront(elementId);
    onClose();
  };

  const handleSendToBack = () => {
    sendToBack(elementId);
    onClose();
  };

  const handleDelete = () => {
    removeElement(elementId);
    onClose();
  };

  const menuItems = [
    { label: '水平翻转', icon: '↔', action: handleFlip },
    { label: '上移一层', icon: '↑', action: handleBringForward },
    { label: '下移一层', icon: '↓', action: handleSendBackward },
    { label: '置顶', icon: '⇧', action: handleBringToFront },
    { label: '置底', icon: '⇩', action: handleSendToBack },
    { label: '删除', icon: '🗑', action: handleDelete, danger: true },
  ];

  return (
    <div
      style={{
        ...styles.menu,
        left: x,
        top: y,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          style={{
            ...styles.menuItem,
            ...(item.danger ? styles.menuItemDanger : {}),
          }}
          onClick={item.action}
        >
          <span style={styles.menuIcon}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  menu: {
    position: 'fixed',
    zIndex: 10000,
    minWidth: '140px',
    backgroundColor: '#1A1A1A',
    borderRadius: '8px',
    padding: '4px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.15s ease',
  },
  menuItemDanger: {
    color: '#ff6b6b',
  },
  menuIcon: {
    width: '18px',
    textAlign: 'center',
    fontSize: '14px',
  },
};

export default ContextMenu;
