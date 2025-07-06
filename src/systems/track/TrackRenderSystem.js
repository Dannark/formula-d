import { Track } from "../../components/Track.js";
import { BaseTrackRenderer } from "./BaseTrackRenderer.js";
import { InnerBoundaryRenderer } from "./InnerBoundaryRenderer.js";
import { MiddleBoundaryRenderer } from "./MiddleBoundaryRenderer.js";
import { OuterBoundaryRenderer } from "./OuterBoundaryRenderer.js";
import { trackColorConfig } from "../../config/TrackColorConfig.js";

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

    // Primeira passagem: calcula todos os pontos das fronteiras
    const innerPoints = this.innerBoundaryRenderer.calculatePerpendicularLinesEndPoints(points);
    const middlePoints = this.middleBoundaryRenderer.calculatePerpendicularLinesEndPoints(innerPoints);
    const outerPoints = this.outerBoundaryRenderer.calculatePerpendicularLinesEndPoints(middlePoints, innerPoints);

    // Segunda passagem: desenha as células com preenchimento e depois as linhas
    // Desenha apenas a linha central (sem células)
    this.baseTrackRenderer.render(points);

    // Desenha a segunda faixa (entre linha central e inner boundary)
    this.innerBoundaryRenderer.render(points, innerPoints);

    // Desenha a terceira faixa (entre inner boundary e middle boundary)
    this.middleBoundaryRenderer.render(innerPoints, middlePoints);

    // Desenha a quarta faixa (entre middle boundary e outer boundary)
    this.outerBoundaryRenderer.render(middlePoints, innerPoints, outerPoints);
  }
}

// Exporta a configuração global para acesso direto
export { trackColorConfig };
