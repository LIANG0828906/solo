import Home from "@/pages/Home";
import { NebulaBackground } from "@/components/NebulaBackground";

export default function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <NebulaBackground />
      <Home />
    </div>
  );
}
