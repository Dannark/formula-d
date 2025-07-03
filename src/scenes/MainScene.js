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
  load() {
    console.log("Carregando MainScene");
    console.log("Track config:", trackConfig);

    // Primeiro adiciona o sistema de render principal (que limpa o canvas)
    this.world.addSystem(new RenderSystem(this.canvas));
    // Depois adiciona o sistema de render da pista
    this.world.addSystem(new TrackRenderSystem(this.canvas));

    trackConfig.points = [
      {
        x: 767.95,
        y: 383.5,
      },
      {
        x: 731.9845196459326,
        y: 517.7249999999999,
      },
      {
        x: 633.725,
        y: 615.9845196459326,
      },
      {
        x: 499.5,
        y: 651.95,
      },
      {
        x: 365.2750000000001,
        y: 615.9845196459326,
      },
      {
        x: 267.01548035406745,
        y: 517.7249999999999,
      },
      {
        x: 231.05,
        y: 383.50000000000006,
      },
      {
        x: 267.01548035406745,
        y: 249.2750000000001,
      },
      {
        x: 365.27499999999986,
        y: 151.01548035406753,
      },
      {
        x: 499.49999999999994,
        y: 115.05000000000001,
      },
      {
        x: 633.725,
        y: 151.01548035406748,
      },
      {
        x: 731.9845196459324,
        y: 249.2749999999999,
      },
    ];

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
