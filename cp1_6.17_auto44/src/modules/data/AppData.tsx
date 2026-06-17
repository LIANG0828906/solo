import React, { useState, useRef } from 'react';
import { Button, Input, Modal, message, Space } from 'antd';
import { PlusOutlined, ImportOutlined, DeleteOutlined, GripOutlined, CloseOutlined } from '@ant-design/icons';
import { useStore, BrowsingRecord } from '@/store/useStore';
import './AppData.css';

const { TextArea } = Input;

const DataPanel: React.FC = () => {
  const records = useStore((s) => s.records);
  const addRecord = useStore((s) => s.addRecord);
  const removeRecord = useStore((s) => s.removeRecord);
  const reorderRecords = useStore((s) => s.reorderRecords);
  const importRecords = useStore((s) => s.importRecords);
  const clearRecords = useStore((s) => s.clearRecords);
  const setSelectedNode = useStore((s) => s.setSelectedNode);
  const nodes = useStore((s) => s.nodes);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [newRecord, setNewRecord] = useState({ url: '', title: '', duration: 30 });
  const [importText, setImportText] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<BrowsingRecord | null>(null);

  const handleAddRecord = () => {
    if (!newRecord.url.trim()) {
      message.error('请输入 URL');
      return;
    }
    addRecord({
      timestamp: Date.now(),
      url: newRecord.url,
      title: newRecord.title || newRecord.url,
      duration: newRecord.duration,
    });
    setNewRecord({ url: '', title: '', duration: 30 });
    setAddModalVisible(false);
    message.success('记录已添加');
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        throw new Error('需要数组格式');
      }
      const valid = parsed.filter(
        (r: any) => r.url && r.timestamp !== undefined && r.duration !== undefined
      );
      if (valid.length === 0) {
        message.error('没有有效的记录');
        return;
      }
      importRecords(
        valid.map((r: any) => ({
          timestamp: Number(r.timestamp),
          url: String(r.url),
          title: String(r.title || r.url),
          duration: Number(r.duration),
          source: r.source ? String(r.source) : undefined,
        }))
      );
      setImportModalVisible(false);
      setImportText('');
      message.success(`成功导入 ${valid.length} 条记录`);
    } catch (e) {
      message.error('JSON 格式错误');
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    dragItemRef.current = records[index];
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newRecords = [...records];
    const [draggedItem] = newRecords.splice(draggedIndex, 1);
    newRecords.splice(dropIndex, 0, draggedItem);
    reorderRecords(newRecords);

    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleCardClick = (record: BrowsingRecord) => {
    const node = nodes.find((n) => n.url === record.url);
    if (node) {
      setSelectedNode(node.id);
    }
  };

  const modalStyle = {
    content: { background: '#1A1A2E', color: '#fff', border: 'none', borderRadius: 12 },
    header: { background: '#1A1A2E', color: '#fff', borderBottom: '1px solid #16213E' },
    body: { padding: 0 },
  };

  return (
    <div className="data-panel">
      <div className="panel-header">
        <span className="panel-title">浏览记录</span>
        <Space size={8}>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
          >
            添加
          </Button>
          <Button
            size="small"
            icon={<ImportOutlined />}
            onClick={() => setImportModalVisible(true)}
            style={{ background: '#16213E', color: '#fff', border: 'none' }}
          >
            导入
          </Button>
        </Space>
      </div>

      <div className="records-list">
        {records.length === 0 && (
          <div className="empty-state">
            <p style={{ color: '#8E8E9A' }}>暂无浏览记录</p>
            <p style={{ color: '#555', fontSize: 12, marginTop: 8 }}>点击添加或导入按钮开始</p>
          </div>
        )}
        {records.map((record, index) => (
          <div
            key={record.id}
            className={`record-card ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index && draggedIndex !== index ? 'drag-over' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => handleCardClick(record)}
          >
            <div className="card-glow-bar" />
            <div className="card-drag-handle">
              <GripOutlined />
            </div>
            <div className="card-content">
              <div className="card-title" title={record.title}>
                {record.title}
              </div>
              <div className="card-url" title={record.url}>
                {record.url}
              </div>
              <div className="card-meta">
                <span className="card-time">{formatTime(record.timestamp)}</span>
                <span className="card-duration">{record.duration}s</span>
              </div>
            </div>
            <button
              className="card-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                removeRecord(record.id);
              }}
            >
              <CloseOutlined />
            </button>
          </div>
        ))}
      </div>

      {records.length > 0 && (
        <div className="panel-footer">
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={clearRecords}
            block
          >
            清空所有记录
          </Button>
        </div>
      )}

      <Modal
        title="添加浏览记录"
        open={addModalVisible}
        onOk={handleAddRecord}
        onCancel={() => setAddModalVisible(false)}
        okText="添加"
        cancelText="取消"
        styles={modalStyle}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>
          <div>
            <label style={{ color: '#8E8E9A', fontSize: 12, marginBottom: 6, display: 'block' }}>URL</label>
            <Input
              value={newRecord.url}
              onChange={(e) => setNewRecord({ ...newRecord, url: e.target.value })}
              placeholder="https://example.com/page"
              style={{ background: '#16213E', color: '#fff', border: '1px solid #0F3460' }}
            />
          </div>
          <div>
            <label style={{ color: '#8E8E9A', fontSize: 12, marginBottom: 6, display: 'block' }}>页面标题</label>
            <Input
              value={newRecord.title}
              onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
              placeholder="页面标题"
              style={{ background: '#16213E', color: '#fff', border: '1px solid #0F3460' }}
            />
          </div>
          <div>
            <label style={{ color: '#8E8E9A', fontSize: 12, marginBottom: 6, display: 'block' }}>停留时长 (秒)</label>
            <Input
              type="number"
              value={newRecord.duration}
              onChange={(e) => setNewRecord({ ...newRecord, duration: Number(e.target.value) })}
              style={{ background: '#16213E', color: '#fff', border: '1px solid #0F3460' }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="导入浏览记录"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => setImportModalVisible(false)}
        okText="导入"
        cancelText="取消"
        width={500}
        styles={modalStyle}
      >
        <div style={{ padding: '16px 0' }}>
          <p style={{ color: '#8E8E9A', fontSize: 12, marginBottom: 8 }}>
            粘贴 JSON 格式的浏览记录数组，每条记录包含 url, timestamp, duration, title(可选)
          </p>
          <TextArea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            placeholder={`[\n  {"url": "https://example.com", "timestamp": 1234567890, "duration": 30, "title": "首页"}\n]`}
            style={{
              background: '#16213E',
              color: '#fff',
              border: '1px solid #0F3460',
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default DataPanel;
