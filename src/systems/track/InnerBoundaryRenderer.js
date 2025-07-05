import { getBisectorPerpendicular, multiplyVector } from "../../utils/mathUtils.js";
import { TrackHelper } from "./TrackHelper.js";

export class InnerBoundaryRenderer {
  constructor(ctx, cellWidth) {
    this.ctx = ctx;
    this.cellWidth = cellWidth;
  }

  // Desenha as linhas verdes perpendiculares aos pontos da pista
  renderGreenLines(points) {
    const ctx = this.ctx;
    const cellWidth = this.cellWidth;

    points.forEach((currentPoint, index) => {
      const prevPoint = points[(index - 1 + points.length) % points.length];
      const nextPoint = points[(index + 1) % points.length];
      
      // Calcula o vetor perpendicular baseado na bissetriz
      const perpendicular = getBisectorPerpendicular(currentPoint, prevPoint, nextPoint);
      const scaledPerpendicular = multiplyVector(perpendicular, cellWidth);

      // Desenha a linha verde
      ctx.beginPath();
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.moveTo(currentPoint.x, currentPoint.y);
      ctx.lineTo(
        currentPoint.x + scaledPerpendicular.x,
        currentPoint.y + scaledPerpendicular.y
      );
      ctx.stroke();
    });
  }

  // Calcula os pontos finais das linhas verdes
  calculateGreenLinesEndPoints(points) {
    const cellWidth = this.cellWidth;

    return points.map((currentPoint, index) => {
      const prevPoint = points[(index - 1 + points.length) % points.length];
      const nextPoint = points[(index + 1) % points.length];
      const perpendicular = getBisectorPerpendicular(currentPoint, prevPoint, nextPoint);
      const scaledPerpendicular = multiplyVector(perpendicular, cellWidth);
      return {
        x: currentPoint.x + scaledPerpendicular.x,
        y: currentPoint.y + scaledPerpendicular.y
      };
    });
  }

  // Desenha a curva preta conectando os pontos finais das linhas verdes
  renderBlackCurve(outerPoints) {
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    
    // Move para o primeiro ponto externo
    ctx.moveTo(outerPoints[0].x, outerPoints[0].y);
    
    // Desenha as curvas de Bézier entre os pontos externos
    outerPoints.forEach((point, index) => {
      const prevPoint = outerPoints[(index - 1 + outerPoints.length) % outerPoints.length];
      const nextPoint = outerPoints[(index + 1) % outerPoints.length];
      const nextNextPoint = outerPoints[(index + 2) % outerPoints.length];
      
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

  render(points) {
    // 1. Desenha as linhas verdes
    this.renderGreenLines(points);
    
    // 2. Calcula os pontos finais das linhas verdes
    const outerPoints = this.calculateGreenLinesEndPoints(points);
    
    // 3. Desenha a curva preta
    this.renderBlackCurve(outerPoints);

    // Retorna os pontos da curva preta para uso pela próxima faixa
    return outerPoints;
  }
} 