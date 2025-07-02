import { World } from "../ecs/World.js";

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.world = new World();
  }

  load() {
    // Método a ser sobrescrito pelas cenas filhas
    // Aqui você carrega entidades e sistemas específicos da cena
  }

  unload() {
    // Método a ser sobrescrito pelas cenas filhas
    // Limpa recursos específicos da cena se necessário
    this.world = new World();
  }

  update(deltaTime) {
    this.world.update(deltaTime);
  }
}
