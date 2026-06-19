import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, History, AlertCircle } from 'lucide-react';
import { ErrorHighlighter } from '@/components/ErrorHighlighter';
import { StructureChart } from '@/components/StructureChart';
import { ScoreRadar } from '@/components/ScoreRadar';
import { HistoryTrend } from '@/components/HistoryTrend';
import { Accordion } from '@/components/Accordion';
import { essayApi } from '@/services/api';
import { useEssayStore } from '@/stores/essayStore';
import type { EssaySubmission } from '@/types';

const DEFAULT_ESSAY = `信息技术的发展深刻改变了我们的生活方式。

在教育领域，在线学习平台让知识获取变得更加便捷。学生们可以随时随地访问优质的教育资源，不受时间和空间的限制。同时，人工智能技术也在辅助教学中发挥重要作用，例如智能批改系统可以帮助教师减轻工作负担。

然而，技术的发展也带来了一些挑战。过度依赖网络可能导致学生专注力下降，信息爆炸的时代也需要我们具备更强的信息筛选能力。

总之，我们需要在享受技术便利的同时，保持独立思考的能力。`;

export function StudentPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('我的第一篇作文');
  const [content, setContent] = useState(DEFAULT_ESSAY);
  const [submission, setSubmission] = useState<EssaySubmission | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const {
    precheckErrors,
    history,
    isSubmitting,
    isPrechecking,
    setPrecheckErrors,
    setHistory,
    setIsSubmitting,
    setIsPrechecking,
    addToHistory,
  } = useEssayStore();

  const handleEditorChange = useCallback((_html: string, text: string) => {
    setContent(text);
  }, []);

  const handlePrecheck = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setPrecheckErrors([]);
        return;
      }

      setIsPrechecking(true);
      try {
        const errors = await essayApi.precheck(text);
        setPrecheckErrors(errors);
      } catch {
        // 预检失败静默处理
      } finally {
        setIsPrechecking(false);
      }
    },
    [setPrecheckErrors, setIsPrechecking]
  );

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await essayApi.submitEssay({ title, content });
      setSubmission(result);
      addToHistory(result);
    } catch {
      // 提交失败，使用 mock 数据演示
      const mockResult = createMockSubmission(title, content);
      setSubmission(mockResult);
      addToHistory(mockResult);
    } finally {
      setIsSubmitting(false);
    }
  }, [title, content, setIsSubmitting, addToHistory]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await essayApi.getHistory(10);
        if (data.length > 0) {
          setHistory(data);
        }
      } catch {
        // 历史记录加载失败
      }
    };
    loadHistory();
  }, [setHistory]);

  const errors = submission?.errors || precheckErrors;
  const structure = submission?.structure;
  const scores = submission?.scores;

  const feedbackItems = [
    {
      id: 'structure',
      title: '文章结构',
      icon: <AlertCircle size={18} />,
      content: structure ? <StructureChart structure={structure} /> : <EmptyPanel text="提交后查看结构分析" />,
      defaultOpen: true,
    },
    {
      id: 'score',
      title: '综合评分',
      content: scores ? <ScoreRadar scores={scores} /> : <EmptyPanel text="提交后查看评分" />,
      defaultOpen: true,
    },
    {
      id: 'history',
      title: '历史记录',
      badge: history.length,
      content: <HistoryTrend history={history} />,
      defaultOpen: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          <h1 className="text-lg font-semibold text-gray-800 flex-1">
            学生端 · 作文批改
          </h1>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
          >
            <History size={20} className="text-gray-600" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="bg-white rounded-xl p-4 border border-amber-100">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入作文标题..."
                className="w-full text-xl font-semibold text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="bg-white rounded-xl p-4 border border-amber-100 min-h-[500px]">
              <ErrorHighlighter
                content={content}
                errors={errors}
                onChange={handleEditorChange}
                onPrecheck={handlePrecheck}
                isPrechecking={isPrechecking}
                editable={!isSubmitting}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="px-6 py-3 bg-[#FF7043] text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
              >
                <Send size={18} />
                {isSubmitting ? '正在批改...' : '提交批改'}
              </button>
            </div>
          </div>

          <aside className="w-full lg:w-96 flex-shrink-0 space-y-4">
            <div className="hidden lg:block space-y-4">
              {structure && <StructureChart structure={structure} />}
              {scores && <ScoreRadar scores={scores} />}
              {!structure && !scores && (
                <div className="bg-[#E3F2FD] rounded-xl p-6 text-center">
                  <p className="text-gray-600 mb-2">提交作文后即可查看</p>
                  <p className="text-sm text-gray-500">
                    结构分析 · 综合评分 · 历史趋势
                  </p>
                </div>
              )}
              {history.length > 0 && <HistoryTrend history={history} />}
            </div>

            <div className="lg:hidden">
              <Accordion items={feedbackItems} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-gray-400 text-sm">{text}</div>
  );
}

function createMockSubmission(title: string, content: string): EssaySubmission {
  const paragraphs = content.split('\n').filter((p) => p.trim().length > 0);
  const totalLength = content.length;

  const errors = [
    {
      id: 'e1',
      type: 'spelling' as const,
      text: '便捷',
      offset: content.indexOf('便捷'),
      length: 2,
      suggestion: '便利',
      message: '此处用词可更准确',
    },
    {
      id: 'e2',
      type: 'punctuation' as const,
      text: '。',
      offset: content.indexOf('。'),
      length: 1,
      suggestion: '；',
      message: '建议使用分号连接相关分句',
    },
    {
      id: 'e3',
      type: 'grammar' as const,
      text: '发挥重要作用',
      offset: content.indexOf('发挥重要作用'),
      length: 6,
      suggestion: '发挥着重要作用',
      message: '缺少动态助词，语气不够自然',
    },
  ].filter((e) => e.offset !== -1);

  const introLen = paragraphs[0]?.length || 0;
  const conclusionLen = paragraphs[paragraphs.length - 1]?.length || 0;
  const bodyLen = totalLength - introLen - conclusionLen;

  return {
    id: 'mock-' + Date.now(),
    title,
    content,
    submittedAt: new Date().toISOString(),
    errors,
    structure: {
      hasIntro: paragraphs.length >= 1,
      hasBody: paragraphs.length >= 3,
      hasConclusion: paragraphs.length >= 2,
      introPercent: totalLength > 0 ? (introLen / totalLength) * 100 : 0,
      bodyPercent: totalLength > 0 ? (bodyLen / totalLength) * 100 : 0,
      conclusionPercent: totalLength > 0 ? (conclusionLen / totalLength) * 100 : 0,
      suggestions: [
        '引言部分可增加背景介绍，引出主题',
        '正文段落建议增加具体事例支撑观点',
        '结论部分可升华主题，呼应开头',
      ],
    },
    scores: {
      grammar: 4,
      structure: 3,
      vocabulary: 4,
      relevance: 4,
      total: 78,
    },
  };
}

export default StudentPage;
