import { Track } from "../../components/Track.js";
import { calculateDirection, getBisectorPerpendicular, multiplyVector } from "../../utils/mathUtils.js";
import { OuterBoundaryRenderer } from "./OuterBoundaryRenderer.js";
import { TrackHelper } from "./TrackHelper.js";

export class TrackRenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.outerBoundaryRenderer = new OuterBoundaryRenderer(this.ctx, 60);
  }

  update(deltaTime, entities) {
    for (const entity of entities) {
      if (entity.hasComponent(Track)) {
        const track = entity.getComponent(Track);
        this.renderTrack(track);
      }
    }
  }

  // calculateDirection(point1, point2) {
  //   const direction = {
  //     x: point2.x - point1.x,
  //     y: point2.y - point1.y
  //   };
  //   direction.length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  //   return direction;
  // }







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
      
      const controlPoints = TrackHelper.calculateControlPoints(point, nextPoint, prevPoint, nextNextPoint);
      
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
    points.forEach((point, index) => {
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Adiciona o número do índice
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(index.toString(), point.x, point.y);
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

    // Desenha as linhas laranjas nos pontos médios das curvas de Bézier pretas
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

    // Desenha as curvas roxas conectando os pontos finais das linhas laranjas
    ctx.strokeStyle = "#800080"; // Roxo
    ctx.lineWidth = 2;
    
    // Primeiro, calcula todos os pontos finais das linhas laranjas
    const outerMostPoints = outerPoints.map((point, index) => {
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

    // Desenha a terceira faixa (linhas vermelhas e cinzas) usando o renderer dedicado
    this.outerBoundaryRenderer.render(outerMostPoints, outerPoints);

    // TODO: Implementar o desenho das células curvas da pista
  }
}
