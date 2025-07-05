import { TrackHelper } from "./TrackHelper.js";

export class OuterBoundaryRenderer {
  constructor(ctx, cellWidth) {
    this.ctx = ctx;
    this.cellWidth = cellWidth;
  }

  // Desenha as linhas perpendiculares aos pontos médios das curvas de fronteira
  renderPerpendicularLines(outerMostPoints, outerPoints) {
    const ctx = this.ctx;
    const cellWidth = this.cellWidth;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    
    outerMostPoints.forEach((point, index) => {
      const nextPoint = outerMostPoints[(index + 1) % outerMostPoints.length];
      
      // Encontra os pontos originais correspondentes
      const origPoint = outerPoints[index];
      const origNextPoint = outerPoints[(index + 1) % outerPoints.length];

      // Calcula os vetores das linhas perpendiculares anteriores
      const perpendicularVector1 = {
        x: point.x - origPoint.x,
        y: point.y - origPoint.y
      };
      const perpendicularVector2 = {
        x: nextPoint.x - origNextPoint.x,
        y: nextPoint.y - origNextPoint.y
      };

      // Normaliza os vetores
      const length1 = Math.sqrt(perpendicularVector1.x * perpendicularVector1.x + perpendicularVector1.y * perpendicularVector1.y);
      const length2 = Math.sqrt(perpendicularVector2.x * perpendicularVector2.x + perpendicularVector2.y * perpendicularVector2.y);
      
      perpendicularVector1.x /= length1;
      perpendicularVector1.y /= length1;
      perpendicularVector2.x /= length2;
      perpendicularVector2.y /= length2;

      // Calcula o ângulo entre as linhas perpendiculares
      const dotProduct = perpendicularVector1.x * perpendicularVector2.x + perpendicularVector1.y * perpendicularVector2.y;
      const angle = Math.acos(Math.min(1, Math.max(-1, dotProduct)));
      
      // Determina a direção da curva usando o produto vetorial
      const crossProduct = perpendicularVector1.x * perpendicularVector2.y - perpendicularVector1.y * perpendicularVector2.x;
      const curveDirection = -Math.sign(crossProduct);
      
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

      // Ajusta o offset baseado no ângulo entre as linhas perpendiculares
      const angleFactor = Math.sin(angle / 2);
      
      // Fatores adaptativos baseados na curvatura
      const curvatureIntensity = Math.pow(angleFactor, 1);
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

      // Calcula o ponto médio da curva de fronteira usando os pontos de controle
      const midPoint = TrackHelper.calculateBezierPoint(point, cp1, cp2, nextPoint, 0.5);
      
      // Calcula a direção tangente no ponto médio
      const tangent = TrackHelper.calculateBezierTangent(point, cp1, cp2, nextPoint, 0.5);
      
      // Calcula o vetor perpendicular à tangente
      const midPerpendicular = {
        x: tangent.y,
        y: -tangent.x
      };
      
      // Desenha a linha perpendicular a partir do ponto médio
      ctx.beginPath();
      ctx.moveTo(midPoint.x, midPoint.y);
      ctx.lineTo(
        midPoint.x + midPerpendicular.x * cellWidth,
        midPoint.y + midPerpendicular.y * cellWidth
      );
      ctx.stroke();
    });
  }

  // Calcula os pontos finais das linhas perpendiculares
  calculatePerpendicularLinesEndPoints(outerMostPoints, outerPoints) {
    const cellWidth = this.cellWidth;
    
    return outerMostPoints.map((point, index) => {
      const nextPoint = outerMostPoints[(index + 1) % outerMostPoints.length];
      
      // Encontra os pontos originais correspondentes
      const origPoint = outerPoints[index];
      const origNextPoint = outerPoints[(index + 1) % outerPoints.length];

      // Calcula os vetores das linhas perpendiculares anteriores
      const perpendicularVector1 = {
        x: point.x - origPoint.x,
        y: point.y - origPoint.y
      };
      const perpendicularVector2 = {
        x: nextPoint.x - origNextPoint.x,
        y: nextPoint.y - origNextPoint.y
      };

      // Normaliza os vetores
      const length1 = Math.sqrt(perpendicularVector1.x * perpendicularVector1.x + perpendicularVector1.y * perpendicularVector1.y);
      const length2 = Math.sqrt(perpendicularVector2.x * perpendicularVector2.x + perpendicularVector2.y * perpendicularVector2.y);
      
      perpendicularVector1.x /= length1;
      perpendicularVector1.y /= length1;
      perpendicularVector2.x /= length2;
      perpendicularVector2.y /= length2;

      // Calcula o ângulo entre as linhas perpendiculares
      const dotProduct = perpendicularVector1.x * perpendicularVector2.x + perpendicularVector1.y * perpendicularVector2.y;
      const angle = Math.acos(Math.min(1, Math.max(-1, dotProduct)));
      
      // Determina a direção da curva usando o produto vetorial
      const crossProduct = perpendicularVector1.x * perpendicularVector2.y - perpendicularVector1.y * perpendicularVector2.x;
      const curveDirection = -Math.sign(crossProduct);
      
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

      // Ajusta o offset baseado no ângulo entre as linhas perpendiculares
      const angleFactor = Math.sin(angle / 2);
      
      // Fatores adaptativos baseados na curvatura
      const curvatureIntensity = Math.pow(angleFactor, 1);
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

      // Calcula o ponto médio da curva de fronteira usando os pontos de controle
      const midPoint = TrackHelper.calculateBezierPoint(point, cp1, cp2, nextPoint, 0.5);
      
      // Calcula a direção tangente no ponto médio
      const tangent = TrackHelper.calculateBezierTangent(point, cp1, cp2, nextPoint, 0.5);
      
      // Calcula o vetor perpendicular à tangente
      const midPerpendicular = {
        x: tangent.y,
        y: -tangent.x
      };
      
      // Retorna o ponto final da linha perpendicular
      return {
        x: midPoint.x + midPerpendicular.x * cellWidth,
        y: midPoint.y + midPerpendicular.y * cellWidth
      };
    });
  }

  // Desenha as curvas de fronteira conectando os pontos finais das linhas perpendiculares
  renderBoundaryLines(outerMostPoints) {
    const ctx = this.ctx;

    ctx.strokeStyle = "gray";
    ctx.lineWidth = 2;
    
    // Desenha as curvas de Bézier conectando os pontos finais das linhas perpendiculares
    ctx.beginPath();
    ctx.moveTo(outerMostPoints[0].x, outerMostPoints[0].y);
    
    outerMostPoints.forEach((point, index) => {
      const nextPoint = outerMostPoints[(index + 1) % outerMostPoints.length];
      const prevPoint = outerMostPoints[(index - 1 + outerMostPoints.length) % outerMostPoints.length];
      const nextNextPoint = outerMostPoints[(index + 2) % outerMostPoints.length];
      
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

  render(outerMostPoints, outerPoints) {
    // 1. Desenha as linhas perpendiculares
    this.renderPerpendicularLines(outerMostPoints, outerPoints);
    
    // 2. Calcula os pontos finais das linhas perpendiculares
    const finalBoundaryPoints = this.calculatePerpendicularLinesEndPoints(outerMostPoints, outerPoints);
    
    // 3. Desenha as curvas de fronteira
    this.renderBoundaryLines(finalBoundaryPoints);
  }
} 