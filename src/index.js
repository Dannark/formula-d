import { SceneManager } from "./scenes/SceneManager.js";
import { MainScene } from "./scenes/MainScene.js";
// Importa o sistema de debug (opcional - pode ser removido sem impacto)
import "./debug/TrackDebug.js";

const canvas = document.getElementById("gameCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const sceneManager = new SceneManager();

sceneManager.addScene("main", new MainScene(canvas));
sceneManager.switchTo("main");

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  sceneManager.update(deltaTime);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
