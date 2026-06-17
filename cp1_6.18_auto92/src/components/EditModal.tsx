import React, { useState, useRef, useEffect } from 'react';
import { X, User, Bold, Italic, Upload } from 'lucide-react';
import { Character, Faction, FACTION_LABELS } from '../types';
import { useCharacterStore } from '../stores/characterStore';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  character?: Character | null;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, character }) => {
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);

  const [name, setName] = useState('');
  const [age, setAge] = useState(20);
  const [appearance, setAppearance] = useState('');
  const [personalityInput, setPersonalityInput] = useState('');
  const [personality, setPersonality] = useState<string[]>([]);
  const [background, setBackground] = useState('');
  const [faction, setFaction] = useState<Faction>('protagonist');
  const [avatar, setAvatar] = useState('');
  const [stats, setStats] = useState(50);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  const isEditing = !!character;

  useEffect(() => {
    if (character) {
      setName(character.name);
      setAge(character.age);
      setAppearance(character.appearance);
      setPersonality(character.personality);
      setBackground(character.background);
      setFaction(character.faction);
      setAvatar(character.avatar);
      setStats(character.stats);
    } else {
      setName('');
      setAge(20);
      setAppearance('');
      setPersonality([]);
      setBackground('');
      setFaction('protagonist');
      setAvatar('');
      setStats(50);
    }
  }, [character, isOpen]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [appearance]);

  const handleAddPersonality = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && personalityInput.trim()) {
      e.preventDefault();
      if (!personality.includes(personalityInput.trim())) {
        setPersonality([...personality, personalityInput.trim()]);
      }
      setPersonalityInput('');
    }
  };

  const handleRemovePersonality = (tag: string) => {
    setPersonality(personality.filter((t) => t !== tag));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();

        const scale = Math.max(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        setAvatar(canvas.toDataURL('image/png'));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const execCommand = (command: string) => {
    document.execCommand(command, false);
    backgroundRef.current?.focus();
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('请输入角色姓名');
      return;
    }

    const bgHtml = backgroundRef.current?.innerHTML || '';

    if (isEditing && character) {
      updateCharacter(character.id, {
        name: name.trim(),
        age,
        appearance,
        personality,
        background: bgHtml,
        faction,
        avatar,
        stats,
      });
    } else {
      addCharacter({
        name: name.trim(),
        age,
        appearance,
        personality,
        background: bgHtml,
        faction,
        avatar,
        stats,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? '编辑角色' : '创造角色'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <div className="form-group avatar-group">
              <label className="form-label">头像</label>
              <div className="avatar-upload" onClick={() => fileInputRef.current?.click()}>
                {avatar ? (
                  <img src={avatar} alt="头像预览" className="avatar-preview" />
                ) : (
                  <div className="avatar-placeholder-upload">
                    <Upload size={32} />
                    <span>点击上传</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="form-group name-group">
              <label className="form-label">
                <User size={16} />
                姓名
              </label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入角色姓名"
              />
            </div>

            <div className="form-group age-group">
              <label className="form-label">年龄</label>
              <input
                type="number"
                className="form-input"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                min={0}
                max={200}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group faction-group">
              <label className="form-label">阵营</label>
              <div className="faction-options">
                {(Object.keys(FACTION_LABELS) as Faction[]).map((f) => (
                  <label key={f} className={`faction-option ${faction === f ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="faction"
                      value={f}
                      checked={faction === f}
                      onChange={() => setFaction(f)}
                    />
                    <span>{FACTION_LABELS[f]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group stats-group">
              <label className="form-label">属性点: {stats}</label>
              <input
                type="range"
                className="stats-slider"
                value={stats}
                onChange={(e) => setStats(Number(e.target.value))}
                min={10}
                max={100}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">性格标签</label>
            <input
              type="text"
              className="form-input"
              value={personalityInput}
              onChange={(e) => setPersonalityInput(e.target.value)}
              onKeyDown={handleAddPersonality}
              placeholder="输入后回车添加标签"
            />
            <div className="personality-tags-edit">
              {personality.map((tag) => (
                <span key={tag} className="personality-tag editable">
                  {tag}
                  <button
                    className="tag-remove"
                    onClick={() => handleRemovePersonality(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">外貌描述</label>
            <textarea
              ref={textareaRef}
              className="form-textarea"
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              placeholder="描述角色的外貌特征..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label">背景故事</label>
            <div className="rich-toolbar">
              <button type="button" className="toolbar-btn" onClick={() => execCommand('bold')}>
                <Bold size={14} />
              </button>
              <button type="button" className="toolbar-btn" onClick={() => execCommand('italic')}>
                <Italic size={14} />
              </button>
            </div>
            <div
              ref={backgroundRef}
              className="rich-editor"
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: background }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary save-btn" onClick={handleSave}>
            保存并关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
