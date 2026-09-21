// vite.config.js
import { defineConfig } from "vite";
import svgInline from "./plugins/vite-plugin-svg-inline.js";

export default defineConfig({
  plugins: [svgInline()],
  root: ".", // корень проекта (где index.html)
  base: "/", // базовый публичный путь для ассетов
  build: {
    outDir: "dist", // куда класть бандл
    assetsDir: "assets", // подпапка для js/css/картинок
    // sourcemap: false, // карты кода (в dev всегда true)
    sourcemap: true, // включим — увидим, как наш SVG попал в бандл
    // minify: 'oxc',  // Vite 8 использует Oxc по умолчанию, можно не указывать
    target: "baseline-widely-available",
  },
  server: {
    port: 5173,
    open: true, // автоматически открыть браузер
  },
});
