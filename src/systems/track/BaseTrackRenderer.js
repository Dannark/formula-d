import { TrackHelper } from "./TrackHelper.js";

export class BaseTrackRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  // Desenha a linha central azul
  renderCentralLine(points) {
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.strokeStyle = "#0000FF";
    ctx.lineWidth = 2;
    
    // Move para o primeiro ponto
    ctx.moveTo(points[0].x, points[0].y);
    
    // Desenha as curvas de Bézier entre os pontos
    points.forEach((point, index) => {
      const prevPoint = points[(index - 1 + points.length) % points.length];
      const nextPoint = points[(index + 1) % points.length];
      const nextNextPoint = points[(index + 2) % points.length];
      
      const controlPoints = TrackHelper.calculateControlPoints(point, nextPoint, prevPoint, nextNextPoint);
      
      ctx.bezierCurveTo(
        controlPoints.cp1.x,
        controlPoints.cp1.y,
        controlPoints.cp2.x,
        controlPoints.cp2.y,
        nextPoint.x,
        nextPoint.y
      );
    });
    ctx.stroke();
  }

  // Desenha os pontos vermelhos com números
  renderTrackPoints(points) {
    const ctx = this.ctx;

    points.forEach((point, index) => {
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Adiciona o número do índice
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(index.toString(), point.x, point.y);
    });
  }

  render(points) {
    // 1. Desenha a linha central azul
    this.renderCentralLine(points);
    
    // 2. Desenha os pontos vermelhos numerados
    this.renderTrackPoints(points);
  }
} 