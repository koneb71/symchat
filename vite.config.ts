import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // optimizeDeps: {
  //   exclude: ['pdfjs-dist'],
  // },
  // build: {
  //   rollupOptions: {
  //     output: {
  //       manualChunks: {
  //         'pdfjs-dist': ['pdfjs-dist'],
  //       },
  //     },
  //   },
  // },
  // worker: {
  //   format: "es",
  // },
  // assetsInclude: ["**/*.mjs"],
});
