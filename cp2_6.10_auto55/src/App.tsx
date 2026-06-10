import React from "react";
import ThreeScene from "./components/ThreeScene";
import UIPanel from "./components/UIPanel";

const App: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#c8b298",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <ThreeScene />
      <UIPanel />
    </div>
  );
};

export default App;
