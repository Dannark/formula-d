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

    // Desenha a linha base e extrai os dados das linhas centrais
    const baseRenderResult = this.baseTrackRenderer.render(points);
    const baseBoundaryLinesData = baseRenderResult.boundaryLinesData || [];

    // Desenha a primeira faixa (entre linha central e inner boundary)
    // Passa as informações das linhas centrais para o InnerBoundaryRenderer
    const innerRenderResult = this.innerBoundaryRenderer.render(points, innerPoints, baseBoundaryLinesData);
    
    // Extrai os dados das linhas azuis do resultado do render
    const innerBoundaryLinesData = innerRenderResult.boundaryLinesData || [];

    // Desenha a segunda faixa (entre inner boundary e middle boundary)
    // Passa as informações das linhas azuis para o MiddleBoundaryRenderer
    const middleRenderResult = this.middleBoundaryRenderer.render(innerPoints, middlePoints, innerBoundaryLinesData);
    
    // Extrai os dados das linhas roxas do resultado do render
    const middleBoundaryLinesData = middleRenderResult.boundaryLinesData || [];

    // Desenha a terceira faixa (entre middle boundary e outer boundary)
    // Passa as informações das linhas roxas para o OuterBoundaryRenderer
    this.outerBoundaryRenderer.render(middlePoints, innerPoints, outerPoints, middleBoundaryLinesData);
  }
}

// Exporta a configuração global para acesso direto
export { trackColorConfig };
