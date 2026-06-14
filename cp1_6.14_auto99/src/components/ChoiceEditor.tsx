import { useState, useMemo } from 'react';
import { Form, Input, Checkbox, Radio, Switch, Card, Row, Col, Typography } from 'antd';
import type { ChoiceQuestion, ChoiceOption } from '@/types/question';
import { QuestionType } from '@/types/question';

const { TextArea } = Input;
const { Text } = Typography;

interface ChoiceEditorProps {
  value: ChoiceQuestion;
  onChange: (question: ChoiceQuestion) => void;
}

const optionLabels = ['A', 'B', 'C', 'D'];

function renderRichText(content: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const text = match[0];
    if (text.startsWith('**')) {
      parts.push(<strong key={match.index}>{text.slice(2, -2)}</strong>);
    } else if (text.startsWith('*')) {
      parts.push(<em key={match.index}>{text.slice(1, -1)}</em>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

export default function ChoiceEditor({ value, onChange }: ChoiceEditorProps) {
  const [activeOptionIndex, setActiveOptionIndex] = useState<number | null>(null);

  const handleStemChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...value, stem: e.target.value });
  };

  const handleIsMultipleChange = (checked: boolean) => {
    const newCorrectAnswers = checked ? [...value.correctAnswers] : value.correctAnswers.slice(0, 1);
    onChange({ ...value, isMultiple: checked, correctAnswers: newCorrectAnswers });
  };

  const handleOptionContentChange = (index: number, content: string) => {
    const newOptions = value.options.map((opt, i) =>
      i === index ? { ...opt, content } : opt
    );
    onChange({ ...value, options: newOptions });
  };

  const handleCorrectAnswersChange = (optionId: string, checked: boolean) => {
    let newCorrectAnswers: string[];
    if (value.isMultiple) {
      newCorrectAnswers = checked
        ? [...value.correctAnswers, optionId]
        : value.correctAnswers.filter((id) => id !== optionId);
    } else {
      newCorrectAnswers = checked ? [optionId] : [];
    }
    onChange({ ...value, correctAnswers: newCorrectAnswers });
  };

  const previewContents = useMemo(() => {
    return value.options.map((opt) => renderRichText(opt.content));
  }, [value.options]);

  return (
    <div className="space-y-6">
      <Form.Item label="题干" required>
        <TextArea
          value={value.stem}
          onChange={handleStemChange}
          placeholder="请输入题干内容"
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>

      <Row align="middle" className="mb-4">
        <Col span={12}>
          <Form.Item label="题型" className="mb-0">
            <span className="mr-2">{value.isMultiple ? '多选题' : '单选题'}</span>
            <Switch
              checked={value.isMultiple}
              onChange={handleIsMultipleChange}
              checkedChildren="多选"
              unCheckedChildren="单选"
            />
          </Form.Item>
        </Col>
      </Row>

      <div className="space-y-4">
        <Text strong className="text-base">
          选项设置
        </Text>
        {value.options.map((option: ChoiceOption, index: number) => (
          <Card
            key={option.id}
            size="small"
            className="border-gray-200"
            onMouseEnter={() => setActiveOptionIndex(index)}
            onMouseLeave={() => setActiveOptionIndex(null)}
          >
            <Row gutter={16} align="top">
              <Col span={2}>
                <div className="flex items-center justify-center h-10">
                  {value.isMultiple ? (
                    <Checkbox
                      checked={value.correctAnswers.includes(option.id)}
                      onChange={(e) =>
                        handleCorrectAnswersChange(option.id, e.target.checked)
                      }
                    >
                      <Text strong>{optionLabels[index]}</Text>
                    </Checkbox>
                  ) : (
                    <Radio
                      checked={value.correctAnswers.includes(option.id)}
                      onChange={(e) =>
                        handleCorrectAnswersChange(option.id, e.target.checked)
                      }
                    >
                      <Text strong>{optionLabels[index]}</Text>
                    </Radio>
                  )}
                </div>
              </Col>
              <Col span={13}>
                <Text type="secondary" className="text-xs mb-1 block">
                  编辑（支持 **加粗** *斜体*）
                </Text>
                <TextArea
                  value={option.content}
                  onChange={(e) => handleOptionContentChange(index, e.target.value)}
                  placeholder={`请输入选项${optionLabels[index]}的内容`}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </Col>
              <Col span={9}>
                <Text type="secondary" className="text-xs mb-1 block">
                  预览
                </Text>
                <div
                  className={`p-3 bg-gray-50 rounded min-h-[52px] border transition-all duration-200 ${
                    activeOptionIndex === index
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  {previewContents[index]}
                </div>
              </Col>
            </Row>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function createDefaultChoiceQuestion(id: string): ChoiceQuestion {
  return {
    id,
    type: QuestionType.CHOICE,
    stem: '',
    isMultiple: false,
    options: optionLabels.map((label, index) => ({
      id: `${id}-opt-${index}`,
      label,
      content: '',
    })),
    correctAnswers: [],
  };
}
