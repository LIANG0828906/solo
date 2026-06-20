import { useState } from 'react';
import { Box, Image, Gem, Sparkles, Columns, Layers } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';
import { ExhibitType, EXHIBIT_TYPE_NAMES } from '../types/scene';

interface ExhibitButtonProps {
  type: ExhibitType;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

function ExhibitButton({ type, icon, label, collapsed }: ExhibitButtonProps) {
  const addExhibit = useSceneStore((state) => state.addExhibit);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    addExhibit(type);
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <div className="exhibit-button-wrapper">
      <button
        className={`exhibit-button ${isPressed ? 'pressed' : ''}`}
        onClick={handleClick}
        title={label}
      >
        {icon}
      </button>
      {!collapsed && <span className="exhibit-label">{label}</span>}
    </div>
  );
}

interface ExhibitCreatorProps {
  collapsed: boolean;
}

export function ExhibitCreator({ collapsed }: ExhibitCreatorProps) {
  const exhibitTypes: { type: ExhibitType; icon: React.ReactNode; label: string }[] = [
    { type: 'pedestal_sculpture', icon: <Box size={24} />, label: EXHIBIT_TYPE_NAMES.pedestal_sculpture },
    { type: 'hanging_painting', icon: <Image size={24} />, label: EXHIBIT_TYPE_NAMES.hanging_painting },
    { type: 'glass_relic', icon: <Gem size={24} />, label: EXHIBIT_TYPE_NAMES.glass_relic },
    { type: 'glowing_sphere', icon: <Sparkles size={24} />, label: EXHIBIT_TYPE_NAMES.glowing_sphere },
    { type: 'particle_column', icon: <Columns size={24} />, label: EXHIBIT_TYPE_NAMES.particle_column },
    { type: 'mirror_plane', icon: <Layers size={24} />, label: EXHIBIT_TYPE_NAMES.mirror_plane },
  ];

  return (
    <div className={`exhibit-creator-panel ${collapsed ? 'collapsed' : ''}`}>
      {!collapsed && <h3 className="panel-title">添加展品</h3>}
      <div className="exhibit-buttons">
        {exhibitTypes.map((item) => (
          <ExhibitButton
            key={item.type}
            type={item.type}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  );
}
