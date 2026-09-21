import "./style.css";
import logo from "./logo.svg"; // ← работает благодаря нашему плагину

const app = document.querySelector("#app");

app.textContent = "Собрано Vite!";

app.insertAdjacentHTML("beforeend", logo);
app.insertAdjacentHTML("beforeend", "<p>SVG вставлен плагином</p>");

console.log("main.js загружен, длина SVG:", logo.length);
