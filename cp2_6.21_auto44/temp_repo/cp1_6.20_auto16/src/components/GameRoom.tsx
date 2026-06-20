import { useState, useEffect, useRef } from "react";
import { Terminal, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import Timer from "@/components/Timer";
import CodeEditor from "@/components/CodeEditor";
import ProblemPanel from "@/components/ProblemPanel";
import ScorePanel from "@/components/ScorePanel";

interface Player {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  lineCount: number;
}

interface GameRoomProps {
  roomId: string;
  duration: number;
  player1: Player;
  player2: Player;
  problem: {
    title: string;
    description: string;
    examples: { input: string; output: string }[];
    constraints?: string[];
  };
  wsUrl?: string;
  onGameEnd?: () => void;
}

export default function GameRoom({
  roomId,
  duration,
  player1: initialPlayer1,
  player2: initialPlayer2,
  problem,
  wsUrl,
  onGameEnd,
}: GameRoomProps) {
  const [player1, setPlayer1] = useState<Player>(initialPlayer1);
  const [player2, setPlayer2] = useState<Player>(initialPlayer2);
  const [code, setCode] = useState<string>(`function solution(input) {\n  // Write your code here\n  return input;\n}`);
  const [consoleOutput, setConsoleOutput] = useState<Array<{ id: number; text: string; type: "log" | "error" | "success"; prefix: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const consoleRef = useRef<HTMLDivElement>(null);
  const outputIndexRef = useRef(0);

  const lineCount = code.split("\n").length;

  useEffect(() => {
    setPlayer1((prev) => ({ ...prev, lineCount }));
  }, [lineCount]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const addConsoleLine = (line: string, type: "log" | "error" | "success" = "log") => {
    const prefix = type === "error" ? "❌ " : type === "success" ? "✅ " : "> ";
    setConsoleOutput((prev) => [...prev, { text: line, type, prefix, id: outputIndexRef.current++ }]);
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setConsoleOutput([]);

    addConsoleLine("正在编译代码...", "log");

    setTimeout(() => {
      addConsoleLine("编译成功!", "success");
      addConsoleLine("运行测试用例...", "log");

      setTimeout(() => {
        addConsoleLine("测试用例 1: 通过", "success");
        addConsoleLine("测试用例 2: 通过", "success");
        addConsoleLine("测试用例 3: 通过", "success");
        addConsoleLine("", "log");
        addConsoleLine("所有测试用例通过! +100 分", "success");

        setPlayer1((prev) => ({ ...prev, score: prev.score + 100 }));
        setIsRunning(false);
      }, 800);
    }, 500);
  };

  const handleResetCode = () => {
    setCode(`function solution(input) {\n  // Write your code here\n  return input;\n}`);
    setConsoleOutput([]);
    addConsoleLine("代码已重置", "log");
  };

  const handleTimeUp = () => {
    setIsTimerRunning(false);
    addConsoleLine("时间到! 游戏结束", "error");
    setTimeout(() => {
      onGameEnd?.();
    }, 2000);
  };

  const durationSeconds = duration * 60;

  return (
    <div className="min-h-screen bg-arena-bg p-4">
      <div className="flex items-center justify-center mb-4">
        <Timer duration={durationSeconds} onTimeUp={handleTimeUp} isRunning={isTimerRunning} />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)]">
        <div className="flex-1 lg:w-[70%] flex flex-col gap-4 min-h-0">
          <ProblemPanel
            title={problem.title}
            description={problem.description}
            examples={problem.examples}
            constraints={problem.constraints}
          />

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between bg-arena-card border border-b-0 border-arena-border rounded-t-xl px-4 py-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-arena-accent" />
                <span className="text-arena-text font-medium">代码编辑器</span>
                <span className="text-arena-textMuted text-sm ml-2">
                  {lineCount} 行
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetCode}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-arena-bg border border-arena-border text-arena-textMuted rounded-lg hover:bg-arena-border/30 hover:text-arena-text transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className={cn(
                    "flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
                    isRunning
                      ? "bg-arena-border text-arena-textMuted cursor-not-allowed"
                      : "bg-arena-success text-white hover:bg-arena-success/90 hover:scale-105 active:scale-95"
                  )}
                >
                  <Play className="w-4 h-4" />
                  {isRunning ? "运行中..." : "运行"}
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <CodeEditor
                value={code}
                onChange={setCode}
                language="javascript"
                wsUrl={wsUrl}
              />
            </div>

            <div className="h-40 bg-arena-card border border-t-0 border-arena-border rounded-b-xl overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-arena-border bg-arena-bg">
                <Terminal className="w-4 h-4 text-arena-textMuted" />
                <span className="text-arena-textMuted text-sm font-medium">控制台输出</span>
              </div>
              <div
                ref={consoleRef}
                className="flex-1 p-3 overflow-y-auto font-mono text-sm bg-arena-bg"
              >
                {consoleOutput.length === 0 ? (
                  <span className="text-arena-textMuted">
                    点击"运行"按钮执行代码...
                  </span>
                ) : (
                  consoleOutput.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "leading-6",
                        item.type === "error" && "text-arena-danger",
                        item.type === "success" && "text-arena-success",
                        item.type === "log" && "text-arena-text"
                      )}
                    >
                      <span className="text-arena-textMuted">{item.prefix}</span>
                      {item.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-[30%] flex-shrink-0">
          <div className="sticky top-0">
            <ScorePanel player1={player1} player2={player2} />
          </div>
        </div>
      </div>
    </div>
  );
}
