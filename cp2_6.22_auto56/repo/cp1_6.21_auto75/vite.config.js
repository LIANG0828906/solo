import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { createFilter } from "vite";

function glslPlugin() {
  const filter = createFilter(/\.glsl$/, /node_modules/);

  return {
    name: "vite-plugin-glsl",
    transform(code, id) {
      if (!filter(id)) return null;
      return {
        code: `export default ${JSON.stringify(code)};`,
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), glslPlugin()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "/src"),
    },
  },
});
