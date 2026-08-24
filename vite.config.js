import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        game: resolve(__dirname, "game.html"),
      },
    },
    assetsInclude: [
      "start_style.css",
      "main_style.css",
      "main.js",
      "randomCountry.js",
      "countries.js",
    ],
  },
  server: {
    proxy: {
      "/api": {
        target: "https://api.restcountries.com",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ["ol"],
    force: false,
  },

  build: {
    sourcemap: false,
    target: "es2018",
  },

  server: {
    port: 5173,
    strictPort: false,
  },

  preview: {
    port: 4173,
  },

  resolve: {
    dedupe: ["ol"],
  },
});
