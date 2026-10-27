import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps the build portable: works at gawbi.github.io/ or gawbi.github.io/<repo>/
export default defineConfig({
  base: "./",
  plugins: [react()],
});
