import { useState } from 'react';
import { motion } from 'framer-motion';
import { TechDebtItem, SeverityLevel } from '@/types';

const severityColors: Record<SeverityLevel, string> = {
  critical: '#E53935',
  high: '#FB8C00',
  medium: '#FDD835',
  low: '#C0CA33',
};

const severityLabels: Record<SeverityLevel, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
};

interface TechDebtFormProps {
  onSubmit: (data: Omit<TechDebtItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
}

export default function TechDebtForm({ onSubmit }: TechDebtFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [filePath, setFilePath] = useState('');
  const [lineNumber, setLineNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = '标题不能为空';
    } else if (title.length > 30) {
      newErrors.title = '标题不能超过30字';
    }
    if (!description.trim()) {
      newErrors.description = '描述不能为空';
    } else if (description.length > 300) {
      newErrors.description = '描述不能超过300字';
    }
    if (estimatedHours < 0.5 || estimatedHours > 40) {
      newErrors.estimatedHours = '预估工时必须在0.5-40小时之间';
    }
    if (lineNumber && (isNaN(Number(lineNumber)) || Number(lineNumber) < 1)) {
      newErrors.lineNumber = '行号必须是正整数';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const codeReferences = filePath.trim()
      ? [{ filePath: filePath.trim(), lineNumber: lineNumber ? Number(lineNumber) : undefined }]
      : [];

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      severity,
      estimatedHours,
      codeReferences,
    });

    setTitle('');
    setDescription('');
    setSeverity('medium');
    setEstimatedHours(1);
    setFilePath('');
    setLineNumber('');
    setErrors({});
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value)) {
      setEstimatedHours(Math.round(value * 2) / 2);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#E0E0E0] mb-1.5">
          标题
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={30}
          className={`w-full px-3 py-2 bg-[#1E1E1E] border ${
            errors.title ? 'border-red-500' : 'border-[#3D3D3D]'
          } rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#1976D2] transition-colors`}
          placeholder="输入技术债务标题..."
        />
        <div className="flex justify-between mt-1">
          {errors.title && (
            <span className="text-xs text-red-400">{errors.title}</span>
          )}
          <span className="text-xs text-[#9E9E9E] ml-auto">{title.length}/30</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#E0E0E0] mb-1.5">
          描述
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          rows={4}
          className={`w-full px-3 py-2 bg-[#1E1E1E] border ${
            errors.description ? 'border-red-500' : 'border-[#3D3D3D]'
          } rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#1976D2] transition-colors resize-none`}
          placeholder="详细描述技术债务..."
        />
        <div className="flex justify-between mt-1">
          {errors.description && (
            <span className="text-xs text-red-400">{errors.description}</span>
          )}
          <span className="text-xs text-[#9E9E9E] ml-auto">{description.length}/300</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#E0E0E0] mb-3">
          严重等级
        </label>
        <div className="flex gap-4">
          {(Object.keys(severityColors) as SeverityLevel[]).map((level) => (
            <label
              key={level}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="severity"
                value={level}
                checked={severity === level}
                onChange={() => setSeverity(level)}
                className="sr-only"
              />
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  severity === level
                    ? 'scale-110'
                    : 'opacity-60 group-hover:opacity-100'
                }`}
                style={{
                  backgroundColor: severity === level ? severityColors[level] : 'transparent',
                  borderColor: severityColors[level],
                }}
              />
              <span
                className={`text-sm ${
                  severity === level ? 'text-[#E0E0E0]' : 'text-[#9E9E9E]'
                }`}
              >
                {severityLabels[level]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#E0E0E0] mb-3">
          预估工时: {estimatedHours} 小时
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0.5"
            max="40"
            step="0.5"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(Number(e.target.value))}
            className="flex-1 h-2 bg-[#3D3D3D] rounded-lg appearance-none cursor-pointer accent-[#1976D2]"
          />
          <input
            type="number"
            min="0.5"
            max="40"
            step="0.5"
            value={estimatedHours}
            onChange={handleHoursChange}
            className={`w-20 px-2 py-1.5 bg-[#1E1E1E] border ${
              errors.estimatedHours ? 'border-red-500' : 'border-[#3D3D3D]'
            } rounded-lg text-[#E0E0E0] text-center focus:outline-none focus:border-[#1976D2] transition-colors`}
          />
        </div>
        {errors.estimatedHours && (
          <span className="text-xs text-red-400 mt-1 block">
            {errors.estimatedHours}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[#E0E0E0] mb-1.5">
            文件路径 <span className="text-[#9E9E9E]">(可选)</span>
          </label>
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#3D3D3D] rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#1976D2] transition-colors"
            placeholder="src/utils/..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#E0E0E0] mb-1.5">
            行号 <span className="text-[#9E9E9E]">(可选)</span>
          </label>
          <input
            type="number"
            value={lineNumber}
            onChange={(e) => setLineNumber(e.target.value)}
            min="1"
            className={`w-full px-3 py-2 bg-[#1E1E1E] border ${
              errors.lineNumber ? 'border-red-500' : 'border-[#3D3D3D]'
            } rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#1976D2] transition-colors`}
            placeholder="123"
          />
          {errors.lineNumber && (
            <span className="text-xs text-red-400 mt-1 block">
              {errors.lineNumber}
            </span>
          )}
        </div>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 px-4 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
        style={{ backgroundColor: '#1976D2' }}
      >
        创建技术债务
      </motion.button>
    </form>
  );
}
