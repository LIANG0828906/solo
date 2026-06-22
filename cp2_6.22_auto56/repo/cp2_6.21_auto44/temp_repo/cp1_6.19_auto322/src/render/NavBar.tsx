import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePlantStore } from '../store/plantStateStore';
import { useLogStore } from '../store/logStore';
import { useEnvParamsStore } from '../store/envParamsStore';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

function NavButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = rippleId.current++;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => {
      setRipples((r) => r.filter((rp) => rp.id !== id));
    }, 600);
    onClick();
  };

  const btnStyle: React.CSSProperties = {
    position: "relative",
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    color: "#FFFFFF",
    cursor: "pointer",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    transition: "background 0.2s",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#555555";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
      onClick={handleClick}
      title={title}
      style={btnStyle}
    >
      {children}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: r.x - 10,
            top: r.y - 10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.4)",
            pointerEvents: "none",
          }}
        />
      ))}
    </motion.button>
  );
}

function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const dialogStyle: React.CSSProperties = {
    background: "#2C2C2C",
    borderRadius: 8,
    padding: 24,
    maxWidth: 460,
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    color: "#fff",
  };

  const h2Style: React.CSSProperties = {
    margin: "0 0 16px 0",
    fontSize: 18,
    fontWeight: 600,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: 12,
  };

  const contentStyle: React.CSSProperties = {
    fontSize: 13,
    lineHeight: 1.8,
    color: "#BDBDBD",
  };

  const pStyle: React.CSSProperties = { margin: "8px 0" };
  const ulStyle: React.CSSProperties = { margin: "4px 0 16px 16px" };
  const strongStyle: React.CSSProperties = { color: "#fff" };

  const btnStyle: React.CSSProperties = {
    marginTop: 20,
    width: "100%",
    padding: "10px",
    borderRadius: 6,
    border: "none",
    background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={overlayStyle}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        style={dialogStyle}
      >
        <h2 style={h2Style}>🌱 使用说明</h2>
        <div style={contentStyle}>
          <p style={pStyle}>
            <strong style={strongStyle}>🌿 场景操作</strong>
          </p>
          <ul style={ulStyle}>
            <li>鼠标左键拖拽：旋转视角</li>
            <li>鼠标右键拖拽：平移视角</li>
            <li>滚轮：缩放（5-30单位范围）</li>
            <li>点击植物：选中并高亮</li>
          </ul>

          <p style={pStyle}>
            <strong style={strongStyle}>🌡 环境控制（左面板）</strong>
          </p>
          <ul style={ulStyle}>
            <li>光照 20-80%：光合效率线性增长</li>
            <li>光照 不足20%：叶片发黄，超过80%：焦边+矮化</li>
            <li>水分 不足30%：卷曲皱缩，超过80%：水渍半透明</li>
            <li>pH 低于5.0：紫边，高于7.5：黄边</li>
          </ul>

          <p style={pStyle}>
            <strong style={strongStyle}>🧬 基因育种（右面板）</strong>
          </p>
          <ul style={ulStyle}>
            <li>拖拽雷达图顶点调整基因权重</li>
            <li>杂交：每基因50%父/母 + 5%变异</li>
            <li>父本(P) 粉、母本(M) 蓝、子代(F) 绿</li>
          </ul>

          <p style={pStyle}>
            <strong style={strongStyle}>⏱ 生长阶段</strong>
          </p>
          <ul style={{ margin: "4px 0 0 16px" }}>
            <li>种子萌发 0-5s → 营养 5-20s</li>
            <li>生殖生长 20-35s → 果实成熟 35-50s</li>
          </ul>
        </div>
        <button onClick={onClose} style={btnStyle}>
          明白了
        </button>
      </motion.div>
    </motion.div>
  );
}

export function NavBar() {
  const [helpOpen, setHelpOpen] = useState(false);
  const resetAll = usePlantStore((s) => s.resetAll);
  const addLog = useLogStore((s) => s.addLog);
  const resetEnv = useEnvParamsStore((s) => s.reset);

  const handleReset = () => {
    resetAll();
    resetEnv();
    addLog("env", "场景已重置", {});
  };

  const handleScreenshot = () => {
    const canvases = document.querySelectorAll("canvas");
    const mainCanvas = canvases[0] as HTMLCanvasElement;
    if (!mainCanvas) return;
    try {
      const url = mainCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `plant-sim-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addLog("env", "截图已保存", {});
    } catch (e) {
      console.error("截图失败", e);
    }
  };

  const navStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    background: "rgba(33, 33, 33, 0.85)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    zIndex: 50,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: '"Georgia", "Times New Roman", serif',
    fontSize: 17,
    fontWeight: 600,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  };

  const leftGroupStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const rightGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: 4,
    alignItems: "center",
  };

  return (
    <motion.nav
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      style={navStyle}
    >
      <div style={leftGroupStyle}>
        <span style={{ fontSize: 18 }}>🌱</span>
        <span style={titleStyle}>Plant Growth Lab · 植物生长实验室</span>
      </div>
      <div style={rightGroupStyle}>
        <NavButton title="重置场景" onClick={handleReset}>
          🔄
        </NavButton>
        <NavButton title="截图保存" onClick={handleScreenshot}>
          📷
        </NavButton>
        <NavButton title="帮助说明" onClick={() => setHelpOpen(true)}>
          ❓
        </NavButton>
      </div>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </motion.nav>
  );
}
