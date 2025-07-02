import { Transform } from '../components/Transform.js';
import { Renderable } from '../components/Renderable.js';

export class RenderSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
    }

  update(deltaTime, entities) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const entity of entities) {
      if (entity.hasComponent(Transform) && entity.hasComponent(Renderable)) {
        const transform = entity.getComponent(Transform);
        const renderable = entity.getComponent(Renderable);

        this.ctx.fillStyle = renderable.color;
        this.ctx.fillRect(transform.x, transform.y, transform.width, transform.height);
      }
    }
  }
} 