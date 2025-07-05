import { Track } from "../../components/Track.js";
import { BaseTrackRenderer } from "./BaseTrackRenderer.js";
import { InnerBoundaryRenderer } from "./InnerBoundaryRenderer.js";
import { MiddleBoundaryRenderer } from "./MiddleBoundaryRenderer.js";
import { OuterBoundaryRenderer } from "./OuterBoundaryRenderer.js";
import { trackColorConfig } from "./TrackColorConfig.js";

export class TrackRenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.baseTrackRenderer = new BaseTrackRenderer(this.ctx);
    this.innerBoundaryRenderer = new InnerBoundaryRenderer(this.ctx, 60);
    this.middleBoundaryRenderer = new MiddleBoundaryRenderer(this.ctx, 60);
    this.outerBoundaryRenderer = new OuterBoundaryRenderer(this.ctx, 60);
    
    // Exposição da configuração global de cores
    this.colorConfig = trackColorConfig;
  }

  update(deltaTime, entities) {
    for (const entity of entities) {
      if (entity.hasComponent(Track)) {
        const track = entity.getComponent(Track);
        this.renderTrack(track);
      }
    }
  }

  renderTrack(track) {
    const points = track.points;

    // Desenha a base da pista (linha central azul + pontos vermelhos numerados)
    this.baseTrackRenderer.render(points);

    // Desenha a primeira faixa (linhas verdes + curva preta)
    const outerPoints = this.innerBoundaryRenderer.render(points);

    // Desenha a segunda faixa (linhas laranjas + curvas roxas)
    const outerMostPoints = this.middleBoundaryRenderer.render(outerPoints);

    // Desenha a terceira faixa (linhas vermelhas + curvas cinzas)
    this.outerBoundaryRenderer.render(outerMostPoints, outerPoints);
  }
}

// Exporta a configuração global para acesso direto
export { trackColorConfig };
