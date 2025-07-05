import { TrackHelper } from "./TrackHelper.js";

export class MiddleBoundaryRenderer {
  constructor(ctx, cellWidth) {
    this.ctx = ctx;
    this.cellWidth = cellWidth;
  }

  // Desenha as linhas laranjas nos pontos médios das curvas de Bézier pretas
  renderOrangeLines(outerPoints) {
    const ctx = this.ctx;
    const cellWidth = this.cellWidth;

    ctx.strokeStyle = "#FFA500";
    ctx.lineWidth = 2;

    outerPoints.forEach((point, index) => {
      const prevPoint = outerPoints[(index - 1 + outerPoints.length) % outerPoints.length];
      const nextPoint = outerPoints[(index + 1) % outerPoints.length];
      const nextNextPoint = outerPoints[(index + 2) % outerPoints.length];
      
      const controlPoints = TrackHelper.calculateControlPoints(point, nextPoint, prevPoint, nextNextPoint);
      
      // Calcula o ponto médio da curva de Bézier (t = 0.5)
      const midPoint = TrackHelper.calculateBezierPoint(point, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Calcula a direção tangente no ponto médio
      const tangent = TrackHelper.calculateBezierTangent(point, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Calcula o vetor perpendicular à tangente
      const perpendicular = {
        x: tangent.y,
        y: -tangent.x
      };
      
      // Desenha a linha laranja
      ctx.beginPath();
      ctx.moveTo(midPoint.x, midPoint.y);
      ctx.lineTo(
        midPoint.x + perpendicular.x * cellWidth,
        midPoint.y + perpendicular.y * cellWidth
      );
      ctx.stroke();
    });
  }

  // Calcula os pontos finais das linhas laranjas
  calculateOrangeLinesEndPoints(outerPoints) {
    const cellWidth = this.cellWidth;

    return outerPoints.map((point, index) => {
      const prevPoint = outerPoints[(index - 1 + outerPoints.length) % outerPoints.length];
      const nextPoint = outerPoints[(index + 1) % outerPoints.length];
      const nextNextPoint = outerPoints[(index + 2) % outerPoints.length];
      
      const controlPoints = TrackHelper.calculateControlPoints(point, nextPoint, prevPoint, nextNextPoint);
      const midPoint = TrackHelper.calculateBezierPoint(point, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      const tangent = TrackHelper.calculateBezierTangent(point, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      const perpendicular = {
        x: tangent.y,
        y: -tangent.x
      };
      
      return {
        x: midPoint.x + perpendicular.x * cellWidth,
        y: midPoint.y + perpendicular.y * cellWidth
      };
    });
  }

  // Desenha as curvas roxas conectando os pontos finais das linhas laranjas
  renderPurpleCurves(outerMostPoints, outerPoints) {
    const ctx = this.ctx;

    ctx.strokeStyle = "#800080"; // Roxo
    ctx.lineWidth = 2;
    
    // Desenha as curvas de Bézier roxas conectando os pontos
    ctx.beginPath();
    ctx.moveTo(outerMostPoints[0].x, outerMostPoints[0].y);
    
    outerMostPoints.forEach((point, index) => {
      const prevPoint = outerMostPoints[(index - 1 + outerMostPoints.length) % outerMostPoints.length];
      const nextPoint = outerMostPoints[(index + 1) % outerMostPoints.length];
      
      // Encontra os pontos originais (na linha preta) correspondentes
      const origPoint = outerPoints[index];
      const origPrevPoint = outerPoints[(index - 1 + outerPoints.length) % outerPoints.length];
      const origNextPoint = outerPoints[(index + 1) % outerPoints.length];

      // Calcula os vetores das linhas laranjas (perpendiculares)
      const orangeVector1 = {
        x: point.x - origPoint.x,
        y: point.y - origPoint.y
      };
      const orangeVector2 = {
        x: nextPoint.x - origNextPoint.x,
        y: nextPoint.y - origNextPoint.y
      };

      // Normaliza os vetores
      const length1 = Math.sqrt(orangeVector1.x * orangeVector1.x + orangeVector1.y * orangeVector1.y);
      const length2 = Math.sqrt(orangeVector2.x * orangeVector2.x + orangeVector2.y * orangeVector2.y);
      
      orangeVector1.x /= length1;
      orangeVector1.y /= length1;
      orangeVector2.x /= length2;
      orangeVector2.y /= length2;

      // Calcula o ângulo entre as linhas laranjas
      const dotProduct = orangeVector1.x * orangeVector2.x + orangeVector1.y * orangeVector2.y;
      const angle = Math.acos(Math.min(1, Math.max(-1, dotProduct)));
      
      // Determina a direção da curva usando o produto vetorial
      const crossProduct = orangeVector1.x * orangeVector2.y - orangeVector1.y * orangeVector2.x;
      const curveDirection = -Math.sign(crossProduct); // Invertido para corresponder à direção desejada
      
      // Calcula a direção do segmento atual
      const direction = {
        x: nextPoint.x - point.x,
        y: nextPoint.y - point.y
      };
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      direction.x /= length;
      direction.y /= length;

      // Calcula o vetor perpendicular
      const perpendicular = {
        x: -direction.y,
        y: direction.x
      };

      // Ajusta o offset baseado no ângulo entre as linhas laranjas
      const angleFactor = Math.sin(angle / 2); // 0 para linhas paralelas, 1 para ângulo de 180°
      
      // Fatores adaptativos baseados na curvatura
      const curvatureIntensity = Math.pow(angleFactor, 1); // Suaviza a transição
      const basePerpendicularFactor = 0.1;
      const maxPerpendicularFactor = 0.8;
      const baseControlFactor = 0.25;
      const maxControlFactor = 0.5;
      
      // Interpola os fatores baseado na curvatura
      const perpendicularFactor = basePerpendicularFactor + (maxPerpendicularFactor - basePerpendicularFactor) * curvatureIntensity;
      const controlFactor = baseControlFactor + (maxControlFactor - baseControlFactor) * curvatureIntensity;
      
      const perpendicularOffset = length * perpendicularFactor * angleFactor * curveDirection;
      const controlDistance = length * controlFactor;

      const cp1 = {
        x: point.x + direction.x * controlDistance + perpendicular.x * perpendicularOffset,
        y: point.y + direction.y * controlDistance + perpendicular.y * perpendicularOffset
      };
      
      const cp2 = {
        x: nextPoint.x - direction.x * controlDistance + perpendicular.x * perpendicularOffset,
        y: nextPoint.y - direction.y * controlDistance + perpendicular.y * perpendicularOffset
      };

      ctx.bezierCurveTo(
        cp1.x,
        cp1.y,
        cp2.x,
        cp2.y,
        nextPoint.x,
        nextPoint.y
      );
    });
    
    ctx.stroke();
  }

  render(outerPoints) {
    // 1. Desenha as linhas laranjas
    this.renderOrangeLines(outerPoints);
    
    // 2. Calcula os pontos finais das linhas laranjas
    const outerMostPoints = this.calculateOrangeLinesEndPoints(outerPoints);
    
    // 3. Desenha as curvas roxas
    this.renderPurpleCurves(outerMostPoints, outerPoints);

    // Retorna os pontos da curva roxa para uso pela próxima faixa
    return outerMostPoints;
  }
} 