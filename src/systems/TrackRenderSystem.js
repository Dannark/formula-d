import { Track } from "../components/Track.js";
import { calculateDirection, getBisectorPerpendicular, multiplyVector } from "../utils/mathUtils.js";

export class TrackRenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
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
    const ctx = this.ctx;
    const points = track.points;
    const cellWidth = 60; // Largura da célula do grid

    points.forEach((currentPoint, index) => {
      // Pega o ponto anterior e o próximo (considerando o circuito fechado)
      const prevPoint = points[(index - 1 + points.length) % points.length];
      const nextPoint = points[(index + 1) % points.length];
      
      // Calcula o vetor perpendicular baseado na bissetriz
      const perpendicular = getBisectorPerpendicular(currentPoint, prevPoint, nextPoint);
      const scaledPerpendicular = multiplyVector(perpendicular, cellWidth);

      // Calcula o ponto final do vetor perpendicular atual
      const currentPerpendicularEnd = {
        x: currentPoint.x + scaledPerpendicular.x,
        y: currentPoint.y + scaledPerpendicular.y
      };

      // Calcula o vetor perpendicular do próximo ponto
      const nextPerpendicular = getBisectorPerpendicular(nextPoint, currentPoint, points[(index + 2) % points.length]);
      const nextScaledPerpendicular = multiplyVector(nextPerpendicular, cellWidth);
      const nextPerpendicularEnd = {
        x: nextPoint.x + nextScaledPerpendicular.x,
        y: nextPoint.y + nextScaledPerpendicular.y
      };

      // Desenha o ponto atual
      ctx.beginPath();
      ctx.fillStyle = "#FF0000";
      ctx.arc(currentPoint.x, currentPoint.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Desenha a linha para o próximo ponto
      ctx.beginPath();
      ctx.strokeStyle = "#0000FF";
      ctx.lineWidth = 2;
      ctx.moveTo(currentPoint.x, currentPoint.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
      ctx.stroke();

      // Desenha a linha perpendicular (bissetriz)
      ctx.beginPath();
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.moveTo(currentPoint.x, currentPoint.y);
      ctx.lineTo(currentPerpendicularEnd.x, currentPerpendicularEnd.y);
      ctx.stroke();

      // Desenha a linha que conecta os pontos finais dos vetores perpendiculares
      ctx.beginPath();
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.moveTo(currentPerpendicularEnd.x, currentPerpendicularEnd.y);
      ctx.lineTo(nextPerpendicularEnd.x, nextPerpendicularEnd.y);
      ctx.stroke();
    });
  }
}
