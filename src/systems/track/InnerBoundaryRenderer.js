import { getBisectorPerpendicular, multiplyVector } from "../../utils/mathUtils.js";
import { TrackHelper } from "./TrackHelper.js";
import { trackColorConfig } from "../../config/TrackColorConfig.js";

export class InnerBoundaryRenderer {
  constructor(ctx, cellWidth) {
    this.ctx = ctx;
    this.cellWidth = cellWidth;
  }

  // Renderiza o preenchimento das células usando as linhas centrais azuis
  renderCellBackgroundWithBasePoints(baseBoundaryLinesData, cellIndex, azulPoints, centralPoints, selectedCellId = null) {
    const ctx = this.ctx;
    
    // Para a primeira faixa, cada célula corresponde diretamente a uma célula da linha central
    const currentCellBoundary = baseBoundaryLinesData[cellIndex];
    
    if (!currentCellBoundary) return;
    
    // Verifica se esta célula está selecionada
    const isSelected = selectedCellId && 
                      selectedCellId.type === 'inner' && 
                      selectedCellId.index === cellIndex;
    
    // Define a cor de preenchimento para a célula específica
    if (isSelected) {
      ctx.fillStyle = "rgba(255, 255, 0, 0.6)"; // Cor amarela brilhante para célula selecionada
    } else {
      ctx.fillStyle = trackColorConfig.useUniformColor ? "rgba(210, 210, 210, 1)" : "rgba(0, 0, 255, 0.2)"; // Cor azul normal
    }
    
    // Calcula a linha perpendicular correspondente da azul boundary
    const currentAzulPoint = azulPoints[cellIndex];
    const nextAzulPoint = azulPoints[(cellIndex + 1) % azulPoints.length];
    
    // Calcula os pontos de controle para a curva da azul boundary
    const prevAzulPoint = azulPoints[(cellIndex - 1 + azulPoints.length) % azulPoints.length];
    const nextNextAzulPoint = azulPoints[(cellIndex + 2) % azulPoints.length];
    const azulControlPoints = TrackHelper.calculateControlPoints(currentAzulPoint, nextAzulPoint, prevAzulPoint, nextNextAzulPoint);
    
    // Calcula pontos ao longo da curva da azul boundary
    const azulCurvePoints = this.calculateBezierCurvePoints(
      currentAzulPoint, azulControlPoints.cp1, azulControlPoints.cp2, nextAzulPoint, 15
    );
    
    // Desenha o polígono da célula usando uma linha central completa + linha azul
    ctx.beginPath();
    
    // 1. Desenha a linha central completa da célula atual
    ctx.moveTo(currentCellBoundary[0].x, currentCellBoundary[0].y);
    for (let i = 1; i < currentCellBoundary.length; i++) {
      ctx.lineTo(currentCellBoundary[i].x, currentCellBoundary[i].y);
    }
    
    // 2. Conecta com a linha azul da inner boundary
    ctx.lineTo(azulCurvePoints[azulCurvePoints.length - 1].x, azulCurvePoints[azulCurvePoints.length - 1].y);
    
    // 3. Desenha a linha azul da inner boundary (de volta)
    for (let i = azulCurvePoints.length - 2; i >= 0; i--) {
      ctx.lineTo(azulCurvePoints[i].x, azulCurvePoints[i].y);
    }
    
    // 4. Fecha o polígono
    ctx.closePath();
    ctx.fill();
    
    // Adiciona borda extra se selecionada
    if (isSelected) {
      ctx.strokeStyle = "rgba(255, 215, 0, 0.8)"; // Cor dourada para a borda
      ctx.lineWidth = 3;
      ctx.stroke();
    }
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

  // Calcula os pontos da linha azul (boundary) para uma célula específica
  calculateCellBoundaryPoints(azulPoints, cellIndex, numPointsPerCell = 20) {
    const point = azulPoints[cellIndex];
    const nextPoint = azulPoints[(cellIndex + 1) % azulPoints.length];
    const prevPoint = azulPoints[(cellIndex - 1 + azulPoints.length) % azulPoints.length];
    const nextNextPoint = azulPoints[(cellIndex + 2) % azulPoints.length];
    
    const controlPoints = TrackHelper.calculateControlPoints(point, nextPoint, prevPoint, nextNextPoint);
    
    // Calcula múltiplos pontos ao longo da curva de Bézier
    const boundaryPoints = [];
    for (let i = 0; i <= numPointsPerCell; i++) {
      const t = i / numPointsPerCell;
      boundaryPoints.push(TrackHelper.calculateBezierPoint(point, controlPoints.cp1, controlPoints.cp2, nextPoint, t));
    }
    
    return boundaryPoints;
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

  render(points, outerPoints = null, baseBoundaryLinesData = null, selectedCellId = null) {
    // 1. Primeiro calcula os pontos finais das linhas perpendiculares (azul boundary)
    const calculatedOuterPoints = this.calculatePerpendicularLinesEndPoints(points);
    
    // 2. Renderiza o preenchimento das células usando as linhas centrais azuis do base
    if (baseBoundaryLinesData) {
      for (let i = 0; i < baseBoundaryLinesData.length; i++) {
        this.renderCellBackgroundWithBasePoints(baseBoundaryLinesData, i, calculatedOuterPoints, points, selectedCellId);
      }
    }
    
    // 3. Renderiza o preenchimento das células se outerPoints for fornecido
    if (outerPoints) {
      this.renderCellNumbers(points, outerPoints);
    }
    
    // 4. Desenha as linhas perpendiculares
    this.renderPerpendicularLines(points);
    
    // 5. Desenha a curva de fronteira
    this.renderBoundaryLines(calculatedOuterPoints);

    // 6. Calcula os pontos das linhas azuis para cada célula
    const boundaryLinesData = [];
    for (let i = 0; i < calculatedOuterPoints.length; i++) {
      boundaryLinesData.push(this.calculateCellBoundaryPoints(calculatedOuterPoints, i));
    }

    // Retorna os pontos da curva de fronteira E os dados das linhas azuis para uso pela próxima faixa
    return {
      boundaryPoints: calculatedOuterPoints,
      boundaryLinesData: boundaryLinesData || []
    };
  }
} 