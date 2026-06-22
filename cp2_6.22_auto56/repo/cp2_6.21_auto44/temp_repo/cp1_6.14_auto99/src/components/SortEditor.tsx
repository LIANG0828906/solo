import { useMemo } from 'react';
import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { DragOutlined, CheckOutlined } from '@ant-design/icons';
import type { SortQuestion, SortItem } from '@/types/question';
import { QuestionType } from '@/types/question';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface SortEditorProps {
  value: SortQuestion;
  onChange: (question: SortQuestion) => void;
}

interface SortableItemProps {
  item: SortItem;
  index: number;
  correctOrderMap: Map<string, number>;
  onContentChange: (index: number, content: string) => void;
}

function SortableItem({ item, index, correctOrderMap, onContentChange }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="small"
        className={`cursor-move transition-all duration-200 ${
          isDragging
            ? 'scale-105 opacity-80 rotate-2 border-blue-400 border-2 shadow-2xl'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-gray-500 cursor-grab active:cursor-grabbing hover:bg-gray-200 transition-colors"
          >
            <DragOutlined />
          </div>
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
            {index + 1}
          </div>
          <div className="flex-1">
            <Input
              value={item.content}
              onChange={(e) => onContentChange(index, e.target.value)}
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
    </div>
  );
}

function DragOverlayItem({ item, index, correctOrderMap }: Omit<SortableItemProps, 'onContentChange'>) {
  return (
    <Card
      size="small"
      className="scale-105 opacity-80 rotate-2 border-blue-400 border-2 shadow-2xl"
      styles={{ body: { padding: '12px 16px' } }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-gray-500">
          <DragOutlined />
        </div>
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
          {index + 1}
        </div>
        <div className="flex-1 text-base text-gray-700 truncate">
          {item.content || `第 ${index + 1} 项`}
        </div>
        {correctOrderMap.has(item.id) && (
          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-green-500 text-white rounded-full text-xs font-bold">
            {correctOrderMap.get(item.id)}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function SortEditor({ value, onChange }: SortEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = value.items.findIndex((item) => item.id === active.id);
      const newIndex = value.items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(value.items, oldIndex, newIndex);
        onChange({ ...value, items: newItems });
      }
    }
  };

  const correctOrderMap = useMemo(() => {
    const orderMap = new Map<string, number>();
    value.correctOrder.forEach((id, index) => {
      orderMap.set(id, index + 1);
    });
    return orderMap;
  }, [value.correctOrder]);

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return value.items.find((item) => item.id === activeId) || null;
  }, [activeId, value.items]);

  const activeIndex = useMemo(() => {
    if (!activeId) return -1;
    return value.items.findIndex((item) => item.id === activeId);
  }, [activeId, value.items]);

  const itemIds = useMemo(() => value.items.map((item) => item.id), [value.items]);

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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {value.items.map((item: SortItem, index: number) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  index={index}
                  correctOrderMap={correctOrderMap}
                  onContentChange={handleItemContentChange}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeItem && activeIndex !== -1 ? (
              <DragOverlayItem
                item={activeItem}
                index={activeIndex}
                correctOrderMap={correctOrderMap}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
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
