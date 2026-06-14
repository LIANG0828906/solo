import { useMemo } from 'react';
import { Form, Input, Card, Typography, Tag, Space, Button } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import type { BlankQuestion, BlankItem } from '@/types/question';
import { QuestionType } from '@/types/question';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface BlankEditorProps {
  value: BlankQuestion;
  onChange: (question: BlankQuestion) => void;
}

function parseBlanksFromStem(stem: string): string[] {
  const regex = /\{\{blank\}\}/g;
  const matches = stem.match(regex);
  return matches ? Array.from({ length: matches.length }, (_, i) => `blank-${i}`) : [];
}

function renderStemWithBlanks(stem: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = /\{\{blank\}\}/g;
  let match: RegExpExecArray | null;
  let blankIndex = 0;

  while ((match = regex.exec(stem)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{stem.slice(lastIndex, match.index)}</span>);
    }

    parts.push(
      <span
        key={`blank-${blankIndex}`}
        className={cn(
          'inline-flex items-center justify-center mx-1 px-3 min-w-[80px] h-10',
          'text-base font-medium text-blue-700',
          'bg-blue-50 border-2 border-dashed border-blue-400',
          'transition-all duration-200'
        )}
        style={{ borderRadius: '12px' }}
      >
        空位{blankIndex + 1}
      </span>
    );

    blankIndex++;
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < stem.length) {
    parts.push(<span key={`text-${lastIndex}`}>{stem.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : stem;
}

export default function BlankEditor({ value, onChange }: BlankEditorProps) {
  const blankCount = useMemo(() => {
    return parseBlanksFromStem(value.stem).length;
  }, [value.stem]);

  const syncedBlanks: BlankItem[] = useMemo(() => {
    const result: BlankItem[] = [];
    for (let i = 0; i < blankCount; i++) {
      if (value.blanks[i]) {
        result.push(value.blanks[i]);
      } else {
        result.push({
          id: uuidv4(),
          correctAnswers: [''],
        });
      }
    }
    return result;
  }, [blankCount, value.blanks]);

  const handleStemChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newStem = e.target.value;
    const newBlankCount = parseBlanksFromStem(newStem).length;

    let newBlanks = [...value.blanks];

    if (newBlankCount > newBlanks.length) {
      for (let i = newBlanks.length; i < newBlankCount; i++) {
        newBlanks.push({
          id: uuidv4(),
          correctAnswers: [''],
        });
      }
    } else if (newBlankCount < newBlanks.length) {
      newBlanks = newBlanks.slice(0, newBlankCount);
    }

    onChange({ ...value, stem: newStem, blanks: newBlanks });
  };

  const handleBlankAnswerChange = (blankIndex: number, answerIndex: number, answerValue: string) => {
    const newBlanks = syncedBlanks.map((blank, i) => {
      if (i !== blankIndex) return blank;
      const newAnswers = [...blank.correctAnswers];
      newAnswers[answerIndex] = answerValue;
      return { ...blank, correctAnswers: newAnswers };
    });
    onChange({ ...value, blanks: newBlanks });
  };

  const handleAddAnswer = (blankIndex: number) => {
    const newBlanks = syncedBlanks.map((blank, i) => {
      if (i !== blankIndex) return blank;
      return { ...blank, correctAnswers: [...blank.correctAnswers, ''] };
    });
    onChange({ ...value, blanks: newBlanks });
  };

  const handleRemoveAnswer = (blankIndex: number, answerIndex: number) => {
    const newBlanks = syncedBlanks.map((blank, i) => {
      if (i !== blankIndex) return blank;
      if (blank.correctAnswers.length <= 1) return blank;
      const newAnswers = blank.correctAnswers.filter((_, idx) => idx !== answerIndex);
      return { ...blank, correctAnswers: newAnswers };
    });
    onChange({ ...value, blanks: newBlanks });
  };

  return (
    <div className="space-y-6">
      <style>{`
        .blank-editor-card {
          border-radius: 12px !important;
          transition: all 0.25s ease;
        }
        .blank-editor-card:hover {
          border-color: #1a365d !important;
          box-shadow: 0 8px 24px rgba(26, 54, 93, 0.12);
          transform: translateY(-2px);
        }
        .blank-editor-card .ant-card-head {
          border-radius: 12px 12px 0 0 !important;
        }
        .blank-editor-card .ant-card-body {
          border-radius: 0 0 12px 12px !important;
        }
      `}</style>

      <Form.Item label="题干" required>
        <TextArea
          value={value.stem}
          onChange={handleStemChange}
          placeholder="请输入题干内容，使用 {{blank}} 标记空位。例如：我国的首都是{{blank}}，国旗是{{blank}}。"
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>

      <Card
        size="small"
        className="blank-editor-card bg-gray-50"
        styles={{ body: { borderRadius: '12px' } }}
      >
        <Text type="secondary" className="text-xs mb-2 block">
          题干预览
        </Text>
        <Paragraph className="mb-0 text-base leading-relaxed">
          {value.stem ? renderStemWithBlanks(value.stem) : '暂无内容'}
        </Paragraph>
      </Card>

      {blankCount > 0 ? (
        <div className="space-y-4">
          <Text strong className="text-base">
            空位答案设置
            <Tag color="blue" className="ml-2">
              共 {blankCount} 个空位
            </Tag>
          </Text>

          {syncedBlanks.map((blank, blankIndex) => (
            <Card
              key={blank.id}
              size="small"
              title={
                <Space>
                  <Tag color="gold">空位 {blankIndex + 1}</Tag>
                  <Text type="secondary" className="text-xs">
                    多个同义答案用逗号分隔或分别输入
                  </Text>
                </Space>
              }
              className="blank-editor-card border-gray-200"
            >
              <div className="space-y-2">
                {blank.correctAnswers.map((answer, answerIndex) => (
                  <div key={answerIndex} className="flex items-center gap-2">
                    <Tag color="green" className="mb-0">
                      答案 {answerIndex + 1}
                    </Tag>
                    <Input
                      value={answer}
                      onChange={(e) =>
                        handleBlankAnswerChange(blankIndex, answerIndex, e.target.value)
                      }
                      placeholder={`请输入第 ${answerIndex + 1} 个正确答案`}
                      className="flex-1"
                    />
                    {blank.correctAnswers.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleRemoveAnswer(blankIndex, answerIndex)}
                      />
                    )}
                  </div>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => handleAddAnswer(blankIndex)}
                  className="mt-2"
                >
                  添加同义答案
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card
          size="small"
          className="blank-editor-card border-dashed bg-gray-50"
        >
          <Paragraph type="secondary" className="mb-0 text-center">
            请在题干中使用 <Text code>{'{{blank}}'}</Text> 标记空位
          </Paragraph>
        </Card>
      )}
    </div>
  );
}

export function createDefaultBlankQuestion(id: string): BlankQuestion {
  return {
    id,
    type: QuestionType.BLANK,
    stem: '',
    blanks: [],
  };
}
