import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";

export default function UIPanel() {
  const seed = useGameStore((s) => s.seed);
  const playerHP = useGameStore((s) => s.playerHP);
  const monsters = useGameStore((s) => s.monsters);
  const battleLogs = useGameStore((s) => s.battleLogs);
  const gameOver = useGameStore((s) => s.gameOver);
  const gameWon = useGameStore((s) => s.gameWon);
  const setSeed = useGameStore((s) => s.setSeed);
  const resetGame = useGameStore((s) => s.resetGame);

  const logEndRef = useRef<HTMLDivElement>(null);
  const seedInputRef = useRef<HTMLInputElement>(null);

  const aliveMonsters = monsters.filter((m) => m.alive).length;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [battleLogs]);

  const handleSeedChange = () => {
    if (seedInputRef.current) {
      const val = parseInt(seedInputRef.current.value, 10);
      if (!isNaN(val) && val > 0) {
        setSeed(val);
      }
    }
  };

  const handleSeedKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSeedChange();
    }
  };

  const hpPercent = Math.max(0, playerHP);

  return (
    <div
      className="flex flex-col gap-4 p-4 select-none"
      style={{
        width: "220px",
        minHeight: "100%",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        fontFamily: "'Quicksand', sans-serif",
        color: "#c8c8e0",
      }}
    >
      <h2
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "18px",
          fontWeight: 700,
          color: "#e0e0ff",
          textAlign: "center",
          letterSpacing: "2px",
          marginBottom: "4px",
        }}
      >
        梦境迷宫
      </h2>

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: "12px", color: "#8888aa" }}>种子</label>
        <div className="flex gap-2">
          <input
            ref={seedInputRef}
            type="number"
            defaultValue={seed}
            onKeyDown={handleSeedKeyDown}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "8px",
              padding: "6px 10px",
              color: "#e0e0ff",
              fontSize: "14px",
              fontFamily: "'Quicksand', sans-serif",
              outline: "none",
            }}
          />
          <button
            onClick={handleSeedChange}
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              border: "none",
              borderRadius: "8px",
              padding: "6px 12px",
              color: "#fff",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.1s",
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.transform = "scale(1)";
            }}
            onMouseDown={(e) => {
              (e.target as HTMLElement).style.transform = "scale(0.95)";
            }}
            onMouseUp={(e) => {
              (e.target as HTMLElement).style.transform = "scale(1.05)";
            }}
          >
            重置
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: "12px", color: "#8888aa" }}>生命值</label>
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: "6px",
            height: "20px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #ff4444, #ff8888)",
              borderRadius: "6px",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "11px",
              fontWeight: 600,
              color: "#fff",
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            {playerHP}/100
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span style={{ fontSize: "12px", color: "#8888aa" }}>存活怪物</span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: aliveMonsters > 0 ? "#e63946" : "#4ade80",
          }}
        >
          {aliveMonsters}
        </span>
      </div>

      <div className="flex flex-col gap-1" style={{ flex: 1, minHeight: 0 }}>
        <label style={{ fontSize: "12px", color: "#8888aa" }}>战斗日志</label>
        <div
          style={{
            flex: 1,
            maxHeight: "220px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            paddingRight: "4px",
          }}
        >
          <AnimatePresence initial={false}>
            {battleLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "4px",
                  color: "#b0b0cc",
                  borderLeft: "2px solid #667eea",
                }}
              >
                {log.message}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logEndRef} />
        </div>
      </div>

      <div className="flex flex-col gap-2" style={{ marginTop: "auto" }}>
        {(gameOver || gameWon) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => resetGame()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              color: "#fff",
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              letterSpacing: "1px",
            }}
          >
            重新入梦
          </motion.button>
        )}

        <div style={{ fontSize: "10px", color: "#555570", textAlign: "center" }}>
          WASD移动 · 点击寻路
        </div>
      </div>
    </div>
  );
}
