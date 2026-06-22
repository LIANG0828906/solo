import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '../store/useAppStore';
import { Attachment } from '../types';

const TaskModal = () => {
  const {
    selectedTaskId,
    tasks,
    updateTask,
    setIsTaskModalOpen,
    isTaskModalOpen,
  } = useAppStore();

  const task = tasks.find((t) => t.id === selectedTaskId);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description);
      setAttachments(task.attachments || []);
    }
  }, [task]);

  if (!task) return null;

  const handleClose = () => {
    updateTask(task.id, {
      title: editTitle,
      description: editDescription,
      attachments,
    });
    setIsTaskModalOpen(false);
  };

  const handleAddAttachment = () => {
    const fileNames = [
      '设计稿_v2.psd',
      '需求文档.pdf',
      '原型图.fig',
      '项目计划.xlsx',
      '会议纪要.docx',
      '参考资料.zip',
    ];
    const randomName = fileNames[Math.floor(Math.random() * fileNames.length)];
    const sizes = ['2.3 MB', '856 KB', '1.5 MB', '3.2 MB', '560 KB', '4.8 MB'];
    const randomSize = sizes[Math.floor(Math.random() * sizes.length)];

    const newAttachment: Attachment = {
      id: uuidv4(),
      name: randomName,
      size: randomSize,
    };
    setAttachments([...attachments, newAttachment]);
  };

  const handleAttachmentClick = (name: string) => {
    alert(`模拟附件不可预览\n\n文件名: ${name}`);
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={index}>{line.slice(2, -2)}</strong>;
      }
      if (line.startsWith('- ')) {
        return (
          <li key={index} style={{ marginLeft: '20px', listStyleType: 'disc' }}>
            {line.slice(2)}
          </li>
        );
      }
      return <div key={index}>{line || '\u00A0'}</div>;
    });
  };

  return (
    <AnimatePresence>
      {isTaskModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '520px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              zIndex: 1001,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid #E0E0E0',
              }}
            >
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '20px',
                  fontWeight: '600',
                  border: 'none',
                  borderBottom: '2px solid #2196F3',
                  outline: 'none',
                  padding: '8px 0',
                  color: '#333',
                  backgroundColor: 'transparent',
                }}
              />
            </div>

            <div
              style={{
                padding: '24px',
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '8px',
                  fontWeight: '500',
                }}
              >
                描述
              </div>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="支持 Markdown 格式：**加粗**、- 列表"
                style={{
                  width: '100%',
                  minHeight: '120px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2196F3';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E0E0E0';
                }}
              />

              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#F5F5F5',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#666',
                }}
              >
                <div style={{ marginBottom: '8px', fontWeight: '500' }}>预览:</div>
                <div style={{ lineHeight: '1.6' }}>{renderMarkdown(editDescription)}</div>
              </div>

              <div
                style={{
                  marginTop: '24px',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '12px',
                    fontWeight: '500',
                  }}
                >
                  附件 ({attachments.length})
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  {attachments.map((att) => (
                    <motion.div
                      key={att.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        backgroundColor: '#F5F5F5',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onClick={() => handleAttachmentClick(att.name)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#E8F5E9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F5F5F5';
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>📄</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', color: '#333' }}>{att.name}</div>
                        <div style={{ fontSize: '11px', color: '#999' }}>{att.size}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={handleAddAttachment}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px dashed #BDBDBD',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: '#666',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2196F3';
                    e.currentTarget.style.color = '#2196F3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#BDBDBD';
                    e.currentTarget.style.color = '#666';
                  }}
                >
                  + 添加附件
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #E0E0E0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                onClick={handleClose}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: '1px solid #E0E0E0',
                  backgroundColor: 'white',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F5F5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                关闭
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;
