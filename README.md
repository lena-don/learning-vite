# learning-vite

Учебный проект для изучения сборщика **Vite** с нуля.
Цель — не «сделать сайт», а понять, как устроен Vite под капотом: что происходит в dev-режиме, что в build, как подключаются плагины, как организован проект.

---

## Содержание

1. [Что такое Vite и чем он отличается от webpack](#1-что-такое-vite-и-чем-он-отличается-от-webpack)
2. [Два режима: dev и build](#2-два-режима-dev-и-build)
3. [Пошаговое создание проекта](#3-пошаговое-создание-проекта)
4. [Команды и флаги](#4-команды-и-флаги)
5. [Структура проекта](#5-структура-проекта)
6. [Как Vite обрабатывает разные типы файлов](#6-как-vite-обрабатывает-разные-типы-файлов)
7. [Что попадает в dist](#7-что-попадает-в-dist)
8. [Настройка через vite.config.js](#8-настройка-через-viteconfigjs)
9. [Собственный плагин: SVG как строка](#9-собственный-плагин-svg-как-строка)
10. [Отладка сборки](#10-отладка-сборки)
11. [Шпаргалка](#11-шпаргалка)

---

## 1. Что такое Vite и чем он отличается от webpack

**Vite** — сборщик и dev-сервер, построенный на двух движках:

- **esbuild / Oxc** — для быстрых трансформаций (в dev и для минификации в build).
- **Rollup / Rolldown** — для продакшн-сборки (граф модулей, tree-shaking, code splitting).

Ключевые идеи:

- **В dev Vite ничего не бандлит заранее.** Он отдаёт файлы браузеру через нативные ES-модули (`<script type="module">`) и трансформирует только то, что запросил браузер.
- **В build в дело вступает Rollup/Rolldown**, который строит граф модулей от HTML и собирает итоговый бандл.

Отличие от webpack:

|                 | webpack                         | Vite                     |
| --------------- | ------------------------------- | ------------------------ |
| Точка входа     | JS-файл                         | `index.html`             |
| Dev-режим       | Полная сборка на старте         | Трансформация по запросу |
| Скорость старта | Пропорциональна размеру проекта | Почти константа          |
| Конфиг          | `webpack.config.js`             | `vite.config.js` (проще) |
| HMR             | Есть                            | Есть, через WebSocket    |

---

## 2. Два режима: dev и build

### Dev (`vite` / `npm run dev`)

1. Vite поднимает HTTP-сервер (по умолчанию порт 5173) на базе `connect`.
2. Отдаёт `index.html` почти как есть, но инжектит `<script src="/@vite/client">` — клиент HMR.
3. Когда браузер запрашивает модуль, Vite:
   - читает файл,
   - прогоняет через esbuild/Oxc,
   - переписывает импорты (`./style.css` → `/src/style.css?t=...`),
   - отдаёт результат как `application/javascript`.
4. Бандла нет. Есть трансформация по требованию.

### Build (`vite build`)

1. Вход — `index.html`.
2. Rollup/Rolldown строит граф модулей от `<script type="module">`.
3. Транспиляция, минификация, tree-shaking, code splitting.
4. Имена файлов хешируются (`index-abc123.js`) для cache-busting.
5. Результат пишется в `dist/`.

### Preview (`vite preview`)

Статический сервер над `dist/`. Не делает трансформаций — просто раздаёт готовый бандл. Нужен, чтобы проверить, что сборка корректна.

---

## 3. Пошаговое создание проекта

```bash
mkdir learning-vite && cd learning-vite
npm init -y                      # создать package.json с дефолтами
npm install -D vite              # установить Vite как dev-зависимость
mkdir src
touch index.html src/main.js src/style.css
```

Добавить в `package.json`:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Почему `"type": "module"` важно:** без него Node трактует `.js` как CommonJS, и `vite.config.js` загружается в другом режиме.

### `index.html`

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>learning-vite</title>
  </head>
  <body>
    <h1>Hello, Vite!</h1>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

Путь `/src/main.js` начинается со слэша — это **root-relative** путь (от корня проекта, где лежит `vite.config.js`).

### `src/main.js`

```js
import "./style.css";

const app = document.querySelector("#app");
app.textContent = "Собрано Vite!";
```

### `src/style.css`

```css
body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
}
```

---

## 4. Команды и флаги

| Команда                  | Что делает                                           |
| ------------------------ | ---------------------------------------------------- |
| `npm run dev`            | Поднимает dev-сервер                                 |
| `npm run build`          | Прод-сборка в `dist/`                                |
| `npm run preview`        | Статический сервер над `dist/`                       |
| `npx vite build --debug` | Показать внутренний конфиг Rollup и список плагинов  |
| `npx vite --host`        | Открыть dev-сервер в локальной сети                  |
| `npm init -y`            | Создать `package.json` без вопросов (`-y` = `--yes`) |

### Что делает `npm init -y`

Без флага npm задаёт вопросы (имя, версия, описание, entry point, license…). Флаг `-y` пропускает диалог и сразу пишет `package.json` с дефолтами:

- `name` — имя текущей папки
- `version` — `1.0.0`
- `main` — `index.js`
- `license` — `ISC`
- `scripts.test` — заглушка

Поле `"type": "module"` **не добавляется** — его нужно прописать вручную.

---

## 5. Структура проекта

```
learning-vite/
├─ node_modules/          # зависимости (не коммитится)
├─ public/                # статика без обработки (копируется в dist как есть)
├─ plugins/               # собственные Vite-плагины
│  └─ vite-plugin-svg-inline.js
├─ src/                   # исходники
│  ├─ assets/             # ассеты, проходящие через сборщик
│  ├─ logo.svg
│  ├─ main.js             # точка входа JS
│  └─ style.css
├─ .gitignore
├─ index.html             # точка входа HTML
├─ package.json
├─ package-lock.json
├─ vite.config.js
└─ README.md
```

### Назначение ключевых файлов и папок

| Элемент             | За что отвечает                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `index.html`        | Главная точка входа. Vite парсит его и ищет `<script type="module">`                             |
| `src/main.js`       | Точка входа JS, указанная в HTML                                                                 |
| `src/assets/`       | Ассеты, которые импортируются из JS/CSS и проходят через Vite (хеширование, инлайн, оптимизация) |
| `public/`           | Файлы, копируемые в `dist/` без обработки (favicon, robots.txt, manifest)                        |
| `vite.config.js`    | Конфигурация Vite                                                                                |
| `package.json`      | Манифест: скрипты, зависимости, `"type": "module"`                                               |
| `package-lock.json` | Точные версии зависимостей (коммитится)                                                          |
| `node_modules/`     | Установленные пакеты (не коммитится)                                                             |
| `dist/`             | Артефакт сборки (не коммитится)                                                                  |

### `public/` vs `src/assets/`

- **`public/`** — файлы копируются в `dist/` как есть, URL стабилен (`/logo.png`). Подходит для favicon и служебных файлов.
- **`src/assets/`** — файлы обрабатываются Vite: получают хеш в имени (`logo-abc123.png`), мелкие инлайнятся в base64. Подходит для картинок, шрифтов, используемых в коде.

---

## 6. Как Vite обрабатывает разные типы файлов

| Импорт                               | Что делает Vite                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `import './style.css'`               | В dev оборачивает CSS в JS и вставляет `<style>`; в build извлекает в отдельный файл |
| `import logo from './logo.svg'`      | Возвращает URL (в build — хешированный путь в `assets/`)                             |
| `import data from './data.json'`     | Парсит JSON и экспортирует как объект                                                |
| `import x from './module.js'`        | Разрешает через граф модулей                                                         |
| `import w from './worker.js?worker'` | Создаёт Web Worker                                                                   |
| `import txt from './file.txt?raw'`   | Возвращает содержимое как строку                                                     |

Query-параметры (`?raw`, `?url`, `?worker`, `?inline`) — способ попросить Vite обработать файл иначе. Это расширяемая система: свой плагин может добавить новый суффикс.

---

## 7. Что попадает в dist

После `npm run build`:

```
dist/
├─ index.html                # с переписанными путями на /assets/*.js
└─ assets/
   ├─ index-<hash>.js        # JS-бандл
   ├─ index-<hash>.css       # извлечённый из JS CSS
   └─ logo-<hash>.svg        # ассеты из src/assets (если не инлайнятся)
```

Плюс всё, что было в `public/`, копируется в корень `dist/` без изменений.

Что произошло под капотом:

1. Rolldown/Rollup построил граф модулей от `index.html`.
2. Транспилировал JS (Oxc/esbuild) до целевого синтаксиса.
3. Минифицировал.
4. Извлёк CSS из JS-графа.
5. Добавил хеши к именам файлов.
6. Сделал tree-shaking неиспользуемого кода.
7. Переписал пути в HTML.
8. Записал всё в `dist/`.

`dist/` — полностью статический сайт. Node на сервере не нужен.

---

## 8. Настройка через vite.config.js

```js
import { defineConfig } from "vite";
import svgInline from "./plugins/vite-plugin-svg-inline.js";

export default defineConfig({
  root: ".", // корень проекта (где index.html)
  base: "/", // публичный путь для ассетов
  publicDir: "public", // откуда копировать статику без обработки
  plugins: [svgInline()],
  resolve: {
    alias: { "@": "/src" }, // удобные импорты: import x from '@/x.js'
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    minify: "esbuild",
    target: "modules",
  },
});
```

Ключевые поля:

- `root` — где искать `index.html` и относительно чего разрешать `/...`.
- `base` — если сайт в подпапке (`/my-app/`), пути переписываются.
- `plugins` — массив плагинов (Vite- и Rollup-совместимых).
- `server.proxy` — проксирование API-запросов на бэкенд.
- `build.rollupOptions` — прямой доступ к настройкам Rollup (input, output, external).

**`defineConfig`** — это фактически `identity`-функция: нужна только для типизации и автокомплита в редакторе.

---

## 9. Собственный плагин: SVG как строка

Vite-плагин — обычный объект с полем `name` и набором **хуков**. Хуки бывают:

- **Rollup-хуки** — работают и в dev, и в build: `resolveId`, `load`, `transform`.
- **Vite-хуки** — только в dev: `configureServer`, `handleHotUpdate`, `transformIndexHtml`.

Поле `enforce` управляет порядком: `'pre'` ставит плагин до встроенных, `'post'` — после.
Поле `apply: 'serve' | 'build'` ограничивает режим работы.

### `plugins/vite-plugin-svg-inline.js`

```js
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export default function svgInlinePlugin() {
  const svgRE = /\.svg$/;

  return {
    name: "vite-plugin-svg-inline",
    enforce: "pre", // перехватываем раньше встроенного vite:asset

    async load(id) {
      const [cleanId] = id.split("?"); // Vite добавляет ?import, ?t=...
      if (!svgRE.test(cleanId)) return null;

      const isFsPath = cleanId.startsWith("/") || /^[a-zA-Z]:/.test(cleanId);
      let filePath = cleanId;
      if (!isFsPath || cleanId.startsWith("/src/")) {
        filePath = fileURLToPath(new URL("." + cleanId, import.meta.url));
      }

      const svg = await readFile(filePath, "utf-8");
      return `export default ${JSON.stringify(svg)};`;
    },
  };
}
```

### Как это работает

1. В `main.js` пишем: `import logo from './logo.svg'`.
2. Vite встречает импорт, преобразует в `/src/logo.svg?import`.
3. Идёт по цепочке плагинов → наш `load` (благодаря `enforce: 'pre'`).
4. Возвращаем JS-код `export default "<svg>...</svg>"`.
5. Rollup парсит это как обычный модуль — строка попадает в бандл.

**Результат:**

- В **dev**: браузер получает JS-модуль, экспортирующий SVG-строку. В Network видно, что `logo.svg` имеет тип `application/javascript`.
- В **build**: SVG инлайнится в JS-бандл, отдельный файл `.svg` в `dist/assets` не появляется.

---

## 10. Отладка сборки

### `npx vite build --debug`

Выводит внутренний конфиг Rollup и список плагинов с их `name` и `enforce`. Убедитесь, что свой плагин стоит до `vite:asset`.

### `console.log` внутри хуков

В dev — вывод в терминал с `npm run dev`. В build — тоже в терминал.

```js
load(id) {
  console.log('[svg-inline] load:', id);
  // ...
}
```

### Анализ бандла

- `build.sourcemap: true` — создаются `.map`-файлы, по ним можно посмотреть исходники в браузере.
- `build.minify: false` — увидеть код до минификации.
- Открыть `dist/assets/index-<hash>.js` и найти там свои строки.

---

## 11. Шпаргалка

| Вопрос                                 | Ответ                                                   |
| -------------------------------------- | ------------------------------------------------------- |
| Где точка входа HTML?                  | `index.html` в корне проекта                            |
| Где точка входа JS?                    | `src/main.js` (указана в HTML)                          |
| Где статика без обработки?             | `public/` — копируется как есть                         |
| Где ассеты с обработкой?               | `src/assets/` — хешируются, оптимизируются              |
| Где конфиг?                            | `vite.config.js`                                        |
| Где скрипты?                           | `package.json` → `scripts`                              |
| Куда собирается?                       | `dist/`                                                 |
| Что кэшируется?                        | `node_modules/.vite/` (dev), `dist/` — артефакт         |
| Что не коммитить?                      | `node_modules/`, `dist/`, `.vite/`, `.env.local`        |
| Как посмотреть плагины?                | `npx vite build --debug`                                |
| Как добавить свой плагин?              | Объект с `name` и хуками в `vite.config.js` → `plugins` |
| Чем `public/` отличается от `assets/`? | Первое копируется как есть, второе обрабатывается       |

---

## \* 12. Что можно изучить дальше

1. **Динамический импорт** — добавить `import('./heavy.js')` и увидеть, как Rollup выделит отдельный чанк в `dist/assets`.
2. **Переменные окружения** — `.env` и `import.meta.env.VITE_*`.
3. **Алиасы путей** — `resolve.alias` в конфиге.
4. **CSS-препроцессоры** — `npm i -D sass` и импорт `.scss` без настройки.
5. **PostCSS и Autoprefixer** — обработка CSS.
6. **Code splitting и lazy loading** — как Vite разбивает бандл.
7. **Проксирование API** — `server.proxy` для работы с бэкендом.
8. **Vitest** — тестирование в экосистеме Vite.
9. **`vite-plugin-svgr`** — посмотреть, как устроен реальный плагин для SVG.
10. **SSR и библиотечный режим** — продвинутые сценарии.
