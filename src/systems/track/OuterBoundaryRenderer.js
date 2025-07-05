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
    const distanceThreshold = 230;

    ctx.lineWidth = 2;
    
    // Armazena informações sobre células grandes para posterior processamento
    this.largeCells = [];
    
    outerMostPoints.forEach((point, index) => {
      const nextPoint = outerMostPoints[(index + 1) % outerMostPoints.length];
      const prevPoint = outerMostPoints[(index - 1 + outerMostPoints.length) % outerMostPoints.length];
      
      // Calcula a distância entre o ponto atual e o próximo ponto
      const distanceToNext = Math.sqrt(
        Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
      );
      
      // // Calcula a distância entre o ponto anterior e o atual
      // const distanceToPrev = Math.sqrt(
      //   Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
      // );
      
      const isLargeCell = distanceToNext > distanceThreshold;
      // Define a cor baseada na distância
      if (isLargeCell ) {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.1)";
        // Armazena informações da célula grande para desenhar linhas extras depois
        this.largeCells.push({
          point,
          nextPoint,
          index,
          origPoint: outerPoints[index],
          origNextPoint: outerPoints[(index + 1) % outerPoints.length]
        });
      } else {
        ctx.strokeStyle = "red";
      }
      
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

  // Desenha linhas perpendiculares adicionais para dividir células grandes
  renderAdditionalPerpendicularLines(finalBoundaryPoints) {
    if (!this.largeCells || this.largeCells.length === 0) return;
    
    const ctx = this.ctx;
    const cellWidth = this.cellWidth;
    
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    
    this.largeCells.forEach(cellInfo => {
      const { point, nextPoint, index, origPoint, origNextPoint } = cellInfo;
      
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

      // === LINHA DA DIREITA ===
      // Desenha a linha perpendicular adicional da direita
      const tRight = 0.8; // Posição da linha da direita
      
      // Calcula o ponto na curva de fronteira
      const midPointRight = TrackHelper.calculateBezierPoint(point, cp1, cp2, nextPoint, tRight);
      
      // Calcula a direção tangente no ponto
      const tangentRight = TrackHelper.calculateBezierTangent(point, cp1, cp2, nextPoint, tRight);
      
      // Calcula o vetor perpendicular à tangente
      const midPerpendicularRight = {
        x: tangentRight.y,
        y: -tangentRight.x
      };
      
      // Calcula o ponto final correspondente na linha cinza da célula atual
      const finalPoint1 = finalBoundaryPoints[index];
      const finalPoint2 = finalBoundaryPoints[(index + 1) % finalBoundaryPoints.length];
      const finalPrevPoint = finalBoundaryPoints[(index - 1 + finalBoundaryPoints.length) % finalBoundaryPoints.length];
      const finalNextNextPoint = finalBoundaryPoints[(index + 2) % finalBoundaryPoints.length];
      
      // Calcula os pontos de controle da curva cinza da célula atual
      const finalControlPoints = TrackHelper.calculateControlPoints(finalPoint1, finalPoint2, finalPrevPoint, finalNextNextPoint);
      
      // Calcula o ponto na curva cinza
      const finalMidPointRight = TrackHelper.calculateBezierPoint(finalPoint1, finalControlPoints.cp1, finalControlPoints.cp2, finalPoint2, 0.36);
      
      // Desenha a linha perpendicular da direita
      ctx.beginPath();
      ctx.moveTo(midPointRight.x, midPointRight.y);
      ctx.lineTo(finalMidPointRight.x, finalMidPointRight.y);
      ctx.stroke();

      // === LINHA DA ESQUERDA ===
      // Desenha a linha perpendicular adicional da esquerda
      const tLeft = 0.2; // Posição da linha da esquerda
      
      // Calcula o ponto na curva de fronteira
      const midPointLeft = TrackHelper.calculateBezierPoint(point, cp1, cp2, nextPoint, tLeft);
      
      // Calcula a direção tangente no ponto
      const tangentLeft = TrackHelper.calculateBezierTangent(point, cp1, cp2, nextPoint, tLeft);
      
      // Calcula o vetor perpendicular à tangente
      const midPerpendicularLeft = {
        x: tangentLeft.y,
        y: -tangentLeft.x
      };
      
      // Calcula o ponto final correspondente na linha cinza da célula ANTERIOR
      const finalLeftPoint1 = finalBoundaryPoints[(index - 1 + finalBoundaryPoints.length) % finalBoundaryPoints.length];
      const finalLeftPoint2 = finalBoundaryPoints[index];
      const finalLeftPrevPoint = finalBoundaryPoints[(index - 2 + finalBoundaryPoints.length) % finalBoundaryPoints.length];
      const finalLeftNextNextPoint = finalBoundaryPoints[(index + 1) % finalBoundaryPoints.length];
      
      // Calcula os pontos de controle da curva cinza da célula anterior
      const finalLeftControlPoints = TrackHelper.calculateControlPoints(finalLeftPoint1, finalLeftPoint2, finalLeftPrevPoint, finalLeftNextNextPoint);
      
      // Calcula o ponto na curva cinza da célula anterior
      const finalMidPointLeft = TrackHelper.calculateBezierPoint(finalLeftPoint1, finalLeftControlPoints.cp1, finalLeftControlPoints.cp2, finalLeftPoint2, 0.64);
      
      // Desenha a linha perpendicular da esquerda
      ctx.beginPath();
      ctx.moveTo(midPointLeft.x, midPointLeft.y);
      ctx.lineTo(finalMidPointLeft.x, finalMidPointLeft.y);
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
    
    // 4. Desenha as linhas perpendiculares adicionais para células grandes
    this.renderAdditionalPerpendicularLines(finalBoundaryPoints);
  }
} 