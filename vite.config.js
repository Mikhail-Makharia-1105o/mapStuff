import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"), // Основной входной файл
        game: resolve(__dirname, "game.html") // Добавляем game.html в сборку
      }
    },
    assetsInclude: [
      "start_style.css",
      "main_style.css",
      "main.js",
      "randomCountry.js",
      "countries.js"
    ]
  }
});
