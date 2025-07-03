import { Track } from "../components/Track.js";
import { calculateDirection, getBisectorPerpendicular, multiplyVector } from "../utils/mathUtils.js";

export class TrackRenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  update(deltaTime, entities) {
    for (const entity of entities) {
      if (entity.hasComponent(Track)) {
        const track = entity.getComponent(Track);
        this.renderTrack(track);
      }
    }
  }

  calculateDirection(point1, point2) {
    const direction = {
      x: point2.x - point1.x,
      y: point2.y - point1.y
    };
    direction.length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    return direction;
  }

  calculateControlPoints(point1, point2, prevPoint, nextPoint) {
    // Calcula as direções dos segmentos
    const currentDirection = calculateDirection(point1, point2);
    const prevDirection = calculateDirection(prevPoint, point1);
    const nextDirection = calculateDirection(point2, nextPoint);
    const distance = currentDirection.length;

    // Calcula os ângulos entre os segmentos
    const angleStart = Math.atan2(
      prevDirection.x * currentDirection.y - prevDirection.y * currentDirection.x,
      prevDirection.x * currentDirection.x + prevDirection.y * currentDirection.y
    );
    const angleEnd = Math.atan2(
      currentDirection.x * nextDirection.y - currentDirection.y * nextDirection.x,
      currentDirection.x * nextDirection.x + currentDirection.y * nextDirection.y
    );

    // Normaliza os ângulos para o intervalo [-π, π]
    const normalizedAngleStart = angleStart > Math.PI ? angleStart - 2 * Math.PI : angleStart < -Math.PI ? angleStart + 2 * Math.PI : angleStart;
    const normalizedAngleEnd = angleEnd > Math.PI ? angleEnd - 2 * Math.PI : angleEnd < -Math.PI ? angleEnd + 2 * Math.PI : angleEnd;

    // Ajusta a distância dos pontos de controle baseado nos ângulos
    // Usa uma função suave para o fator do ângulo
    const smoothAngleStart = Math.min(Math.abs(normalizedAngleStart), Math.PI/2);
    const smoothAngleEnd = Math.min(Math.abs(normalizedAngleEnd), Math.PI/2);
    
    const angleFactorStart = (1 - Math.cos(smoothAngleStart)) / 2;
    const angleFactorEnd = (1 - Math.cos(smoothAngleEnd)) / 2;
    
    const startControlDistance = distance * (0.2 + angleFactorStart * 0.3);
    const endControlDistance = distance * (0.2 + angleFactorEnd * 0.3);

    // Calcula o vetor perpendicular à direção
    const perpendicular = {
      x: currentDirection.y,
      y: -currentDirection.x
    };

    // Ajusta o offset perpendicular baseado nos ângulos usando uma função suave
    const startPerpendicularOffset = distance * 0.15 * Math.sign(normalizedAngleStart) * Math.sin(smoothAngleStart);
    const endPerpendicularOffset = distance * 0.15 * Math.sign(normalizedAngleEnd) * Math.sin(smoothAngleEnd);

    // Calcula os pontos de controle com desvio perpendicular ajustado pelos ângulos
    return {
      cp1: {
        x: point1.x + currentDirection.x * startControlDistance + perpendicular.x * startPerpendicularOffset,
        y: point1.y + currentDirection.y * startControlDistance + perpendicular.y * startPerpendicularOffset
      },
      cp2: {
        x: point2.x - currentDirection.x * endControlDistance + perpendicular.x * endPerpendicularOffset,
        y: point2.y - currentDirection.y * endControlDistance + perpendicular.y * endPerpendicularOffset
      }
    };
  }

  renderTrack(track) {
    const ctx = this.ctx;
    const points = track.points;
    const cellWidth = 60;

    // Primeiro vamos desenhar a linha central (azul)
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
      
      const controlPoints = this.calculateControlPoints(point, nextPoint, prevPoint, nextNextPoint);
      
      // Usa bezierCurveTo para criar uma curva suave
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

    // Agora desenha os pontos vermelhos em um loop separado
    points.forEach(point => {
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Agora vamos desenhar as linhas verdes (perpendiculares)
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

    // Desenha a linha preta conectando os pontos finais das linhas verdes com curvas Bézier
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    
    // Calcula os pontos externos (finais das linhas verdes)
    const outerPoints = points.map((currentPoint, index) => {
      const prevPoint = points[(index - 1 + points.length) % points.length];
      const nextPoint = points[(index + 1) % points.length];
      const perpendicular = getBisectorPerpendicular(currentPoint, prevPoint, nextPoint);
      const scaledPerpendicular = multiplyVector(perpendicular, cellWidth);
      return {
        x: currentPoint.x + scaledPerpendicular.x,
        y: currentPoint.y + scaledPerpendicular.y
      };
    });

    // Move para o primeiro ponto externo
    ctx.moveTo(outerPoints[0].x, outerPoints[0].y);
    
    // Desenha as curvas de Bézier entre os pontos externos
    outerPoints.forEach((point, index) => {
      const prevPoint = outerPoints[(index - 1 + outerPoints.length) % outerPoints.length];
      const nextPoint = outerPoints[(index + 1) % outerPoints.length];
      const nextNextPoint = outerPoints[(index + 2) % outerPoints.length];
      
      const controlPoints = this.calculateControlPoints(point, nextPoint, prevPoint, nextNextPoint);
      
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

    // TODO: Implementar o desenho das células curvas da pista
    // 1. Para cada segmento, calcular pontos de controle para curvas de Bézier
    // 2. Usar os pontos finais das linhas verdes como referência
    // 3. Criar curvas suaves que seguem a direção da pista
    // 4. Ajustar as curvas baseado no ângulo entre segmentos
  }
}
