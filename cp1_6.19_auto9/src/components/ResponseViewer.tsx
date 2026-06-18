import { ArrowLeft, Download, BarChart3 } from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useSurveyStore } from '@/store';
import { QuestionType, Question, QuestionOption } from '@/utils/questionTypes';
import RippleButton from './RippleButton';

ChartJS.register(ArcElement, Tooltip, Legend);

const BLUE_GRADIENT_COLORS = [
  '#1E88E5',
  '#42A5F5',
  '#64B5F6',
  '#90CAF9',
  '#BBDEFB',
  '#1565C0',
  '#0D47A1',
  '#1976D2',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#0097A7',
];

function formatDate(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getOptionLabel(options: QuestionOption[] | undefined, optionId: string): string {
  return options?.find((o) => o.id === optionId)?.label || optionId;
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function ResponseViewer() {
  const { routeParams, getSurvey, getSurveyResponses, navigate } = useSurveyStore();
  const surveyId = routeParams.id;
  const survey = getSurvey(surveyId);
  const responses = survey ? getSurveyResponses(surveyId) : [];

  const handleExportCsv = () => {
    if (!survey) return;

    const headers = ['序号', '提交时间', ...survey.questions.map((q) => q.title)];
    const rows = responses.map((r, idx) => {
      const row: string[] = [(idx + 1).toString(), formatDate(r.submittedAt)];
      survey.questions.forEach((q) => {
        const answer = r.answers.find((a) => a.questionId === q.id);
        if (!answer) {
          row.push('');
        } else if (q.type === QuestionType.TEXT) {
          row.push(answer.value as string);
        } else if (q.type === QuestionType.SINGLE_CHOICE) {
          row.push(getOptionLabel(q.options, answer.value as string));
        } else {
          const labels = (answer.value as string[]).map((id) =>
            getOptionLabel(q.options, id),
          );
          row.push(labels.join(','));
        }
      });
      return row.map(escapeCsv).join(',');
    });

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${survey.title}_回复.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getChoiceStats = (question: Question) => {
    const counts: Record<string, number> = {};
    question.options?.forEach((o) => (counts[o.id] = 0));

    responses.forEach((r) => {
      const answer = r.answers.find((a) => a.questionId === question.id);
      if (!answer) return;
      if (question.type === QuestionType.SINGLE_CHOICE) {
        if (typeof answer.value === 'string' && counts[answer.value] !== undefined) {
          counts[answer.value]++;
        }
      } else if (question.type === QuestionType.MULTIPLE_CHOICE) {
        if (Array.isArray(answer.value)) {
          answer.value.forEach((id) => {
            if (counts[id] !== undefined) counts[id]++;
          });
        }
      }
    });

    return counts;
  };

  const renderChoiceChart = (question: Question, index: number) => {
    const counts = getChoiceStats(question);
    const labels = question.options?.map((o) => o.label) || [];
    const dataValues = question.options?.map((o) => counts[o.id]) || [];
    const total = dataValues.reduce((sum, v) => sum + v, 0);

    const chartData: ChartData<'doughnut'> = {
      labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: labels.map((_, i) => BLUE_GRADIENT_COLORS[i % BLUE_GRADIENT_COLORS.length]),
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };

    const options: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            generateLabels: (chart) => {
              const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
              const labelsOriginal = original(chart);
              return labelsOriginal.map((l, i) => {
                const value = dataValues[i] || 0;
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return {
                  ...l,
                  text: `${l.text} ${percent}% (${value})`,
                };
              });
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${context.label}: ${value} 次 (${percent}%)`;
            },
          },
        },
      },
    };

    return (
      <div key={question.id} className="mb-8 last:mb-0">
        <div className="mb-4">
          <span className="font-medium">
            {index + 1}. {question.title}
          </span>
          {question.required && <span className="required-mark">*</span>}
        </div>
        <div className="max-w-md mx-auto">
          <Doughnut data={chartData} options={options} />
        </div>
      </div>
    );
  };

  const renderTextResponses = (question: Question, index: number) => {
    const textAnswers: Array<{ content: string; submittedAt: Date }> = [];
    responses.forEach((r) => {
      const answer = r.answers.find((a) => a.questionId === question.id);
      if (answer && typeof answer.value === 'string' && answer.value.trim().length > 0) {
        textAnswers.push({ content: answer.value, submittedAt: r.submittedAt });
      }
    });

    return (
      <div key={question.id} className="mb-8 last:mb-0">
        <div className="mb-4">
          <span className="font-medium">
            {index + 1}. {question.title}
          </span>
          {question.required && <span className="required-mark">*</span>}
        </div>
        {textAnswers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无文本回答</div>
        ) : (
          <div className="space-y-3">
            {textAnswers.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    回复 #{idx + 1}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(item.submittedAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderQuestionStats = (question: Question, index: number) => {
    if (question.type === QuestionType.TEXT) {
      return renderTextResponses(question, index);
    }
    return renderChoiceChart(question, index);
  };

  if (!survey) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 h-14 flex items-center px-4">
          <button
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold ml-2">问卷详情</h1>
        </div>
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-2">问卷不存在</div>
            <RippleButton variant="primary" onClick={() => navigate('/')}>
              返回首页
            </RippleButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 h-14 flex items-center px-4">
        <button
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold ml-2">问卷详情</h1>
      </div>

      <div className="p-4 max-w-4xl mx-auto pb-8">
        <div
          className="bg-white p-6 mb-4 fade-in"
          style={{ borderRadius: '12px' }}
        >
          <h1 className="text-xl font-bold mb-2">{survey.title}</h1>
          <p className="text-sm text-gray-500 mb-4">{survey.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div>创建时间：{formatDate(survey.createdAt)}</div>
            <div>回复数：<span className="font-medium text-primary">{responses.length}</span></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <RippleButton
            variant="secondary"
            onClick={() => navigate('/fill', { id: surveyId })}
          >
            填写问卷
          </RippleButton>
          <RippleButton
            variant="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            导出CSV
          </RippleButton>
        </div>

        {responses.length === 0 ? (
          <div
            className="bg-white p-12 text-center fade-in"
            style={{ borderRadius: '12px' }}
          >
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 text-lg">暂无回复数据</p>
          </div>
        ) : (
          <div
            className="bg-white p-6 fade-in"
            style={{ borderRadius: '12px' }}
          >
            {survey.questions.map((q, idx) => renderQuestionStats(q, idx))}
          </div>
        )}
      </div>
    </div>
  );
}
