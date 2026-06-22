import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Check } from 'lucide-react';
import type { Question, Option } from '../../types';

interface QuestionEditorProps {
  onSave: (question: Question) => void;
  initialQuestion?: Question | null;
}

const createEmptyOption = (): Option => ({
  id: uuidv4(),
  text: '',
});

const createDefaultQuestion = (): Question => ({
  id: uuidv4(),
  title: '',
  options: [createEmptyOption(), createEmptyOption()],
  correctOptionIndex: 0,
});

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  onSave,
  initialQuestion,
}) => {
  const [question, setQuestion] = useState<Question>(() =>
    initialQuestion || createDefaultQuestion()
  );

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    } else {
      setQuestion(createDefaultQuestion());
    }
  }, [initialQuestion]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion((prev) => ({ ...prev, title: e.target.value }));
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === optionId ? { ...opt, text } : opt
      ),
    }));
  };

  const handleAddOption = () => {
    if (question.options.length < 6) {
      setQuestion((prev) => ({
        ...prev,
        options: [...prev.options, createEmptyOption()],
      }));
    }
  };

  const handleDeleteOption = (optionId: string) => {
    if (question.options.length > 2) {
      const deleteIndex = question.options.findIndex(
        (opt) => opt.id === optionId
      );
      const newOptions = question.options.filter((opt) => opt.id !== optionId);
      let newCorrectIndex = question.correctOptionIndex;
      if (question.correctOptionIndex === deleteIndex) {
        newCorrectIndex = 0;
      } else if (question.correctOptionIndex > deleteIndex) {
        newCorrectIndex -= 1;
      }
      setQuestion((prev) => ({
        ...prev,
        options: newOptions,
        correctOptionIndex: newCorrectIndex,
      }));
    }
  };

  const handleSetCorrect = (index: number) => {
    setQuestion((prev) => ({
      ...prev,
      correctOptionIndex: index,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid =
      question.title.trim() !== '' &&
      question.options.every((opt) => opt.text.trim() !== '');
    if (isValid) {
      onSave({ ...question, id: uuidv4() });
      setQuestion(createDefaultQuestion());
    }
  };

  const isValid =
    question.title.trim() !== '' &&
    question.options.length >= 2 &&
    question.options.length <= 6 &&
    question.options.every((opt) => opt.text.trim() !== '');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          题目标题
        </label>
        <input
          type="text"
          value={question.title}
          onChange={handleTitleChange}
          placeholder="请输入题目标题..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-800 focus:border-transparent transition-all duration-200 outline-none text-[14px] font-roboto"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选项列表
        </label>
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <div
              key={option.id}
              className="flex items-center gap-3 group transition-all duration-300 animate-[fadeIn_0.3s_ease-out]"
            >
              <button
                type="button"
                onClick={() => handleSetCorrect(index)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  question.correctOptionIndex === index
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {question.correctOptionIndex === index && (
                  <Check size={16} />
                )}
              </button>
              <span className="text-sm text-gray-500 w-6">
                {String.fromCharCode(65 + index)}.
              </span>
              <input
                type="text"
                value={option.text}
                onChange={(e) =>
                  handleOptionTextChange(option.id, e.target.value)
                }
                placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-800 focus:border-transparent transition-all duration-200 outline-none text-[14px] font-roboto ${
                  question.correctOptionIndex === index
                    ? 'bg-green-50 border-green-300'
                    : 'border-gray-300'
                }`}
              />
              {question.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleDeleteOption(option.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
        {question.options.length < 6 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="mt-2 flex items-center gap-2 px-4 py-2 text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <Plus size={18} />
            添加选项
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
          isValid
            ? 'bg-[#1a237e] text-white hover:bg-[#283593] active:scale-[0.98]'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        保存题目
      </button>
    </form>
  );
};
