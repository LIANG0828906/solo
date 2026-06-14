import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button, Space, message, Collapse, Typography } from 'antd';
import type { CollapseProps } from 'antd';
import { CopyOutlined, FontSizeOutlined, CheckOutlined } from '@ant-design/icons';
import QuestionEditor from './components/QuestionEditor';
import QuestionPreview from './components/QuestionPreview';
import { Question, FontSize, QuestionType } from './types/question';
import { createDefaultChoiceQuestion } from './components/ChoiceEditor';
import { useDebounce } from './hooks/useDebounce';
import { serializeQuestion, validateQuestion } from './utils/questionParser';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

const { Title, Text } = Typography;

export default function App() {
  const [question, setQuestion] = useState<Question>(() =>
    createDefaultChoiceQuestion(uuidv4())
  );
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [leftWidth, setLeftWidth] = useState<number>(40);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(true);
  const [exportCollapsed, setExportCollapsed] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuestion = useDebounce(question, 300);

  useEffect(() => {
    setPreviewVisible(false);
    const timer = setTimeout(() => {
      setPreviewVisible(true);
    }, 10);
    return () => clearTimeout(timer);
  }, [debouncedQuestion]);

  const handleQuestionChange = useCallback((newQuestion: Question) => {
    setQuestion(newQuestion);
  }, []);

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      const newLeftWidth = (mouseX / containerWidth) * 100;

      if (newLeftWidth >= 20 && newLeftWidth <= 70) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const exportedJson = useMemo(() => {
    return serializeQuestion(debouncedQuestion);
  }, [debouncedQuestion]);

  const validationResult = useMemo(() => {
    return validateQuestion(debouncedQuestion);
  }, [debouncedQuestion]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportedJson);
      setCopied(true);
      message.success('JSON已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const collapseItems: CollapseProps['items'] = [
    {
      key: 'export',
      label: (
        <Space>
          <Text strong>导出 JSON 数据</Text>
          {validationResult.valid ? (
            <Text type="success" className="text-xs">
              数据校验通过
            </Text>
          ) : (
            <Text type="danger" className="text-xs">
              数据存在 {validationResult.errors.length} 个问题
            </Text>
          )}
        </Space>
      ),
      children: (
        <div className="json-export-container">
          <div className="json-export-header">
            <Text type="secondary">题目数据 JSON 格式：</Text>
            <Button
              type="primary"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopyJson}
              size="small"
            >
              {copied ? '已复制' : '复制'}
            </Button>
          </div>
          <pre className="json-code-block">
            <code>{exportedJson}</code>
          </pre>
          {!validationResult.valid && (
            <div className="validation-errors">
              <Text type="danger" strong>
                数据校验警告：
              </Text>
              <ul>
                {validationResult.errors.map((error, index) => (
                  <li key={index}>
                    <Text type="danger">{error}</Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    },
  ];

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.CHOICE:
        return '选择题';
      case QuestionType.SORT:
        return '拖拽排序题';
      case QuestionType.BLANK:
        return '填空题';
      default:
        return '未知题型';
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title-section">
            <Title level={3} className="app-title">
              交互式课件复习题编辑器
            </Title>
            <Text type="secondary" className="app-subtitle">
              当前题型：{getQuestionTypeLabel(question.type)}
            </Text>
          </div>
          <div className="header-controls">
            <Text type="secondary" className="font-label">
              <FontSizeOutlined /> 字体大小
            </Text>
            <Space.Compact>
              <Button
                type={fontSize === 'small' ? 'primary' : 'default'}
                onClick={() => handleFontSizeChange('small')}
                size="small"
              >
                小号
              </Button>
              <Button
                type={fontSize === 'medium' ? 'primary' : 'default'}
                onClick={() => handleFontSizeChange('medium')}
                size="small"
              >
                中号
              </Button>
              <Button
                type={fontSize === 'large' ? 'primary' : 'default'}
                onClick={() => handleFontSizeChange('large')}
                size="small"
              >
                大号
              </Button>
            </Space.Compact>
          </div>
        </div>
      </header>

      <div className="main-content" ref={containerRef}>
        <div
          className="editor-pane"
          style={{ width: `${leftWidth}%` }}
        >
          <QuestionEditor value={question} onChange={handleQuestionChange} />
        </div>

        <div
          className={`resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <div className="resize-handle-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div
          className="preview-pane"
          style={{ width: `${100 - leftWidth - 0.5}%` }}
        >
          <QuestionPreview
            value={debouncedQuestion}
            fontSize={fontSize}
            isVisible={previewVisible}
          />
        </div>
      </div>

      <footer className="app-footer">
        <Collapse
          activeKey={exportCollapsed ? [] : ['export']}
          onChange={(keys) => setExportCollapsed(keys.length === 0)}
          items={collapseItems}
          className="export-collapse"
        />
      </footer>
    </div>
  );
}
