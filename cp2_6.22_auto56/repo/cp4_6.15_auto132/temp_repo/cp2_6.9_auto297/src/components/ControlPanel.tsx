import { motion } from 'framer-motion';

interface ControlPanelProps {
  soakTime: number;
  dyeRound: number;
  onSoakTimeChange: (time: number) => void;
  onDyeRoundChange: (round: number) => void;
  onStartDyeing: () => void;
  onDry: () => void;
  canStart: boolean;
  canDry: boolean;
  isDyeing: boolean;
}

export function ControlPanel({
  soakTime,
  dyeRound,
  onSoakTimeChange,
  onDyeRoundChange,
  onStartDyeing,
  onDry,
  canStart,
  canDry,
  isDyeing,
}: ControlPanelProps) {
  return (
    <motion.div
      className="flex flex-col gap-6 p-6 paper-btn"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl text-center text-[#3e2723]">染色控制</h3>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-[#3e2723]">浸泡时间</label>
          <span className="text-[#5d4037] font-bold">{soakTime} 秒</span>
        </div>
        <input
          type="range"
          min="5"
          max="60"
          step="1"
          value={soakTime}
          onChange={(e) => onSoakTimeChange(Number(e.target.value))}
          className="time-slider"
          disabled={isDyeing}
        />
        <div className="flex justify-between text-xs text-[#5d4037] opacity-70">
          <span>5秒</span>
          <span>60秒</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-[#3e2723]">染色遍数</label>
          <span className="text-[#5d4037] font-bold">第 {dyeRound} 遍</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((round) => (
            <button
              key={round}
              className={`flex-1 paper-btn text-sm ${dyeRound === round ? 'active' : ''}`}
              onClick={() => onDyeRoundChange(round)}
              disabled={isDyeing}
            >
              {round}遍
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <motion.button
          className="flex-1 paper-btn text-lg"
          onClick={onStartDyeing}
          disabled={!canStart || isDyeing}
          whileHover={canStart && !isDyeing ? { scale: 1.05 } : {}}
          whileTap={canStart && !isDyeing ? { scale: 0.95 } : {}}
        >
          {isDyeing ? '染色中...' : '开始染色'}
        </motion.button>

        <motion.button
          className="flex-1 paper-btn text-lg"
          onClick={onDry}
          disabled={!canDry || isDyeing}
          whileHover={canDry && !isDyeing ? { scale: 1.05 } : {}}
          whileTap={canDry && !isDyeing ? { scale: 0.95 } : {}}
        >
          晾干
        </motion.button>
      </div>

      {!canStart && !isDyeing && (
        <p className="text-sm text-[#a93226] text-center">
          请先选择扎结方式和染料
        </p>
      )}
    </motion.div>
  );
}
