import { Scene } from "./Scene.js";
import { Entity } from "../ecs/Entity.js";
import { Transform } from "../components/Transform.js";
import { Renderable } from "../components/Renderable.js";
import { Velocity } from "../components/Velocity.js";
import { Track } from "../components/Track.js";
import { Grid } from "../components/Grid.js";
import { Camera } from "../components/Camera.js";
import { Player } from "../components/Player.js";
import { Dice } from "../components/Dice.js";
import { RenderSystem } from "../systems/RenderSystem.js";
import { MovementSystem } from "../systems/MovementSystem.js";
import { TrackRenderSystem } from "../systems/track/TrackRenderSystem.js";
import { GridRenderSystem } from "../systems/GridRenderSystem.js";
import { CameraControlSystem } from "../systems/CameraControlSystem.js";
import { CellInteractionSystem } from "../systems/CellInteractionSystem.js";
import { PlayerRenderSystem } from "../systems/PlayerRenderSystem.js";
import { DiceSystem } from "../systems/DiceSystem.js";
import { trackConfig, updateTrackPoints, adjustTrackPoints } from "../config/trackPoints.js";
import { registerTrackEntity } from "../debug/TrackDebug.js";
import { TrackHelper } from "../systems/track/TrackHelper.js";

export class MainScene extends Scene {
  constructor(canvas) {
    super(canvas);
    this.isDragging = false;
    this.selectedPointIndex = -1;
    this.cameraSystem = null;
  }

  dragPoints(trackEntity) {
    // Adiciona os event listeners para arrastar pontos
    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) { // Botão esquerdo apenas para arrastar pontos
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Converte para coordenadas do mundo
        const worldCoords = this.cameraSystem ? this.cameraSystem.screenToWorld(mouseX, mouseY) : { x: mouseX, y: mouseY };

        // Encontra o ponto mais próximo do clique
        let minDist = Infinity;
        let closestPointIndex = -1;

        trackConfig.points.forEach((point, index) => {
          const dx = point.x - worldCoords.x;
          const dy = point.y - worldCoords.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minDist && dist < 15) { // 15px de tolerância para selecionar (reduzido para evitar conflito)
            minDist = dist;
            closestPointIndex = index;
          }
        });

        if (closestPointIndex !== -1) {
          this.isDragging = true;
          this.selectedPointIndex = closestPointIndex;
          // Desabilita temporariamente o sistema de interação com células
          if (this.cellInteractionSystem) {
            this.cellInteractionSystem.setEnabled(false);
          }
        }
      }
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (this.isDragging && this.selectedPointIndex !== -1) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Converte para coordenadas do mundo
        const worldCoords = this.cameraSystem ? this.cameraSystem.screenToWorld(mouseX, mouseY) : { x: mouseX, y: mouseY };

        // Cria uma cópia do array de pontos atual
        const currentPoints = [...trackConfig.points];

        // Atualiza a posição do ponto
        currentPoints[this.selectedPointIndex] = {
          x: worldCoords.x,
          y: worldCoords.y
        };

        // Gera o novo array de pontos e o novo índice selecionado
        const { points: newPoints, newSelectedIndex } = adjustTrackPoints(
          currentPoints,
          trackConfig.maxPointDistance,
          this.selectedPointIndex
        );

        // Atualiza os pontos apenas se houver mudança
        if (newPoints.length !== trackConfig.points.length) {
          console.log('Número de pontos mudou:', {
            antigo: trackConfig.points.length,
            novo: newPoints.length,
            indiceAntigo: this.selectedPointIndex,
            indiceNovo: newSelectedIndex
          });
        }

        // Atualiza os pontos na configuração e na entidade
        trackConfig.points = newPoints;
        trackEntity.getComponent(Track).points = newPoints;
        this.selectedPointIndex = newSelectedIndex;
      }
    });

    this.canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0 && this.isDragging) {
        this.isDragging = false;
        this.selectedPointIndex = -1;
        
        // Reabilita o sistema de interação com células
        if (this.cellInteractionSystem) {
          this.cellInteractionSystem.setEnabled(true);
        }
        
      }
    });
  }

  // Método update removido - não precisa mais de lógica especial

  load() {
    // console.log("Carregando MainScene");
    // console.log("Track config:", trackConfig);

    // Cria a entidade da câmera
    const cameraEntity = new Entity()
      .addComponent(new Transform(0, 0, 0, 0)) // Posição inicial da câmera
      .addComponent(new Camera(1, 0.1, 3.0)); // Zoom inicial 1, min 0.1, max 3.0

    this.world.addEntity(cameraEntity);

    // Adiciona os sistemas na ordem correta
    // 1. Sistema de controle da câmera (primeiro para aplicar transformação global)
    this.cameraSystem = new CameraControlSystem(this.canvas);
    this.world.addSystem(this.cameraSystem);
    // 2. Sistema de render principal (que limpa o canvas)
    this.world.addSystem(new RenderSystem(this.canvas));
    // 3. Sistema de render da grid
    this.world.addSystem(new GridRenderSystem(this.canvas));
    // 4. Sistema de render da pista
    this.world.addSystem(new TrackRenderSystem(this.canvas));
    // 5. Sistema de render do jogador
    this.world.addSystem(new PlayerRenderSystem(this.canvas));
    // 6. Sistema do dado
    const diceSystem = new DiceSystem(this.canvas);
    this.world.addSystem(diceSystem);
    // 7. Sistema de interação com células
    this.cellInteractionSystem = new CellInteractionSystem(this.canvas);
    this.world.addSystem(this.cellInteractionSystem);

    // Cria a entidade da grid
    const gridEntity = new Entity().addComponent(new Grid(20, 1, "#E0E0E0"));
    this.world.addEntity(gridEntity);

    // Cria a entidade da pista
    const trackEntity = new Entity().addComponent(
      new Track(trackConfig.points, trackConfig.trackWidth)
    );

    this.world.addEntity(trackEntity);
    
    // Registra a entidade no sistema de debug
    registerTrackEntity(trackEntity);
    
    console.log(
      "Entidade da pista criada com",
      trackConfig.points.length,
      "pontos"
    );
    
    // Cria a entidade do jogador 1 (vermelho)
    const player1Entity = new Entity().addComponent(
      new Player(0, "inner", 0, "#FF0000", 1) // Inicia na célula 0 da faixa interna
    );
    this.world.addEntity(player1Entity);
    console.log("🏎️ Jogador 1 (vermelho) criado na célula 0 (faixa interna)");
    
    // Cria a entidade do jogador 2 (azul)
    const player2Entity = new Entity().addComponent(
      new Player(1, "inner", 0, "#0000FF", 2) // Inicia na célula 1 da faixa interna
    );
    this.world.addEntity(player2Entity);
    console.log("🏎️ Jogador 2 (azul) criado na célula 1 (faixa interna)");
    
    // Cria a entidade do dado
    const diceEntity = new Entity().addComponent(
      new Dice(1, false, 6) // Dado de 6 faces, valor inicial 1
    );
    this.world.addEntity(diceEntity);
    console.log("🎲 Dado criado - Pressione ESPAÇO para rolar! (Turno do Jogador 1)");
    
    // Atualiza os pontos da pista quando a janela é redimensionada
    window.addEventListener("resize", () => {
      console.log("Janela redimensionada, atualizando pontos");
      updateTrackPoints();
      trackEntity.getComponent(Track).points = trackConfig.points;
    });

    this.dragPoints(trackEntity);

    // // Cria o retângulo móvel
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
      // .addComponent(new Velocity(1, 1, 5));

    this.world.addEntity(rectangle);
  }
}
