import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// У режимі розробки всі запити на /api перекидаються на FastAPI,
// тому фронтенд і бекенд виглядають для браузера як один сайт.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
