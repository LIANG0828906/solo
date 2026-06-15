import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Form, Checkbox, Radio, Switch, Row, Col, Typography, Tooltip } from 'antd';
import { BoldOutlined, ItalicOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import type { ChoiceQuestion, ChoiceOption } from '@/types/question';
import { QuestionType } from '@/types/question';
import 'react-quill/dist/quill.snow.css';
import './ChoiceEditor.css';

const { Text } = Typography;

interface ChoiceEditorProps {
  value: ChoiceQuestion;
  onChange: (question: ChoiceQuestion) => void;
}

const optionLabels = ['A', 'B', 'C', 'D'];

const quillModules = {
  toolbar: false,
};

const quillFormats = ['bold', 'italic'];

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);

  const handleBold = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const isActive = quill.getFormat().bold;
      quill.format('bold', !isActive);
      setIsBoldActive(!isActive);
    }
  }, []);

  const handleItalic = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const isActive = quill.getFormat().italic;
      quill.format('italic', !isActive);
      setIsItalicActive(!isActive);
    }
  }, []);

  const handleSelectionChange = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const format = quill.getFormat();
      setIsBoldActive(!!format.bold);
      setIsItalicActive(!!format.italic);
    }
  }, []);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      quill.on('selection-change', handleSelectionChange);
      return () => {
        quill.off('selection-change', handleSelectionChange);
      };
    }
  }, [handleSelectionChange]);

  return (
    <div className="choice-editor-quill-wrapper">
      <div className="choice-editor-toolbar">
        <Tooltip title="加粗 (Ctrl+B)">
          <button
            type="button"
            className={`choice-editor-toolbar-btn ${isBoldActive ? 'active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              handleBold();
            }}
          >
            <BoldOutlined />
          </button>
        </Tooltip>
        <Tooltip title="斜体 (Ctrl+I)">
          <button
            type="button"
            className={`choice-editor-toolbar-btn ${isItalicActive ? 'active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              handleItalic();
            }}
          >
            <ItalicOutlined />
          </button>
        </Tooltip>
      </div>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={quillModules}
        formats={quillFormats}
        placeholder={placeholder}
      />
    </div>
  );
}

function convertMarkdownToHtml(content: string): string {
  let result = content;
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return result;
}

function ensureHtmlContent(content: string): string {
  if (!content) return '';
  if (content.includes('<strong>') || content.includes('<em>') || content.includes('<p>')) {
    return content;
  }
  return convertMarkdownToHtml(content);
}

export default function ChoiceEditor({ value, onChange }: ChoiceEditorProps) {
  const [activeOptionIndex, setActiveOptionIndex] = useState<number | null>(null);

  const handleStemChange = (content: string) => {
    onChange({ ...value, stem: content });
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

  const handleCorrectAnswersChange = (optionLabel: string, checked: boolean) => {
    let newCorrectAnswers: string[];
    if (value.isMultiple) {
      newCorrectAnswers = checked
        ? [...value.correctAnswers, optionLabel]
        : value.correctAnswers.filter((label) => label !== optionLabel);
    } else {
      newCorrectAnswers = checked ? [optionLabel] : [];
    }
    onChange({ ...value, correctAnswers: newCorrectAnswers });
  };

  const stemHtml = useMemo(() => ensureHtmlContent(value.stem), [value.stem]);
  const optionsHtml = useMemo(
    () => value.options.map((opt) => ensureHtmlContent(opt.content)),
    [value.options]
  );

  return (
    <div className="space-y-6">
      <Form.Item label="题干" required>
        <RichTextEditor
          value={stemHtml}
          onChange={handleStemChange}
          placeholder="请输入题干内容"
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
          <div
            key={option.id}
            className={`choice-option-card ${activeOptionIndex === index ? 'choice-option-card-active' : ''}`}
            onMouseEnter={() => setActiveOptionIndex(index)}
            onMouseLeave={() => setActiveOptionIndex(null)}
          >
            <Row gutter={16} align="top">
              <Col span={3}>
                <div className="flex items-center justify-center h-full min-h-[80px]">
                  {value.isMultiple ? (
                    <Checkbox
                      checked={value.correctAnswers.includes(option.label)}
                      onChange={(e) =>
                        handleCorrectAnswersChange(option.label, e.target.checked)
                      }
                    >
                      <Text strong className="text-lg">{optionLabels[index]}</Text>
                    </Checkbox>
                  ) : (
                    <Radio
                      checked={value.correctAnswers.includes(option.label)}
                      onChange={(e) =>
                        handleCorrectAnswersChange(option.label, e.target.checked)
                      }
                    >
                      <Text strong className="text-lg">{optionLabels[index]}</Text>
                    </Radio>
                  )}
                </div>
              </Col>
              <Col span={21}>
                <RichTextEditor
                  value={optionsHtml[index]}
                  onChange={(content) => handleOptionContentChange(index, content)}
                  placeholder={`请输入选项${optionLabels[index]}的内容`}
                />
              </Col>
            </Row>
          </div>
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
