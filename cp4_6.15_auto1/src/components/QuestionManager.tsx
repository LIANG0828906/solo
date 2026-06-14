import { useState, useRef } from 'react';
import { useStore } from '@/store';
import type { Question, Keyword } from '@/types';
import {
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Save,
  X,
  BookOpen,
} from 'lucide-react';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function KeywordEditor({
  keywords,
  onChange,
}: {
  keywords: Keyword[];
  onChange: (kws: Keyword[]) => void;
}) {
  const add = () => onChange([...keywords, { word: '', scorePoint: 1 }]);
  const remove = (i: number) => onChange(keywords.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof Keyword, val: string | number) => {
    const next = [...keywords];
    next[i] = { ...next[i], [field]: field === 'scorePoint' ? Number(val) : val };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#546e7a]">关键词与得分点</span>
        <button
          type="button"
          onClick={add}
          className="text-xs text-[#00695c] hover:text-[#004d40] flex items-center gap-1"
          style={{ minHeight: 44, minWidth: 44 }}
        >
          <Plus size={14} /> 添加关键词
        </button>
      </div>
      {keywords.map((kw, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            value={kw.word}
            onChange={(e) => update(i, 'word', e.target.value)}
            placeholder="关键词"
            className="flex-1 px-3 py-2 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] focus:ring-1 focus:ring-[#00695c]/20 outline-none transition-all"
          />
          <input
            type="number"
            value={kw.scorePoint}
            onChange={(e) => update(i, 'scorePoint', e.target.value)}
            min={0}
            step={0.5}
            className="w-20 px-3 py-2 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] focus:ring-1 focus:ring-[#00695c]/20 outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="p-2 text-[#ef5350] hover:bg-red-50 rounded-lg transition-colors"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function QuestionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Question;
  onSave: (q: Question) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial?.text || '');
  const [referenceAnswer, setReferenceAnswer] = useState(initial?.referenceAnswer || '');
  const [keywords, setKeywords] = useState<Keyword[]>(initial?.keywords || []);
  const [maxScore, setMaxScore] = useState(initial?.maxScore || 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSave({
      id: initial?.id || generateId(),
      text: text.trim(),
      referenceAnswer: referenceAnswer.trim(),
      keywords: keywords.filter((k) => k.word.trim()),
      maxScore,
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#546e7a] mb-1">题目文本</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] focus:ring-1 focus:ring-[#00695c]/20 outline-none transition-all resize-y"
          placeholder="请输入简答题题目..."
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#546e7a] mb-1">参考答案</label>
        <textarea
          value={referenceAnswer}
          onChange={(e) => setReferenceAnswer(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] focus:ring-1 focus:ring-[#00695c]/20 outline-none transition-all resize-y"
          placeholder="请输入参考答案..."
        />
      </div>
      <KeywordEditor keywords={keywords} onChange={setKeywords} />
      <div>
        <label className="block text-xs font-medium text-[#546e7a] mb-1">满分值</label>
        <input
          type="number"
          value={maxScore}
          onChange={(e) => setMaxScore(Number(e.target.value))}
          min={1}
          className="w-32 px-3 py-2 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] focus:ring-1 focus:ring-[#00695c]/20 outline-none transition-all"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#00695c] text-white text-sm rounded-lg hover:bg-[#004d40] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
          style={{ minHeight: 44 }}
        >
          <Save size={16} /> 保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#546e7a] text-sm rounded-lg border border-[#b2dfdb] hover:bg-[#e0f7fa] hover:-translate-y-0.5 transition-all duration-200"
          style={{ minHeight: 44 }}
        >
          <X size={16} /> 取消
        </button>
      </div>
    </form>
  );
}

function QuestionCard({ question }: { question: Question }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const { updateQuestion, deleteQuestion } = useStore();

  return (
    <div className="bg-white rounded-xl border border-[#b2dfdb]/40 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-sm font-medium text-[#37474f] truncate">{question.text}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-[#80cbc4]">满分 {question.maxScore}</span>
            <span className="text-xs text-[#80cbc4]">
              关键词 {question.keywords.length} 个
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(!editing);
            }}
            className="p-2 text-[#546e7a] hover:text-[#00695c] hover:bg-[#e0f7fa] rounded-lg transition-colors"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('确定删除此题目？')) deleteQuestion(question.id);
            }}
            className="p-2 text-[#546e7a] hover:text-[#ef5350] hover:bg-red-50 rounded-lg transition-colors"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <Trash2 size={16} />
          </button>
          {expanded ? <ChevronUp size={18} className="text-[#80cbc4]" /> : <ChevronDown size={18} className="text-[#80cbc4]" />}
        </div>
      </div>

      {(expanded || editing) && (
        <div className="px-4 pb-4 border-t border-[#b2dfdb]/30">
          {editing ? (
            <div className="pt-3">
              <QuestionForm
                initial={question}
                onSave={(q) => {
                  updateQuestion(q);
                  setEditing(false);
                }}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <div className="pt-3 space-y-3">
              <div>
                <span className="text-xs font-medium text-[#546e7a]">参考答案</span>
                <p className="mt-1 text-sm text-[#37474f] bg-[#e0f7fa]/40 rounded-lg p-3">
                  {question.referenceAnswer || '未设置'}
                </p>
              </div>
              {question.keywords.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-[#546e7a]">关键词</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {question.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#b2dfdb]/30 text-[#00695c] text-xs rounded-full"
                      >
                        {kw.word}
                        <span className="text-[#80cbc4]">({kw.scorePoint}分)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuestionManager() {
  const { questions, addQuestion, importQuestions } = useStore();
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          importQuestions(data);
        }
      } catch {
        alert('JSON格式无效');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#00695c]">题目管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#00695c] text-white text-sm rounded-lg hover:bg-[#004d40] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            style={{ minHeight: 44 }}
          >
            <Plus size={16} /> 添加题目
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2.5 bg-white text-[#00695c] text-sm rounded-lg border border-[#b2dfdb] hover:bg-[#e0f7fa] hover:-translate-y-0.5 transition-all duration-200"
            style={{ minHeight: 44 }}
          >
            <Download size={16} /> 导出
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2.5 bg-white text-[#00695c] text-sm rounded-lg border border-[#b2dfdb] hover:bg-[#e0f7fa] hover:-translate-y-0.5 transition-all duration-200"
            style={{ minHeight: 44 }}
          >
            <Upload size={16} /> 导入
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-[#b2dfdb]/40 shadow-sm p-5 mb-6 animate-fadeIn">
          <QuestionForm
            onSave={(q) => {
              addQuestion(q);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {questions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#e0f7fa] rounded-full flex items-center justify-center">
            <BookOpen size={28} className="text-[#80cbc4]" />
          </div>
          <p className="text-[#546e7a] text-sm">暂无题目，点击上方按钮添加</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
