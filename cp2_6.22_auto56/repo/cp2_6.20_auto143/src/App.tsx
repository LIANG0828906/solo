import { Canvas } from "@react-three/fiber";
import Earth from "./Earth";
import UIPanel from "./UIPanel";

export default function App() {
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #050510 0%, #0a1020 100%)",
        }}
      >
        <Earth />
      </Canvas>
      <UIPanel />
    </div>
  );
}
