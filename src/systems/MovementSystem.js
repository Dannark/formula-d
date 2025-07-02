import { Transform } from "../components/Transform.js";
import { Velocity } from "../components/Velocity.js";

export class MovementSystem {
  update(deltaTime, entities) {
    for (const entity of entities) {
      if (entity.hasComponent(Transform) && entity.hasComponent(Velocity)) {
        const transform = entity.getComponent(Transform);
        const velocity = entity.getComponent(Velocity);

        // Atualiza a posição baseado na velocidade
        transform.x += velocity.dx * velocity.speed;
        transform.y += velocity.dy * velocity.speed;

        // Verifica limites da tela (opcional)
        const canvas = document.getElementById("gameCanvas");
        if (transform.x < 0 || transform.x + transform.width > canvas.width) {
          velocity.dx *= -1; // Inverte direção horizontal
        }
        if (transform.y < 0 || transform.y + transform.height > canvas.height) {
          velocity.dy *= -1; // Inverte direção vertical
        }
      }
    }
  }
}
