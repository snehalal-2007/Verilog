import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `npm run dev` serves the UI on :5173 and forwards /simulate to Flask on :5050.
// `npm run build` writes dist/, which Flask serves at http://localhost:5050/.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/simulate": "http://localhost:5050" } },
  build: { outDir: "dist", emptyOutDir: true },
});
