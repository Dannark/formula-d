export class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.currentScene = null;
  }

  addScene(name, scene) {
    this.scenes.set(name, scene);
  }

  switchTo(sceneName) {
    if (!this.scenes.has(sceneName)) {
      console.error(`Cena '${sceneName}' não encontrada!`);
      return;
    }

    if (this.currentScene) {
      this.currentScene.unload();
    }

    this.currentScene = this.scenes.get(sceneName);
    this.currentScene.load();
  }

  update(deltaTime) {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }
}
