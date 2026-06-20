import React from 'react';

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, tags: string[]) => void;
  tags: string[];
  tagColors: Record<string, string>;
}

const CreateNodeModal: React.FC<CreateNodeModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  tags,
  tagColors
}) => {
  const [title, setTitle] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSelectedTags([]);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title.trim(), selectedTags);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 8) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>创建新笔记</h3>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              placeholder="输入笔记标题..."
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>标签 (最多8个)</label>
            <div style={styles.tagOptions}>
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    ...styles.tagOption,
                    backgroundColor: selectedTags.includes(tag) ? tagColors[tag] : 'transparent',
                    borderColor: tagColors[tag],
                    color: selectedTags.includes(tag) ? 'white' : tagColors[tag]
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              取消
            </button>
            <button type="submit" disabled={!title.trim()} style={styles.confirmBtn}>
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '1px solid #3a3a4e',
    animation: 'fadeIn 300ms ease-out'
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#d4d4dc',
    marginBottom: 20
  },
  field: {
    marginBottom: 16
  },
  label: {
    display: 'block',
    fontSize: 13,
    color: '#888',
    marginBottom: 8
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#1e1e2e',
    border: '1px solid #3a3a4e',
    borderRadius: 8,
    color: '#d4d4dc',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 300ms ease-out'
  },
  tagOptions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8
  },
  tagOption: {
    padding: '6px 14px',
    border: '1px solid',
    borderRadius: 16,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 200ms ease-out'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 24
  },
  cancelBtn: {
    padding: '9px 20px',
    backgroundColor: 'transparent',
    color: '#888',
    border: '1px solid #3a3a4e',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 300ms ease-out'
  },
  confirmBtn: {
    padding: '9px 24px',
    backgroundColor: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 300ms ease-out'
  }
};

export default CreateNodeModal;
