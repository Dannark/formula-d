import { Transform } from "../components/Transform.js";
import { Renderable } from "../components/Renderable.js";
import { Camera } from "../components/Camera.js";

export class RenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cameraEntity = null;
  }

  update(deltaTime, entities) {
    // Encontra a entidade da câmera
    if (!this.cameraEntity) {
      for (const entity of entities) {
        if (entity.hasComponent(Camera) && entity.hasComponent(Transform)) {
          this.cameraEntity = entity;
          break;
        }
      }
    }

    // Reset da transformação antes de limpar o canvas
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Apenas o RenderSystem principal limpa o canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Define um fundo branco para melhor visualização
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Agora aplica a transformação da câmera
    this.applyCameraTransform();

    for (const entity of entities) {
      if (entity.hasComponent(Transform) && entity.hasComponent(Renderable)) {
        const transform = entity.getComponent(Transform);
        const renderable = entity.getComponent(Renderable);

        this.ctx.fillStyle = renderable.color;
        this.ctx.fillRect(
          transform.x,
          transform.y,
          transform.width,
          transform.height
        );
      }
    }
  }

  applyCameraTransform() {
    if (this.cameraEntity) {
      const transform = this.cameraEntity.getComponent(Transform);
      const camera = this.cameraEntity.getComponent(Camera);
      
      // Aplica zoom
      this.ctx.scale(camera.zoom, camera.zoom);
      
      // Aplica translação da câmera
      this.ctx.translate(-transform.x, -transform.y);
    }
  }
}
