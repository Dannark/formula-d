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

  // Renderiza o preenchimento das células da primeira faixa
  renderCellBackground(points, outerPoints) {
    const ctx = this.ctx;
    const numPoints = points.length;
    
    // Define a cor de preenchimento para a primeira faixa
    ctx.fillStyle = trackColorConfig.getColor("rgba(135, 206, 235, 0.3)"); // Azul claro semi-transparente
    
    // Para cada célula, cria um polígono e preenche
    for (let i = 0; i < numPoints; i++) {
      const currentPoint = points[i];
      const nextPoint = points[(i + 1) % numPoints];
      const currentOuterPoint = outerPoints[i];
      const nextOuterPoint = outerPoints[(i + 1) % numPoints];
      
      // Calcula os pontos de controle para as curvas
      const prevPoint = points[(i - 1 + numPoints) % numPoints];
      const nextNextPoint = points[(i + 2) % numPoints];
      const centralControlPoints = TrackHelper.calculateControlPoints(currentPoint, nextPoint, prevPoint, nextNextPoint);
      
      const prevOuterPoint = outerPoints[(i - 1 + numPoints) % numPoints];
      const nextNextOuterPoint = outerPoints[(i + 2) % numPoints];
      const outerControlPoints = TrackHelper.calculateControlPoints(currentOuterPoint, nextOuterPoint, prevOuterPoint, nextNextOuterPoint);
      
      // Calcula pontos ao longo da curva central
      const centralCurvePoints = this.calculateBezierCurvePoints(
        currentPoint, centralControlPoints.cp1, centralControlPoints.cp2, nextPoint, 15
      );
      
      // Calcula pontos ao longo da curva externa
      const outerCurvePoints = this.calculateBezierCurvePoints(
        currentOuterPoint, outerControlPoints.cp1, outerControlPoints.cp2, nextOuterPoint, 15
      );
      
      // Desenha o polígono da célula
      ctx.beginPath();
      
      // Desenha a curva central (da direita para a esquerda)
      ctx.moveTo(centralCurvePoints[0].x, centralCurvePoints[0].y);
      for (let j = 1; j < centralCurvePoints.length; j++) {
        ctx.lineTo(centralCurvePoints[j].x, centralCurvePoints[j].y);
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
    ctx.fillStyle = trackColorConfig.getColor("rgba(0, 0, 0, 0.8)");
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
    // 1. Renderiza o preenchimento das células se outerPoints for fornecido
    if (outerPoints) {
      // this.renderCellBackground(points, outerPoints);
      // this.renderCellNumbers(points, outerPoints);s
    }
    
    // 2. Desenha a linha central azul
    this.renderCentralLine(points);
    
    // 3. Desenha os pontos vermelhos numerados
    this.renderTrackPoints(points);
  }
} 