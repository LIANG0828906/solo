import { useState, useRef } from 'react';
import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { DragOutlined, CheckOutlined } from '@ant-design/icons';
import type { SortQuestion, SortItem } from '@/types/question';
import { QuestionType } from '@/types/question';
import { v4 as uuidv4 } from 'uuid';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface SortEditorProps {
  value: SortQuestion;
  onChange: (question: SortQuestion) => void;
}

export default function SortEditor({ value, onChange }: SortEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  const handleStemChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...value, stem: e.target.value });
  };

  const handleItemContentChange = (index: number, content: string) => {
    const newItems = value.items.map((item, i) =>
      i === index ? { ...item, content } : item
    );
    onChange({ ...value, items: newItems });
  };

  const handleSetCurrentAsCorrect = () => {
    const correctOrder = value.items.map((item) => item.id);
    onChange({ ...value, correctOrder });
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItemRef.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragItemRef.current;

    if (dragIndex === null || dragIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      dragItemRef.current = null;
      return;
    }

    const newItems = [...value.items];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    onChange({ ...value, items: newItems });

    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const getCorrectOrderLabels = () => {
    const orderMap = new Map<string, number>();
    value.correctOrder.forEach((id, index) => {
      orderMap.set(id, index + 1);
    });
    return orderMap;
  };

  const correctOrderMap = getCorrectOrderLabels();

  return (
    <div className="space-y-6">
      <Form.Item label="题干" required>
        <TextArea
          value={value.stem}
          onChange={handleStemChange}
          placeholder="请输入题干内容，例如：请将下列事件按时间顺序排列"
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>

      <div className="space-y-4">
        <Space className="w-full" style={{ justifyContent: 'space-between' }}>
          <Text strong className="text-base">
            排序项（拖拽调整顺序）
          </Text>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleSetCurrentAsCorrect}
          >
            使用当前顺序为正确顺序
          </Button>
        </Space>

        {value.correctOrder.length > 0 && (
          <Paragraph type="secondary" className="text-sm mb-2">
            正确顺序：
            {value.correctOrder.map((id, index) => {
              const item = value.items.find((i) => i.id === id);
              return (
                <span key={id} className="inline-block mx-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                  {index + 1}. {item?.content || '未命名'}
                </span>
              );
            })}
          </Paragraph>
        )}

        <div className="space-y-3">
          {value.items.map((item: SortItem, index: number) => (
            <Card
              key={item.id}
              size="small"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`cursor-move transition-all duration-200 ${
                draggedIndex === index
                  ? 'opacity-40 scale-95 rotate-1'
                  : ''
              } ${
                dragOverIndex === index && draggedIndex !== index
                  ? 'border-blue-400 border-2 shadow-lg'
                  : 'border-gray-200'
              }`}
              styles={{ body: { padding: '12px 16px' } }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-gray-500">
                  <DragOutlined />
                </div>
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <Input
                    value={item.content}
                    onChange={(e) => handleItemContentChange(index, e.target.value)}
                    placeholder={`请输入第 ${index + 1} 项内容`}
                    bordered={false}
                    className="text-base"
                  />
                </div>
                {correctOrderMap.has(item.id) && (
                  <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-green-500 text-white rounded-full text-xs font-bold">
                    {correctOrderMap.get(item.id)}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function createDefaultSortQuestion(id: string): SortQuestion {
  const items = Array.from({ length: 4 }, (_, i) => ({
    id: uuidv4(),
    content: `选项 ${i + 1}`,
  }));

  return {
    id,
    type: QuestionType.SORT,
    stem: '',
    items,
    correctOrder: items.map((item) => item.id),
  };
}
