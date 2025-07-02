import { Scene } from "./Scene.js";
import { Entity } from "../ecs/Entity.js";
import { Transform } from "../components/Transform.js";
import { Renderable } from "../components/Renderable.js";
import { Velocity } from "../components/Velocity.js";
import { RenderSystem } from "../systems/RenderSystem.js";
import { MovementSystem } from "../systems/MovementSystem.js";

export class MainScene extends Scene {
  load() {
    // Adiciona sistemas
    this.world.addSystem(new MovementSystem());
    this.world.addSystem(new RenderSystem(this.canvas));

    // Cria o retângulo móvel
    const rectangle = new Entity()
      .addComponent(
        new Transform(
          this.canvas.width / 2 - 50,
          this.canvas.height / 2 - 50,
          100,
          100
        )
      )
      .addComponent(new Renderable("#FF0000"))
      .addComponent(new Velocity(1, 1, 5));

    this.world.addEntity(rectangle);
  }
}
