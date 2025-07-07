import { TrackHelper } from "./TrackHelper.js";
import { trackColorConfig } from "../../config/TrackColorConfig.js";

export class BaseTrackRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  // Calcula múltiplos pontos ao longo de uma curva de Bézier
  calculateBezierCurvePoints(p0, cp1, cp2, p1, numPoints = 20) {
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      points.push(TrackHelper.calculateBezierPoint(p0, cp1, cp2, p1, t));
    }
    return points;
  }

  // Desenha a linha central azul
  renderCentralLine(points) {
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.strokeStyle = trackColorConfig.getColor("#0000FF");
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
      ctx.fillStyle = trackColorConfig.getColor("#FF0000");
      ctx.beginPath();
      const size = !trackColorConfig.useUniformColor ? 15 : 5;
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();

      if (!trackColorConfig.useUniformColor) {
        // Adiciona o número do índice
        ctx.fillStyle = trackColorConfig.getColor("white");
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(index.toString(), point.x, point.y);
      }
    });
  }

  render(points, outerPoints = null) {

    
    // 2. Desenha a linha central azul
    this.renderCentralLine(points);
    
    // 3. Desenha os pontos vermelhos numerados
    this.renderTrackPoints(points);
  }
} 