import { useState, useRef, useEffect } from 'react';
import { useGardenStore } from '../GardenStore';
import './PlantTag.css';

interface PlantTagProps {
  plantId: string;
  tag: string;
}

const PlantTag = ({ plantId, tag }: PlantTagProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tag);
  const inputRef = useRef<HTMLInputElement>(null);
  const updatePlantTag = useGardenStore((state) => state.updatePlantTag);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(tag);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed !== tag) {
      updatePlantTag(plantId, trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(tag);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 20) {
      setEditValue(value);
    }
  };

  if (isEditing) {
    return (
      <div className="plant-tag editing" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="tag-input"
          maxLength={20}
        />
      </div>
    );
  }

  return (
    <div className="plant-tag" onDoubleClick={handleDoubleClick}>
      <span className="tag-text">{tag}</span>
    </div>
  );
};

export default PlantTag;
