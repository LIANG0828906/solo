import React, { useState } from 'react';
import { Button, Input, Select, Space, Typography, Divider, Popover, Empty, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined, SettingOutlined } from '@ant-design/icons';
import { useChartStore } from '@/store/chartStore';
import { NODE_COLORS, EMOJI_ICONS, BorderRadius, BorderStyle, EdgeStyle, CONFIG } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

const LeftPanel: React.FC = () => {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    addNode,
    updateNode,
    deleteNode,
    updateEdge,
    deleteEdge,
    startConnecting,
    cancelConnecting,
    connectingFromId,
  } = useChartStore();

  const [activeTab, setActiveTab] = useState<'nodes' | 'edges'>('nodes');

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  const handleAddNode = () => {
    const existingNodes = useChartStore.getState().nodes;
    const centerX = 400 + (existingNodes.length % 5) * 60;
    const centerY = 300 + Math.floor(existingNodes.length / 5) * 100;

    addNode({
      x: centerX,
      y: centerY,
    });
  };

  const handleStartConnecting = () => {
    if (selectedNodeId) {
      if (connectingFromId === selectedNodeId) {
        cancelConnecting();
      } else {
        startConnecting(selectedNodeId);
      }
    }
  };

  const borderRadiusOptions: { value: BorderRadius; label: string }[] = [
    { value: 'rect', label: '直角矩形' },
    { value: 'round', label: '圆角矩形' },
    { value: 'ellipse', label: '椭圆形' },
  ];

  const borderStyleOptions: { value: BorderStyle; label: string }[] = [
    { value: 'none', label: '无边框' },
    { value: 'solid', label: '实线' },
    { value: 'dashed', label: '虚线' },
  ];

  const edgeStyleOptions: { value: EdgeStyle; label: string }[] = [
    { value: 'straight', label: '直线' },
    { value: 'bezier', label: '贝塞尔曲线' },
    { value: 'step', label: '阶梯线' },
  ];

  const EmojiPicker: React.FC<{ value: string; onChange: (emoji: string) => void }> = ({ value, onChange }) => {
    const content = (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(8, 1fr)', 
        gap: '4px',
        padding: '8px',
        maxHeight: '200px',
        overflowY: 'auto',
      }}>
        {EMOJI_ICONS.map(emoji => (
          <Button
            key={emoji}
            type={value === emoji ? 'primary' : 'text'}
            size="small"
            onClick={() => onChange(emoji)}
            style={{ fontSize: '20px', padding: '4px', minWidth: '36px', height: '36px' }}
          >
            {emoji}
          </Button>
        ))}
      </div>
    );

    return (
      <Popover content={content} title="选择图标" trigger="click">
        <Button style={{ fontSize: '20px', width: '100%' }}>
          {value || '选择图标'}
        </Button>
      </Popover>
    );
  };

  const ColorPicker: React.FC<{ value: string; onChange: (color: string) => void }> = ({ value, onChange }) => {
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {NODE_COLORS.map(color => (
          <Tooltip key={color} title={color}>
            <div
              onClick={() => onChange(color)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: color,
                cursor: 'pointer',
                border: value === color ? '2px solid #1976D2' : '2px solid transparent',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
              }}
            />
          </Tooltip>
        ))}
      </div>
    );
  };

  const EdgeColorPicker: React.FC<{ value: string; onChange: (color: string) => void }> = ({ value, onChange }) => {
    const colors = ['#1976D2', '#9C27B0', '#4CAF50', '#FF9800', '#F44336', '#333333', '#607D8B'];
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {colors.map(color => (
          <Tooltip key={color} title={color}>
            <div
              onClick={() => onChange(color)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: color,
                cursor: 'pointer',
                border: value === color ? '2px solid #1976D2' : '2px solid transparent',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
              }}
            />
          </Tooltip>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        width: CONFIG.PANEL_WIDTH,
        backgroundColor: '#F8F9FA',
        borderRight: '1px solid #E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px', borderBottom: '1px solid #E0E0E0' }}>
        <Title level={4} style={{ margin: 0, color: '#333' }}>信息图编辑器</Title>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
        <Button
          type={activeTab === 'nodes' ? 'primary' : 'default'}
          onClick={() => setActiveTab('nodes')}
          style={{ flex: 1, borderRadius: '8px', transition: 'all 0.3s ease' }}
        >
          节点
        </Button>
        <Button
          type={activeTab === 'edges' ? 'primary' : 'default'}
          onClick={() => setActiveTab('edges')}
          style={{ flex: 1, borderRadius: '8px', transition: 'all 0.3s ease' }}
        >
          连线
        </Button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {activeTab === 'nodes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNode}
              size="large"
              style={{
                borderRadius: '8px',
                backgroundColor: '#1976D2',
                transition: 'all 0.3s ease',
              }}
            >
              添加节点
            </Button>

            {selectedNode && (
              <>
                <Divider style={{ margin: '8px 0' }}>
                  <SettingOutlined /> 节点属性
                </Divider>

                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                      节点文本
                    </Text>
                    <Input
                      value={selectedNode.text}
                      onChange={(e) => updateNode(selectedNode.id, { text: e.target.value })}
                      placeholder="输入节点文本"
                      style={{ borderRadius: '8px', transition: 'all 0.3s ease' }}
                    />
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                      背景颜色
                    </Text>
                    <ColorPicker
                      value={selectedNode.bgColor}
                      onChange={(color) => updateNode(selectedNode.id, { bgColor: color })}
                    />
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                      节点图标
                    </Text>
                    <EmojiPicker
                      value={selectedNode.icon}
                      onChange={(emoji) => updateNode(selectedNode.id, { icon: emoji })}
                    />
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                      形状
                    </Text>
                    <Select
                      value={selectedNode.borderRadius}
                      onChange={(val) => updateNode(selectedNode.id, { borderRadius: val as BorderRadius })}
                      style={{ width: '100%', borderRadius: '8px' }}
                    >
                      {borderRadiusOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                      边框样式
                    </Text>
                    <Select
                      value={selectedNode.borderStyle}
                      onChange={(val) => updateNode(selectedNode.id, { borderStyle: val as BorderStyle })}
                      style={{ width: '100%', borderRadius: '8px' }}
                    >
                      {borderStyleOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                      ))}
                    </Select>
                  </div>

                  <Space style={{ width: '100%' }}>
                    <Button
                      icon={<LinkOutlined />}
                      onClick={handleStartConnecting}
                      type={connectingFromId === selectedNode.id ? 'primary' : 'default'}
                      style={{
                        flex: 1,
                        borderRadius: '8px',
                        transition: 'all 0.3s ease',
                        backgroundColor: connectingFromId === selectedNode.id ? '#1976D2' : undefined,
                      }}
                    >
                      {connectingFromId === selectedNode.id ? '取消连线' : '创建连线'}
                    </Button>
                    <Button
                      icon={<DeleteOutlined />}
                      onClick={() => deleteNode(selectedNode.id)}
                      danger
                      style={{ borderRadius: '8px', transition: 'all 0.3s ease' }}
                    >
                      删除
                    </Button>
                  </Space>
                </Space>
              </>
            )}

            <Divider style={{ margin: '8px 0' }}>节点列表</Divider>

            {nodes.length === 0 ? (
              <Empty description="暂无节点" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {nodes.map(node => (
                  <div
