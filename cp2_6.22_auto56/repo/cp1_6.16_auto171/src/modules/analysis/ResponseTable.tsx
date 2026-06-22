import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Tag,
  Empty,
  message,
  Select,
} from 'antd';
import {
  TableOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import type { QuestionnaireResponse, Question } from '../../types';

const { Search } = Input;
const { Option } = Select;

const ResponseTable: React.FC = () => {
  const { template, responses, setResponses, setTemplate } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [filterQuestionId, setFilterQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template?.id && responses.length === 0) {
      fetchData(template.id);
    }
  }, [template?.id]);

  const fetchData = async (templateId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/results/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data.template);
        setResponses(data.responses);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const formatAnswerValue = (question: Question, value: string | string[] | number): string => {
    if (Array.isArray(value)) {
      return value.join('、');
    }
    if (typeof value === 'number' && question.type === 'rating') {
      return `${value} 分`;
    }
    return String(value || '-');
  };

  const filteredResponses = useMemo(() => {
    if (!template) return [];

    return responses.filter((response) => {
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchInAnswers = response.answers.some((answer) => {
          const question = template.questions.find((q) => q.id === answer.questionId);
          if (!question) return false;
          
          const valueText = formatAnswerValue(question, answer.value).toLowerCase();
          const titleText = question.title.toLowerCase();
          
          return valueText.includes(searchLower) || titleText.includes(searchLower);
        });
        if (!matchInAnswers) return false;
      }

      if (filterQuestionId) {
        const answer = response.answers.find((a) => a.questionId === filterQuestionId);
        if (!answer || !answer.value) return false;
      }

      return true;
    });
  }, [responses, searchText, filterQuestionId, template]);

  const exportToCSV = () => {
    if (!template || filteredResponses.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    const headers = ['提交时间', ...template.questions.map((q) => `"${q.title}"`)];
    const rows = filteredResponses.map((response) => {
      const submitTime = new Date(response.submittedAt).toLocaleString('zh-CN');
      const answers = template.questions.map((question) => {
        const answer = response.answers.find((a) => a.questionId === question.id);
        const value = answer ? formatAnswerValue(question, answer.value) : '-';
        return `"${value.replace(/"/g, '""')}"`;
      });
      return [submitTime, ...answers].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `问卷答卷_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success(`成功导出 ${filteredResponses.length} 条数据`);
  };

  const columns = useMemo(() => {
    if (!template) return [];

    const baseColumns = [
      {
        title: '序号',
        key: 'index',
        width: 60,
        fixed: 'left' as const,
        render: (_: unknown, __: unknown, index: number) => index + 1,
      },
      {
        title: '提交时间',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        width: 180,
        fixed: 'left' as const,
        render: (date: string) => new Date(date).toLocaleString('zh-CN'),
      },
    ];

    const questionColumns = template.questions.map((question, idx) => ({
      title: (
        <div style={{ maxWidth: 200 }}>
          <Tag color={question.type === 'single' ? 'blue' :
            question.type === 'multiple' ? 'green' :
            question.type === 'rating' ? 'orange' : 'default'}
          >
            {question.type === 'single' ? '单选' :
             question.type === 'multiple' ? '多选' :
             question.type === 'rating' ? '评分' : '文本'}
          </Tag>
          <div style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            fontSize: 12,
            color: '#666',
          }}>
            {idx + 1}. {question.title}
          </div>
        </div>
      ),
      key: question.id,
      width: 200,
      ellipsis: true,
      render: (_: unknown, record: QuestionnaireResponse) => {
        const answer = record.answers.find((a) => a.questionId === question.id);
        const value = answer ? answer.value : '-';
        const displayValue = formatAnswerValue(question, value);
        
        return (
          <span title={displayValue}>
            {displayValue}
          </span>
        );
      },
    }));

    return [...baseColumns, ...questionColumns];
  }, [template]);

  if (!template) {
    return (
      <Card
        title={
          <span style={{ color: '#1890FF', fontWeight: 600 }}>
            <TableOutlined /> 数据表格
          </span>
        }
        size="small"
      >
        <Empty description="请先创建并发布问卷" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <span style={{ color: '#1890FF', fontWeight: 600 }}>
          <TableOutlined /> 数据表格
        </span>
      }
      size="small"
      extra={
        <Space>
          <span style={{ color: '#666', fontSize: 12 }}>
            共 {responses.length} 条答卷
            {filteredResponses.length !== responses.length && 
              ` (筛选后 ${filteredResponses.length} 条)`}
          </span>
        </Space>
      }
    >
      <Space style={{ marginBottom: 16, width: '100%' }} wrap>
        <Search
          placeholder="搜索题目或答案内容"
          allowClear
          enterButton={<SearchOutlined />}
          size="middle"
          onSearch={setSearchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          prefix={<FilterOutlined />}
        />
        <Select
          placeholder="按题目筛选"
          allowClear
          style={{ width: 250 }}
          value={filterQuestionId}
          onChange={setFilterQuestionId}
        >
          {template.questions.map((question, idx) => (
            <Option key={question.id} value={question.id}>
              {idx + 1}. {question.title}
            </Option>
          ))}
        </Select>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={exportToCSV}
          disabled={filteredResponses.length === 0}
        >
          导出 CSV
        </Button>
        <Button onClick={() => {
          setSearchText('');
          setFilterQuestionId(null);
        }}>
          重置筛选
        </Button>
      </Space>

      <Table
        dataSource={filteredResponses}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200, y: 'calc(100vh - 400px)' }}
        size="middle"
        bordered
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
          defaultPageSize: 20,
        }}
        locale={{
          emptyText: <Empty description="暂无答卷数据" />,
        }}
      />
    </Card>
  );
};

export default ResponseTable;
