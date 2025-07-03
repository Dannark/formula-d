import { Scene } from "./Scene.js";
import { Entity } from "../ecs/Entity.js";
import { Transform } from "../components/Transform.js";
import { Renderable } from "../components/Renderable.js";
import { Velocity } from "../components/Velocity.js";
import { Track } from "../components/Track.js";
import { RenderSystem } from "../systems/RenderSystem.js";
import { MovementSystem } from "../systems/MovementSystem.js";
import { TrackRenderSystem } from "../systems/TrackRenderSystem.js";
import { trackConfig, updateTrackPoints } from "../config/trackPoints.js";

export class MainScene extends Scene {
  constructor(canvas) {
    super(canvas);
    this.isDragging = false;
    this.selectedPointIndex = -1;
  }

  dragPoints(trackEntity) {
    // Adiciona os event listeners para arrastar pontos
    this.canvas.addEventListener("mousedown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Encontra o ponto mais próximo do clique
      let minDist = Infinity;
      let closestPointIndex = -1;

      trackConfig.points.forEach((point, index) => {
        const dx = point.x - mouseX;
        const dy = point.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist && dist < 20) { // 20px de tolerância para selecionar
          minDist = dist;
          closestPointIndex = index;
        }
      });

      if (closestPointIndex !== -1) {
        this.isDragging = true;
        this.selectedPointIndex = closestPointIndex;
      }
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (this.isDragging && this.selectedPointIndex !== -1) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Atualiza a posição do ponto
        trackConfig.points[this.selectedPointIndex] = {
          x: mouseX,
          y: mouseY
        };

        // Atualiza os pontos na entidade da pista
        trackEntity.getComponent(Track).points = trackConfig.points;
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.selectedPointIndex = -1;
        
        // Log da lista atualizada de pontos
        console.log("Pontos atualizados:", JSON.stringify(trackConfig.points, null, 2));
      }
    });
  }

  load() {
    console.log("Carregando MainScene");
    console.log("Track config:", trackConfig);

    // Primeiro adiciona o sistema de render principal (que limpa o canvas)
    this.world.addSystem(new RenderSystem(this.canvas));
    // Depois adiciona o sistema de render da pista
    this.world.addSystem(new TrackRenderSystem(this.canvas));

    // Cria a entidade da pista
    const trackEntity = new Entity().addComponent(
      new Track(trackConfig.points, trackConfig.trackWidth)
    );

    this.world.addEntity(trackEntity);
    console.log(
      "Entidade da pista criada com",
      trackConfig.points.length,
      "pontos"
    );

    // Atualiza os pontos da pista quando a janela é redimensionada
    window.addEventListener("resize", () => {
      console.log("Janela redimensionada, atualizando pontos");
      updateTrackPoints();
      trackEntity.getComponent(Track).points = trackConfig.points;
    });

    this.dragPoints(trackEntity);

    // // Cria o retângulo móvel
    // const rectangle = new Entity()
    //   .addComponent(
    //     new Transform(
    //       this.canvas.width / 2 - 50,
    //       this.canvas.height / 2 - 50,
    //       100,
    //       100
    //     )
    //   )
    //   .addComponent(new Renderable("#FF0000"))
    //   .addComponent(new Velocity(1, 1, 5));

    // this.world.addEntity(rectangle);
  }
}
