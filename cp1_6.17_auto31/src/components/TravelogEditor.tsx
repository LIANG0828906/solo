import { useState, useEffect } from 'react';
import { Modal, Input, Button, Typography, message } from 'antd';
import { EyeOutlined, SaveOutlined } from '@ant-design/icons';
import { useTravelogStore } from '@/store/travelogStore';
import type { Checkin } from '@/types';

const { Title, Text } = Typography;

interface TravelogEditorProps {
  open: boolean;
  checkin: Checkin | null;
  onClose: () => void;
}

export default function TravelogEditor({ open, checkin, onClose }: TravelogEditorProps) {
  const { createTravelog } = useTravelogStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (open && checkin) {
      setTitle(`我的游记 - ${checkin.name}`);
      setContent('');
      setPreviewMode(false);
    }
  }, [open, checkin]);

  const handleSave = async () => {
    if (!title.trim()) {
      message.warning('请输入游记标题');
      return;
    }
    if (!content.trim()) {
      message.warning('请输入游记正文');
      return;
    }
    if (checkin) {
      const result = await createTravelog(title.trim(), content.trim(), [checkin.id]);
      if (result) {
        message.success('游记保存成功！');
        onClose();
        setTitle('');
        setContent('');
      } else {
        message.error('保存失败');
      }
    }
  };

  const handlePreview = () => {
    if (!title.trim()) {
      message.warning('请输入游记标题');
      return;
    }
    if (!content.trim()) {
      message.warning('请输入游记正文');
      return;
    }
    setPreviewMode(!previewMode);
  };

  if (!checkin) return null;

  return (
    <Modal
      title={previewMode ? '游记预览' : '编辑游记'}
      open={open}
      onCancel={onClose}
      width={640}
      footer={null}
      centered
      className="travelog-editor-modal"
    >
      {previewMode ? (
        <div className="preview-content">
          <Title level={4} style={{ marginBottom: '16px', color: '#1A237E' }}>
            {title}
          </Title>
          {checkin.photoUrl && (
            <img
              src={checkin.photoUrl}
              alt="cover"
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }}
            />
          )}
          <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '14px', color: '#333' }}>
            {content}
          </Text>
        </div>
      ) : (
        <div className="editor-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>
              游记标题
            </Text>
            <Input
              placeholder="请输入游记标题（最多30字）"
              maxLength={30}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              showCount
              size="large"
            />
          </div>
          <div>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>
              游记正文
            </Text>
            <Input.TextArea
              placeholder="请输入游记正文（最多500字）"
              maxLength={500}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              showCount
              autoSize={{ minRows: 8, maxRows: 12 }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            关联签到点：{checkin.name}
          </div>
        </div>
      )}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button
          icon={<EyeOutlined />}
          onClick={handlePreview}
        >
          {previewMode ? '返回编辑' : '预览'}
        </Button>
        {!previewMode && (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            style={{ backgroundColor: '#1976D2', borderColor: '#1976D2' }}
            onClick={handleSave}
          >
            保存
          </Button>
        )}
      </div>
    </Modal>
  );
}
