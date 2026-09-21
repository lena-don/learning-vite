import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/**
 * Плагин: импортирует .svg как строку с его содержимым.
 * Пример использования:
 *   import logo from './logo.svg';
 *   document.body.insertAdjacentHTML('beforeend', logo);
 */
export default function svgInlinePlugin() {
  // Регулярка для отсечения query-суффиксов Vite (?import, ?t=...)
  const svgRE = /\.svg$/;

  return {
    name: "vite-plugin-svg-inline", // обязательное поле
    enforce: "pre", // запускаться раньше встроенного плагина Vite для ассетов

    // 1) Сообщаем Rollup/Vite: этот импорт должен обрабатываться нами
    async load(id) {
      // id в dev может быть "/src/logo.svg", а в build — абсолютный путь
      const [cleanId] = id.split("?");
      if (!svgRE.test(cleanId)) return null; // null = "я не берусь, иди дальше"

      // В dev и build id может быть как файловым путём, так и URL-путём.
      const isFsPath = cleanId.startsWith("/") || /^[a-zA-Z]:/.test(cleanId);
      let filePath = cleanId;

      if (!isFsPath || cleanId.startsWith("/src/")) {
        // Превращаем "/src/logo.svg" в реальный путь на диске
        filePath = fileURLToPath(new URL("." + cleanId, import.meta.url));
      }

      const svg = await readFile(filePath, "utf-8");

      // Возвращаем JS-модуль, который экспортирует строку по умолчанию
      return `export default ${JSON.stringify(svg)};`;
    },
  };
}
