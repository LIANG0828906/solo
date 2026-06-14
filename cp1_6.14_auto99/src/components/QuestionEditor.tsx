import { Tabs, Card } from 'antd';
import type { TabsProps } from 'antd';
import { QuestionType, Question } from '../types/question';
import ChoiceEditor, { createDefaultChoiceQuestion } from './ChoiceEditor';
import SortEditor, { createDefaultSortQuestion } from './SortEditor';
import BlankEditor, { createDefaultBlankQuestion } from './BlankEditor';
import { v4 as uuidv4 } from 'uuid';

interface QuestionEditorProps {
  value: Question;
  onChange: (question: Question) => void;
}

export default function QuestionEditor({ value, onChange }: QuestionEditorProps) {
  const handleTypeChange = (type: string) => {
    const newId = uuidv4();
    switch (type) {
      case QuestionType.CHOICE:
        onChange(createDefaultChoiceQuestion(newId));
        break;
      case QuestionType.SORT:
        onChange(createDefaultSortQuestion(newId));
        break;
      case QuestionType.BLANK:
        onChange(createDefaultBlankQuestion(newId));
        break;
    }
  };

  const handleChoiceChange = (question: Question) => {
    onChange(question);
  };

  const handleSortChange = (question: Question) => {
    onChange(question);
  };

  const handleBlankChange = (question: Question) => {
    onChange(question);
  };

  const tabItems: TabsProps['items'] = [
    {
      key: QuestionType.CHOICE,
      label: '选择题',
      children: value.type === QuestionType.CHOICE && (
        <ChoiceEditor value={value} onChange={handleChoiceChange} />
      ),
    },
    {
      key: QuestionType.SORT,
      label: '拖拽排序题',
      children: value.type === QuestionType.SORT && (
        <SortEditor value={value} onChange={handleSortChange} />
      ),
    },
    {
      key: QuestionType.BLANK,
      label: '填空题',
      children: value.type === QuestionType.BLANK && (
        <BlankEditor value={value} onChange={handleBlankChange} />
      ),
    },
  ];

  return (
    <Card
      className="editor-card"
      styles={{ body: { padding: '20px' } }}
    >
      <Tabs
        activeKey={value.type}
        onChange={handleTypeChange}
        items={tabItems}
        size="large"
      />
    </Card>
  );
}
