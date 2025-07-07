import { TrackHelper } from "./TrackHelper.js";
import { trackColorConfig } from "../../config/TrackColorConfig.js";

export class MiddleBoundaryRenderer {
  constructor(ctx, cellWidth) {
    this.ctx = ctx;
    this.cellWidth = cellWidth;
  }

  // Renderiza o preenchimento das células usando as linhas azuis do inner boundary
  renderCellBackgroundWithInnerBoundaries(innerBoundaryLinesData, cellIndex, roxaPoints, azulPoints) {
    // if (cellIndex !== 0) return; // Por enquanto, processa apenas a célula 0
    
    const ctx = this.ctx;
    
    // Para o efeito "brick/tijolo", precisamos da célula atual e da próxima
    const currentCellIndex = cellIndex;
    const nextCellIndex = (cellIndex + 1) % innerBoundaryLinesData.length;
    
    const currentCellBoundary = innerBoundaryLinesData[currentCellIndex];  // Célula 0 (atual)
    const nextCellBoundary = innerBoundaryLinesData[nextCellIndex];  // Célula 1 (próxima)
    
    if (!currentCellBoundary || !nextCellBoundary) return;
    
    // Define a cor de preenchimento para a célula específica
    ctx.fillStyle = "rgba(0, 255, 0, 0.3)"; // Cor verde temporária para teste
    
    // Calcula a linha perpendicular correspondente da roxa boundary
    const currentRoxaPoint = roxaPoints[cellIndex];
    const nextRoxaPoint = roxaPoints[(cellIndex + 1) % roxaPoints.length];
    
    // Usa a função comum para calcular os pontos de controle da linha roxa
    const { cp1, cp2 } = this.calculateBoundaryCurveControlPoints(currentRoxaPoint, nextRoxaPoint, azulPoints, cellIndex);
    
    // Calcula pontos ao longo da curva da roxa boundary
    const roxaCurvePoints = this.calculateBezierCurvePoints(
      currentRoxaPoint, cp1, cp2, nextRoxaPoint, 15
    );
    
    // Calcula os pontos para o efeito "brick/tijolo"
    const midPointCurrent = Math.floor(currentCellBoundary.length / 2);
    const midPointNext = Math.floor(nextCellBoundary.length / 2);
    
    // Desenha o polígono da célula usando metade de cada linha azul + linha roxa
    ctx.beginPath();
    
    // 1. Desenha a segunda metade da linha azul da célula atual (célula 0)
    ctx.moveTo(currentCellBoundary[midPointCurrent].x, currentCellBoundary[midPointCurrent].y);
    for (let i = midPointCurrent + 1; i < currentCellBoundary.length; i++) {
      ctx.lineTo(currentCellBoundary[i].x, currentCellBoundary[i].y);
    }
    
    // 2. Desenha a primeira metade da linha azul da próxima célula (célula 1)
    for (let i = 0; i <= midPointNext; i++) {
      ctx.lineTo(nextCellBoundary[i].x, nextCellBoundary[i].y);
    }
    
    // 3. Conecta com a linha roxa da middle boundary
    ctx.lineTo(roxaCurvePoints[roxaCurvePoints.length - 1].x, roxaCurvePoints[roxaCurvePoints.length - 1].y);
    
    // 4. Desenha a linha roxa da middle boundary (de volta)
    for (let i = roxaCurvePoints.length - 2; i >= 0; i--) {
      ctx.lineTo(roxaCurvePoints[i].x, roxaCurvePoints[i].y);
    }
    
    // 5. Fecha o polígono
    ctx.closePath();
    ctx.fill();
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
      const prevPoint = points[(i - 1 + numPoints) % numPoints];
      
      // Calcula a direção perpendicular baseada na bissetriz
      const prevDirection = {
        x: currentPoint.x - prevPoint.x,
        y: currentPoint.y - prevPoint.y
      };
      const nextDirection = {
        x: nextPoint.x - currentPoint.x,
        y: nextPoint.y - currentPoint.y
      };
      
      // Normaliza as direções
      const prevLength = Math.sqrt(prevDirection.x * prevDirection.x + prevDirection.y * prevDirection.y);
      const nextLength = Math.sqrt(nextDirection.x * nextDirection.x + nextDirection.y * nextDirection.y);
      
      prevDirection.x /= prevLength;
      prevDirection.y /= prevLength;
      nextDirection.x /= nextLength;
      nextDirection.y /= nextLength;
      
      // Calcula a bissetriz
      const bisector = {
        x: (prevDirection.x + nextDirection.x) / 2,
        y: (prevDirection.y + nextDirection.y) / 2
      };
      
      // Normaliza a bissetriz
      const bisectorLength = Math.sqrt(bisector.x * bisector.x + bisector.y * bisector.y);
      if (bisectorLength > 0) {
        bisector.x /= bisectorLength;
        bisector.y /= bisectorLength;
      }
      
      // Calcula o perpendicular à bissetriz (direção para o centro da célula)
      const perpendicular = {
        x: bisector.y,
        y: -bisector.x
      };
      
      // Usa o currentPoint como base e adiciona um offset para o centro da célula
      const offset = this.cellWidth * 0.5; // Metade da largura da célula
      const centerX = currentPoint.x + perpendicular.x * offset;
      const centerY = currentPoint.y + perpendicular.y * offset;
      
      // Desenha o número da célula
      ctx.fillText(i.toString(), centerX, centerY);
    }
  }

  // Desenha as linhas perpendiculares nos pontos médios das curvas de fronteira
  renderPerpendicularLines(outerPoints) {
    const ctx = this.ctx;
    const cellWidth = this.cellWidth;

    ctx.strokeStyle = trackColorConfig.getColor("#FFA500");
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
      
      // Desenha a linha perpendicular
      ctx.beginPath();
      ctx.moveTo(midPoint.x, midPoint.y);
      ctx.lineTo(
        midPoint.x + perpendicular.x * cellWidth,
        midPoint.y + perpendicular.y * cellWidth
      );
      ctx.stroke();
    });
  }

  // Calcula os pontos finais das linhas perpendiculares
  calculatePerpendicularLinesEndPoints(outerPoints) {
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

  // Calcula os pontos de controle para uma curva de boundary específica
  calculateBoundaryCurveControlPoints(point, nextPoint, outerPoints, cellIndex) {
    // Encontra os pontos originais (na linha azul) correspondentes
    const origPoint = outerPoints[cellIndex];
    const origNextPoint = outerPoints[(cellIndex + 1) % outerPoints.length];

    // Calcula os vetores das linhas perpendiculares
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

    return { cp1, cp2 };
  }

  // Calcula os pontos da linha roxa (boundary) para uma célula específica
  calculateCellBoundaryPoints(roxaPoints, cellIndex, outerPoints, numPointsPerCell = 20) {
    const point = roxaPoints[cellIndex];
    const nextPoint = roxaPoints[(cellIndex + 1) % roxaPoints.length];
    
    // Usa a função comum para calcular os pontos de controle
    const { cp1, cp2 } = this.calculateBoundaryCurveControlPoints(point, nextPoint, outerPoints, cellIndex);

    // Calcula múltiplos pontos ao longo da curva de Bézier
    const boundaryPoints = [];
    for (let i = 0; i <= numPointsPerCell; i++) {
      const t = i / numPointsPerCell;
      boundaryPoints.push(TrackHelper.calculateBezierPoint(point, cp1, cp2, nextPoint, t));
    }
    
    return boundaryPoints;
  }

  // Desenha as curvas de fronteira conectando os pontos finais das linhas perpendiculares
  renderBoundaryLines(outerMostPoints, outerPoints) {
    const ctx = this.ctx;

    ctx.strokeStyle = trackColorConfig.getColor("#800080"); // Roxo
    ctx.lineWidth = 2;
    
    // Desenha as curvas de Bézier conectando os pontos
    ctx.beginPath();
    ctx.moveTo(outerMostPoints[0].x, outerMostPoints[0].y);
    
    outerMostPoints.forEach((point, index) => {
      const prevPoint = outerMostPoints[(index - 1 + outerMostPoints.length) % outerMostPoints.length];
      const nextPoint = outerMostPoints[(index + 1) % outerMostPoints.length];
      
      // Usa a função comum para calcular os pontos de controle
      const { cp1, cp2 } = this.calculateBoundaryCurveControlPoints(point, nextPoint, outerPoints, index);

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

  render(outerPoints, outerMostPoints = null, innerBoundaryLinesData = null) {
    // 1. Primeiro calcula os pontos finais das linhas perpendiculares (roxa boundary)
    const calculatedOuterMostPoints = this.calculatePerpendicularLinesEndPoints(outerPoints);
    
    // 2. Renderiza o preenchimento das células usando as linhas azuis do inner boundary
    if (innerBoundaryLinesData) {
      for (let i = 0; i < innerBoundaryLinesData.length; i++) {
        this.renderCellBackgroundWithInnerBoundaries(innerBoundaryLinesData, i, calculatedOuterMostPoints, outerPoints);
      }
    }
    
    // 3. Renderiza o preenchimento das células se outerMostPoints for fornecido
    if (outerMostPoints) {
      this.renderCellNumbers(outerPoints, outerMostPoints);
    }
    
    // 4. Desenha as linhas perpendiculares
    this.renderPerpendicularLines(outerPoints);
    
    // 5. Desenha as curvas de fronteira
    this.renderBoundaryLines(calculatedOuterMostPoints, outerPoints);

    // 6. Calcula os pontos das linhas roxas para cada célula usando os pontos da linha roxa
    const boundaryLinesData = [];
    for (let i = 0; i < calculatedOuterMostPoints.length; i++) {
      boundaryLinesData.push(this.calculateCellBoundaryPoints(calculatedOuterMostPoints, i, outerPoints));
    }

    // Retorna os pontos da curva de fronteira E os dados das linhas roxas para uso pela próxima faixa
    return {
      boundaryPoints: calculatedOuterMostPoints,
      boundaryLinesData: boundaryLinesData
    };
  }
} 