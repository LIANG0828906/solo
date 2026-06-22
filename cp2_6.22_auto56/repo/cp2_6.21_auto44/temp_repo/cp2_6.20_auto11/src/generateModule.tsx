import { useState, useCallback } from 'react';
import ConfigPanel from '@/components/ConfigPanel';
import QuestionCard from '@/components/QuestionCard';
import { generateQuestions, type GenerateRequest, type Question } from '@/utils/api';
import { useQuizStore } from '@/hooks/useQuizStore';
import { BookOpen } from 'lucide-react';

export default function GenerateModule() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const isGenerating = useQuizStore((s) => s.isGenerating);
  const setIsGenerating = useQuizStore((s) => s.setIsGenerating);

  const handleGenerate = useCallback(async (config: GenerateRequest) => {
    setIsGenerating(true);
    setQuestions([]);
    try {
      const res = await generateQuestions(config);
      setQuestions(res.questions);
    } catch {
      const fallbacks = generateFallbackQuestions(config);
      setQuestions(fallbacks);
    } finally {
      setIsGenerating(false);
    }
  }, [setIsGenerating]);

  return (
    <div className="generate-module">
      <aside className="sidebar">
        <ConfigPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
      </aside>
      <main className="content-area">
        {isGenerating && (
          <div className="loading-overlay">
            <div className="progress-bar-wrapper">
              <div className="progress-bar-animated" />
            </div>
            <p className="loading-text">AI正在生成题目，请稍候...</p>
          </div>
        )}
        {!isGenerating && questions.length === 0 && (
          <div className="empty-state">
            <BookOpen size={64} className="empty-icon" />
            <h3 className="empty-title">选择题型并配置参数</h3>
            <p className="empty-desc">在左侧面板选择题型、设置难度和数量，点击生成按钮开始</p>
          </div>
        )}
        {!isGenerating && questions.length > 0 && (
          <div className="questions-grid">
            {questions.map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function generateFallbackQuestions(config: GenerateRequest): Question[] {
  const tags = config.knowledge_tags.length > 0 ? config.knowledge_tags : ['通用'];
  const tag = tags[0];
  const diffLabels = ['', '入门', '基础', '进阶', '挑战', '高难'];
  const diffLabel = diffLabels[config.difficulty] || '基础';

  const templates: Record<string, Array<{ stem: string; options?: string[]; answer: string | string[]; explanation: string }>> = {
    choice: [
      { stem: `【${tag}】${diffLabel}级别-以下哪个选项是正确的？`, options: ['选项A', '选项B', '选项C', '选项D'], answer: 'A', explanation: '选项A是正确答案，因为根据相关理论推导可得。' },
      { stem: `【${tag}】${diffLabel}级别-关于该知识点，下列说法正确的是？`, options: ['说法一', '说法二', '说法三', '说法四'], answer: 'B', explanation: '选项B符合标准定义和基本原理。' },
      { stem: `【${tag}】${diffLabel}级别-以下哪项不属于该范畴？`, options: ['项目一', '项目二', '项目三', '项目四'], answer: 'C', explanation: '项目三不在该范畴内，其他三项均属于。' },
    ],
    multi_choice: [
      { stem: `【${tag}】${diffLabel}级别-以下哪些选项是正确的？（多选）`, options: ['选项A', '选项B', '选项C', '选项D'], answer: ['A', 'B'], explanation: '选项A和B均符合正确标准。' },
      { stem: `【${tag}】${diffLabel}级别-关于该知识点，下列哪些说法正确？（多选）`, options: ['说法一', '说法二', '说法三', '说法四'], answer: ['A', 'C', 'D'], explanation: 'A、C、D三项均正确，B项存在偏差。' },
    ],
    fill_blank: [
      { stem: `【${tag}】${diffLabel}级别-请填写：该概念的核心定义是____。`, answer: '核心概念', explanation: '这是该知识点的基础定义。' },
      { stem: `【${tag}】${diffLabel}级别-计算结果为：____。`, answer: '42', explanation: '经过推导计算得出该结果。' },
    ],
    true_false: [
      { stem: `【${tag}】${diffLabel}级别-该命题是正确的。`, answer: '正确', explanation: '根据相关定理，该命题成立。' },
      { stem: `【${tag}】${diffLabel}级别-以下判断是否正确：所有情况均适用。`, answer: '错误', explanation: '并非所有情况都适用，存在例外。' },
    ],
  };

  const pool = templates[config.question_type] || templates.choice;
  const result: Question[] = [];
  for (let i = 0; i < config.count; i++) {
    const t = pool[i % pool.length];
    result.push({
      id: crypto.randomUUID(),
      type: config.question_type,
      difficulty: config.difficulty,
      knowledge_tag: tag,
      stem: t.stem,
      options: t.options,
      answer: t.answer,
      explanation: t.explanation,
      created_at: new Date().toISOString(),
    });
  }
  return result;
}
