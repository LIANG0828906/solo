import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Code } from "lucide-react";

interface Example {
  input: string;
  output: string;
}

interface ProblemPanelProps {
  title: string;
  description: string;
  examples: Example[];
  constraints?: string[];
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="relative mt-2 mb-4">
      <div className="absolute top-2 left-2 text-xs text-arena-textMuted font-mono bg-arena-bg px-2 py-1 rounded">
        {language || "code"}
      </div>
      <pre className="bg-arena-bg border border-arena-border rounded-lg p-4 pt-8 overflow-x-auto">
        <code className="text-arena-text font-mono text-sm whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

export default function ProblemPanel({ title, description, examples, constraints }: ProblemPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 bg-arena-card hover:bg-arena-border/30 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-arena-accent" />
          <h2 className="text-lg font-bold text-arena-text">{title}</h2>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-arena-textMuted" />
        ) : (
          <ChevronUp className="w-5 h-5 text-arena-textMuted" />
        )}
      </button>

      {!isCollapsed && (
        <div className="p-4 border-t border-arena-border space-y-4 max-h-96 overflow-y-auto">
          <div>
            <h3 className="text-arena-accent font-semibold mb-2">题目描述</h3>
            <p className="text-arena-text leading-relaxed whitespace-pre-line">{description}</p>
          </div>

          {examples.length > 0 && (
            <div>
              <h3 className="text-arena-accent font-semibold mb-2">示例</h3>
              {examples.map((example, index) => (
                <div key={index} className="mb-4">
                  <p className="text-arena-textMuted text-sm font-medium mb-1">
                    示例 {index + 1}:
                  </p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-arena-success text-sm font-medium">输入:</span>
                      <CodeBlock code={example.input} language="input" />
                    </div>
                    <div>
                      <span className="text-arena-success text-sm font-medium">输出:</span>
                      <CodeBlock code={example.output} language="output" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {constraints && constraints.length > 0 && (
            <div>
              <h3 className="text-arena-accent font-semibold mb-2">提示</h3>
              <ul className="list-disc list-inside space-y-1">
                {constraints.map((constraint, index) => (
                  <li key={index} className="text-arena-text text-sm">
                    {constraint}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
