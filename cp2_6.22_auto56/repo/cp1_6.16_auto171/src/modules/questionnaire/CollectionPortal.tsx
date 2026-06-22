import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Radio,
  Checkbox,
  Input,
  Rate,
  Progress,
  Space,
  message,
  Result,
  InputNumber,
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CheckOutlined,
  FormOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import type { Question, QuestionnaireResponse, ResponseAnswer } from '../../types';

const { TextArea } = Input;

const CollectionPortal: React.FC = () => {
  const {
    template,
    answers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    setAnswer,
    addResponse,
    resetAnswers,
    setPendingCount,
  } = useAppStore();
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urlTemplateId, setUrlTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get('templateId');
    if (tid) {
      setUrlTemplateId(tid);
      fetchTemplate(tid);
    }
  }, []);

  const fetchTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/template/${id}`);
      if (response.ok) {
        const data = await response.json();
        useAppStore.getState().setTemplate(data);
      }
    } catch (error) {
      message.error('加载问卷失败');
    }
  };

  const currentQuestion = template?.questions[currentQuestionIndex];
  const totalQuestions = template?.questions.length || 0;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const handleNext = () => {
    if (!currentQuestion) return;
    
    const currentAnswer = answers[currentQuestion.id];
    if (currentQuestion.required && isAnswerEmpty(currentAnswer)) {
      message.warning('此题为必答题，请完成后继续');
      return;
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const isAnswerEmpty = (value: string | string[] | number | undefined): boolean => {
    if (value === undefined || value === null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'string') return value.trim() === '';
    if (typeof value === 'number') return isNaN(value) || value === 0;
    return false;
  };

  const validateAllAnswers = (): boolean => {
    if (!template) return false;
    
    const unansweredRequired = template.questions.filter(
      (q) => q.required && isAnswerEmpty(answers[q.id])
    );
    
    if (unansweredRequired.length > 0) {
      message.warning(`还有 ${unansweredRequired.length} 道必答题未完成`);
      const firstUnansweredIndex = template.questions.findIndex(
        (q) => q.required && isAnswerEmpty(answers[q.id])
      );
      if (firstUnansweredIndex !== -1) {
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!template || !validateAllAnswers()) return;

    setLoading(true);
    
    const responseAnswers: ResponseAnswer[] = template.questions.map((q) => ({
      questionId: q.id,
      value: answers[q.id] ?? '',
    }));

    const responseData: Omit<QuestionnaireResponse, 'id' | 'submittedAt'> = {
      templateId: template.id,
      answers: responseAnswers,
    };

    try {
      const response = await fetch('/api/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData),
      });

      if (response.ok) {
        const savedResponse = await response.json();
        addResponse(savedResponse);
        setPendingCount(useAppStore.getState().responses.length);
        setSubmitted(true);
        message.success('提交成功！');
      } else {
        const error = await response.json();
        message.error(error.error || '提交失败');
      }
    } catch (error) {
      message.error('提交失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    resetAnswers();
    setSubmitted(false);
  };

  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'single':
        return (
          <Radio.Group
            value={value || ''}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options?.map((opt) => (
                <Radio key={opt.id} value={opt.label} style={{ fontSize: 16, marginBottom: 8 }}>
                  {opt.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      case 'multiple':
        return (
          <Checkbox.Group
            value={(value as string[]) || []}
            onChange={(checked) => setAnswer(question.id, checked)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options?.map((opt) => (
                <Checkbox key={opt.id} value={opt.label} style={{ fontSize: 16, marginBottom: 8 }}>
                  {opt.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );

      case 'rating':
        return (
          <Space direction="vertical">
            <Rate
              count={5}
              value={(value as number) || 0}
              onChange={(val) => setAnswer(question.id, val)}
              style={{ fontSize: 32 }}
            />
            <div style={{ color: '#999', marginTop: 8 }}>
              当前评分: <InputNumber 
                min={1} 
                max={5} 
                value={(value as number) || 0}
                onChange={(val) => setAnswer(question.id, val || 0)}
              /> 分
            </div>
          </Space>
        );

      case 'text':
        return (
          <TextArea
            value={(value as string) || ''}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            placeholder="请输入您的回答..."
            rows={4}
            style={{ fontSize: 16 }}
            showCount
            maxLength={1000}
          />
        );

      default:
        return null;
    }
  };

  if (!template) {
    return (
      <Card
        title={
          <span style={{ color: '#1890FF', fontWeight: 600 }}>
            <FormOutlined /> 答卷收集
          </span>
        }
        size="small"
      >
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <FormOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p>请先在「问卷设计」页面创建并发布问卷</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>
            或通过 URL 参数访问：<code>?templateId=问卷ID</code>
          </p>
          {urlTemplateId && (
            <p style={{ color: 'red', marginTop: 16 }}>
              无法加载问卷 ID: {urlTemplateId}
            </p>
          )}
        </div>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card size="small">
        <Result
          icon={<SmileOutlined style={{ color: '#52C41A' }} />}
          title={<div className="fade-in-up">感谢参与！</div>}
          subTitle={<div className="fade-in-up" style={{ animationDelay: '0.2s' }}>您的反馈已成功提交，感谢您的宝贵意见。</div>}
          extra={
            <Button type="primary" onClick={handleReset} className="fade-in-up">
              再填一份
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <span style={{ color: '#1890FF', fontWeight: 600 }}>
          <FormOutlined /> 答卷收集
        </span>
      }
      size="small"
      style={{ minHeight: 600 }}
    >
      <Card
        style={{
          maxWidth: 800,
          margin: '0 auto',
          minHeight: 500,
          display: 'flex',
          flexDirection: 'column',
        }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, marginBottom: 8, color: '#000' }}>{template.title}</h1>
          <p style={{ color: '#666' }}>{template.description}</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#666' }}>
              第 {currentQuestionIndex + 1} / {totalQuestions} 题
            </span>
            <span style={{ color: '#1890FF', fontWeight: 500 }}>
              {Math.round(progress)}%
            </span>
          </div>
          <Progress
            percent={progress}
            showInfo={false}
            strokeColor={{
              '0%': '#1890FF',
              '100%': '#52C41A',
            }}
            size="small"
          />
        </div>

        {currentQuestion && (
          <div style={{ flex: 1 }} className="page-transition" key={currentQuestion.id}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>
                {currentQuestionIndex + 1}. {currentQuestion.title}
                {currentQuestion.required && (
                  <span style={{ color: 'red', marginLeft: 4 }}>*</span>
                )}
              </h2>
            </div>

            <div style={{ padding: '16px 0' }}>
              {renderQuestionInput(currentQuestion)}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 24,
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Button
            icon={<LeftOutlined />}
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
          >
            上一题
          </Button>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button type="primary" icon={<RightOutlined />} onClick={handleNext}>
              下一题
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSubmit}
              loading={loading}
            >
              提交问卷
            </Button>
          )}
        </div>
      </Card>
    </Card>
  );
};

export default CollectionPortal;
