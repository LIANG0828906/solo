import GameCanvas from "@/components/GameCanvas";
import UIPanel from "@/components/UIPanel";

export default function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0d0d1a",
        display: "flex",
        fontFamily: "'Quicksand', sans-serif",
        overflow: "hidden",
      }}
      className="app-layout"
    >
      <div
        className="panel-container"
        style={{
          flexShrink: 0,
          padding: "16px",
          display: "flex",
          alignItems: "flex-start",
          height: "100%",
        }}
      >
        <UIPanel />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "600px" }}>
          <GameCanvas />
        </div>
      </div>
    </div>
  );
}
