import type { ChangeEvent } from 'react';

interface ResumeInputProps {
  value: string;
  onChange: (v: string) => void;
  onParse: () => void;
  isParsing: boolean;
  parseProgress: number;
  fading: boolean;
  mobileOpen?: boolean;
  isMobile?: boolean;
}

export function ResumeInput({
  value,
  onChange,
  onParse,
  isParsing,
  parseProgress,
  fading,
  mobileOpen,
  isMobile
}: ResumeInputProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const placeholderText =
    '请在此粘贴您的简历文本内容…\n\n建议包含：\n- 基本信息\n- 专业技能\n- 工作经历（公司 / 职位 / 起止年月 / 项目描述）\n- 项目经验\n- 教育背景\n\n示例格式：\n张三 | 高级前端工程师\n2021.03 - 至今  XX科技有限公司  |  前端高级工程师\n负责电商平台H5端和后台管理系统的开发与维护...\n\n技能：React, Vue, TypeScript, Webpack, Node.js, MySQL...';

  return (
    <aside
      className={`left-panel ${fading ? 'fading' : ''} ${
        isMobile && mobileOpen ? 'open' : ''
      }`}
    >
      <h2 className="left-title">粘贴简历文本</h2>
      <p className="left-hint">
        💡 支持任意格式的纯文本简历，系统会自动提取技能标签、工作经历和项目信息。解析结果保存在本地浏览器。
      </p>
      <textarea
        className="resume-textarea"
        value={value}
        onChange={handleChange}
        placeholder={placeholderText}
        spellCheck={false}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          className="parse-btn"
          onClick={onParse}
          disabled={isParsing || !value.trim()}
        >
          {isParsing ? '解析中…' : '✨ 开始解析'}
        </button>
        {isParsing && (
          <>
            <div className="progress-wrap">
              <div
                className="progress-bar"
                style={{ width: `${Math.max(4, parseProgress)}%` }}
              />
            </div>
            <div className="progress-label">
              <span>智能拆解中，请稍候</span>
              <span>{parseProgress}%</span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default ResumeInput;
