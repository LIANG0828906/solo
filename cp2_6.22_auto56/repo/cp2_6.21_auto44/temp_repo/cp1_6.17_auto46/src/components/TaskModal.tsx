import React, { useState, useMemo } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTaskStore } from '../store/useTaskStore';

const { Option } = Select;
const { TextArea } = Input;

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const addTask = useTaskStore((state) => state.addTask);
  const tasks = useTaskStore((state) => state.tasks);

  const existingAssignees = useMemo(() => {
    const assignees = new Set(tasks.map((t) => t.assignee));
    return Array.from(assignees);
  }, [tasks]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await addTask({
        title: values.title,
        assignee: Array.isArray(values.assignee) ? values.assignee.join(', ') : values.assignee,
        estimatedHours: values.estimatedHours,
        description: values.description,
      });
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlusOutlined style={{ color: '#1890FF' }} />
          添加任务
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确认"
      cancelText="取消"
      okButtonProps={{
        style: { backgroundColor: '#1890FF', borderRadius: 8 },
      }}
      cancelButtonProps={{
        style: { borderRadius: 8 },
      }}
      style={{ top: 100 }}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 20 }}
      >
        <Form.Item
          name="title"
          label="任务标题"
          rules={[{ required: true, message: '请输入任务标题' }]}
        >
          <Input placeholder="请输入任务标题" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          name="assignee"
          label="负责人"
          rules={[{ required: true, message: '请选择或输入负责人' }]}
        >
          <Select
            mode="tags"
            placeholder="请选择或输入负责人"
            style={{ borderRadius: 8 }}
            tokenSeparators={[',']}
            maxTagCount={1}
          >
            {existingAssignees.map((name) => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="estimatedHours"
          label="预估工时（小时）"
          rules={[
            { required: true, message: '请输入预估工时' },
            { type: 'number', min: 0.5, message: '工时最少为0.5小时' },
          ]}
        >
          <InputNumber
            min={0.5}
            step={0.5}
            placeholder="请输入预估工时"
            style={{ width: '100%', borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item name="description" label="任务描述">
          <TextArea
            rows={4}
            placeholder="请输入任务描述（可选）"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const AddTaskButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button
    type="primary"
    icon={<PlusOutlined />}
    onClick={onClick}
    style={{
      backgroundColor: '#1890FF',
      borderRadius: 8,
      height: 36,
      padding: '0 16px',
    }}
  >
    添加任务
  </Button>
);
