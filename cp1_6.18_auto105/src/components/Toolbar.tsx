import React from 'react';
import { Type, AlignLeft, Image, Users, Trash2 } from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import './Toolbar.css';

const Toolbar: React.FC = () => {
  const { addBlock, deleteBlock, selectedBlockId, toggleCollaboration } = useEditorStore();

  const toolbarButtons = [
    { icon: Type, label: '添加标题块', onClick: () => addBlock('title') },
    { icon: AlignLeft, label: '添加文本块', onClick: () => addBlock('text') },
    { icon: Image, label: '添加图片块', onClick: () => addBlock('image') },
  ];

  return (
    <div className="toolbar-container">
      <div className="toolbar-inner">
        <div className="toolbar-logo">
          <div className="toolbar-logo-icon">B</div>
        </div>

        <div className="toolbar-divider" />

        {toolbarButtons.map((btn, index) => (
          <button
            key={index}
            className="toolbar-icon-btn"
            onClick={btn.onClick}
            title={btn.label}
          >
            <btn.icon size={24} color="#F9FAFB" strokeWidth={1.8} />
          </button>
        ))}

        <div className="toolbar-divider" />

        <button
          className="toolbar-icon-btn"
          style={{
            opacity: selectedBlockId ? 1 : 0.4,
            cursor: selectedBlockId ? 'pointer' : 'not-allowed',
          }}
          onClick={() => selectedBlockId && deleteBlock(selectedBlockId)}
          title="删除选中块"
        >
          <Trash2 size={24} color="#F9FAFB" strokeWidth={1.8} />
        </button>

        <div className="toolbar-spacer" />

        <button
          className="toolbar-icon-btn"
          onClick={toggleCollaboration}
          title="协作"
        >
          <Users size={24} color="#F9FAFB" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
