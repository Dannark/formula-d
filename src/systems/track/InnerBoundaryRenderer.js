import { getBisectorPerpendicular, multiplyVector } from "../../utils/mathUtils.js";
import { TrackHelper } from "./TrackHelper.js";
import { trackColorConfig } from "../../config/TrackColorConfig.js";

export class InnerBoundaryRenderer {
  constructor(ctx, cellWidth) {
    this.ctx = ctx;
    this.cellWidth = cellWidth;
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

  // Renderiza o preenchimento das células da segunda faixa
  renderCellBackground(points, outerPoints) {
    const ctx = this.ctx;
    const numPoints = points.length;
    
    // Define a cor de preenchimento para a segunda faixa
    ctx.fillStyle = "rgba(144, 238, 144, 0.3)"; // nunca use trackColorConfig.getColor aqui
    
    // Para cada célula, cria um polígono e preenche
    for (let i = 0; i < numPoints; i++) {
      const currentPoint = points[i];
      const nextPoint = points[(i + 1) % numPoints];
      const currentOuterPoint = outerPoints[i];
      const nextOuterPoint = outerPoints[(i + 1) % numPoints];
      
      // Calcula os pontos de controle para as curvas
      const prevPoint = points[(i - 1 + numPoints) % numPoints];
      const nextNextPoint = points[(i + 2) % numPoints];
      const innerControlPoints = TrackHelper.calculateControlPoints(currentPoint, nextPoint, prevPoint, nextNextPoint);
      
      const prevOuterPoint = outerPoints[(i - 1 + numPoints) % numPoints];
      const nextNextOuterPoint = outerPoints[(i + 2) % numPoints];
      const outerControlPoints = TrackHelper.calculateControlPoints(currentOuterPoint, nextOuterPoint, prevOuterPoint, nextNextOuterPoint);
      
      // Calcula pontos ao longo da curva interna
      const innerCurvePoints = this.calculateBezierCurvePoints(
        currentPoint, innerControlPoints.cp1, innerControlPoints.cp2, nextPoint, 15
      );
      
      // Calcula pontos ao longo da curva externa
      const outerCurvePoints = this.calculateBezierCurvePoints(
        currentOuterPoint, outerControlPoints.cp1, outerControlPoints.cp2, nextOuterPoint, 15
      );
      
      // Desenha o polígono da célula
      ctx.beginPath();
      
      // Desenha a curva interna (da direita para a esquerda)
      ctx.moveTo(innerCurvePoints[0].x, innerCurvePoints[0].y);
      for (let j = 1; j < innerCurvePoints.length; j++) {
        ctx.lineTo(innerCurvePoints[j].x, innerCurvePoints[j].y);
      }
      
      // Conecta com a curva externa
      ctx.lineTo(outerCurvePoints[outerCurvePoints.length - 1].x, outerCurvePoints[outerCurvePoints.length - 1].y);
      
      // Desenha a curva externa (da esquerda para a direita)
      for (let j = outerCurvePoints.length - 2; j >= 0; j--) {
        ctx.lineTo(outerCurvePoints[j].x, outerCurvePoints[j].y);
      }
      
      // Fecha o polígono
      ctx.closePath();
      ctx.fill();
    }
  }

  // Renderiza os números das células no centro
  renderCellNumbers(points, outerPoints) {
    const ctx = this.ctx;
    const numPoints = points.length;
    
    // Configuração do texto
    ctx.fillStyle = ("rgba(0, 0, 0, 0.2)");
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Para cada célula, calcula o centro e desenha o número
    for (let i = 0; i < numPoints; i++) {
      const currentPoint = points[i];
      const nextPoint = points[(i + 1) % numPoints];
      const currentOuterPoint = outerPoints[i];
      const nextOuterPoint = outerPoints[(i + 1) % numPoints];
      
      // Calcula o ponto central da célula
      const centerX = (currentPoint.x + nextPoint.x + currentOuterPoint.x + nextOuterPoint.x) / 4;
      const centerY = (currentPoint.y + nextPoint.y + currentOuterPoint.y + nextOuterPoint.y) / 4;
      
      // Desenha o número da célula
      ctx.fillText(i.toString(), centerX, centerY);
    }
  }

  // Desenha as linhas perpendiculares aos pontos da pista
  renderPerpendicularLines(points) {
    const ctx = this.ctx;
    const cellWidth = this.cellWidth;

    points.forEach((currentPoint, index) => {
      const prevPoint = points[(index - 1 + points.length) % points.length];
      const nextPoint = points[(index + 1) % points.length];
      
      // Calcula o vetor perpendicular baseado na bissetriz
      const perpendicular = getBisectorPerpendicular(currentPoint, prevPoint, nextPoint);
      const scaledPerpendicular = multiplyVector(perpendicular, cellWidth);

      // Desenha a linha perpendicular
      ctx.beginPath();
      ctx.strokeStyle = trackColorConfig.getColor("#00FF00");
      ctx.lineWidth = 2;
      ctx.moveTo(currentPoint.x, currentPoint.y);
      ctx.lineTo(
        currentPoint.x + scaledPerpendicular.x,
        currentPoint.y + scaledPerpendicular.y
      );
      ctx.stroke();
    });
  }

  // Calcula os pontos finais das linhas perpendiculares
  calculatePerpendicularLinesEndPoints(points) {
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

  // Desenha a curva de fronteira conectando os pontos finais das linhas perpendiculares
  renderBoundaryLines(outerPoints) {
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.strokeStyle = trackColorConfig.getColor("#000000");
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

  render(points, outerPoints = null) {
    // 1. Renderiza o preenchimento das células se outerPoints for fornecido
    if (outerPoints) {
      this.renderCellBackground(points, outerPoints);
      this.renderCellNumbers(points, outerPoints);
    }
    
    // 2. Desenha as linhas perpendiculares
    this.renderPerpendicularLines(points);
    
    // 3. Calcula os pontos finais das linhas perpendiculares
    const calculatedOuterPoints = this.calculatePerpendicularLinesEndPoints(points);
    
    // 4. Desenha a curva de fronteira
    this.renderBoundaryLines(calculatedOuterPoints);

    // Retorna os pontos da curva de fronteira para uso pela próxima faixa
    return calculatedOuterPoints;
  }
} 