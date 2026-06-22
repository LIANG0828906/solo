import { useState } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useFlowStore, FlowNode, ActionType } from '@/store/flowStore';

const SAMPLE_RECIPE = `红烧肉

材料：五花肉500g、生姜3片、大葱1根、八角2个、桂皮1小块、料酒2勺、酱油3勺、冰糖30g、盐适量

步骤1：将五花肉切成3厘米见方的块，冷水下锅焯水5分钟，捞出沥干。
步骤2：锅中放少许油，加入冰糖小火炒至焦糖色，约3分钟。
步骤3：放入焯好的五花肉翻炒上色，加入料酒、酱油调味，翻炒2分钟。
步骤4：加入生姜、大葱、八角、桂皮，倒入开水没过肉块，大火煮开后转小火炖60分钟。
步骤5：大火收汁至汤汁浓稠，调入适量盐，翻炒1分钟即可出锅。`;

interface ParseStep {
  stepNumber: number;
  description: string;
  ingredients: string[];
  tools: string[];
  duration: string;
  actionType: ActionType;
}

interface ParseResponse {
  steps: ParseStep[];
}

export default function RecipeInput() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setNodes = useFlowStore((s) => s.setNodes);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post<ParseResponse>('/api/parse', { text });
      const flowNodes: FlowNode[] = res.data.steps.map((step) => ({
        id: uuidv4(),
        stepNumber: step.stepNumber,
        description: step.description,
        ingredients: step.ingredients,
        tools: step.tools,
        duration: step.duration,
        actionType: step.actionType,
        x: 220,
        y: step.stepNumber * 140,
        isNew: true,
      }));
      setNodes(flowNodes);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '解析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFF8E1] h-full overflow-y-auto p-6">
      <div className="bg-white rounded-[14px] shadow-card p-6 max-w-lg mx-auto">
        <h2 className="font-display text-2xl text-warm-700 mb-4">食谱输入</h2>

        <textarea
          className="w-full bg-warm-50 rounded-[14px] p-4 min-h-[200px] resize-y outline-none text-sm text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-warm-300"
          placeholder={"请在此输入食谱内容...\n\n支持格式：\n1. 纯文本步骤描述\n2. Markdown格式\n3. 编号列表（1. 2. 3.或步骤1 步骤2）"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            className="bg-warm-500 text-white rounded-lg px-6 py-2.5 btn-press hover:bg-warm-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={handleParse}
            disabled={loading || !text.trim()}
          >
            {loading ? '解析中...' : '解析食谱'}
          </button>

          <button
            className="bg-warm-100 text-warm-700 border border-warm-300 rounded-lg px-6 py-2.5 btn-press hover:bg-warm-200 transition-colors"
            onClick={() => setText(SAMPLE_RECIPE)}
            disabled={loading}
          >
            示例食谱
          </button>
        </div>
      </div>
    </div>
  );
}
