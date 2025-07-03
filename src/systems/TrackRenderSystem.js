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

  // Calcula um ponto em uma curva de Bézier para um valor t específico (0 <= t <= 1)
  calculateBezierPoint(p0, cp1, cp2, p1, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    return {
      x: mt3 * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p1.x,
      y: mt3 * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p1.y
    };
  }

  // Calcula a direção tangente em um ponto da curva de Bézier
  calculateBezierTangent(p0, cp1, cp2, p1, t) {
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    
    // Derivada da curva de Bézier
    const x = 3 * mt2 * (cp1.x - p0.x) + 6 * mt * t * (cp2.x - cp1.x) + 3 * t2 * (p1.x - cp2.x);
    const y = 3 * mt2 * (cp1.y - p0.y) + 6 * mt * t * (cp2.y - cp1.y) + 3 * t2 * (p1.y - cp2.y);
    
    // Normaliza o vetor
    const length = Math.sqrt(x * x + y * y);
    return {
      x: x / length,
      y: y / length
    };
  }

  calculateOuterControlPoints(point1, point2, prevPoint, nextPoint, originalPoints) {
    // Calcula as direções dos segmentos
    const currentDirection = calculateDirection(point1, point2);
    const prevDirection = calculateDirection(prevPoint, point1);
    const nextDirection = calculateDirection(point2, nextPoint);
    const distance = currentDirection.length;

    // Encontra os pontos originais mais próximos para calcular os ângulos das linhas laranjas
    const findClosestOriginalPoint = (point) => {
      return originalPoints.reduce((closest, orig) => {
        const dist = Math.sqrt(
          Math.pow(point.x - orig.x, 2) + Math.pow(point.y - orig.y, 2)
        );
        return dist < closest.dist ? { point: orig, dist } : closest;
      }, { point: originalPoints[0], dist: Infinity }).point;
    };

    const origPoint1 = findClosestOriginalPoint(point1);
    const origPoint2 = findClosestOriginalPoint(point2);

    // Calcula os ângulos das linhas laranjas em relação ao centro
    const angle1 = Math.atan2(point1.y - origPoint1.y, point1.x - origPoint1.x);
    const angle2 = Math.atan2(point2.y - origPoint2.y, point2.x - origPoint2.x);
    
    // Calcula a diferença entre os ângulos (normalizada para [-π, π])
    let angleDiff = angle2 - angle1;
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Ajusta o fator de curvatura baseado na diferença dos ângulos
    // Se os ângulos forem similares, a curva será mais reta
    // Se houver grande diferença, a curva será mais pronunciada
    const curveFactor = Math.abs(angleDiff) / Math.PI; // 0 a 1
    const baseControlDistance = distance * 0.25;
    const controlDistance = baseControlDistance * (0.5 + curveFactor);

    // Determina a direção da "barriga" baseado no sinal da diferença dos ângulos
    const bellySide = Math.sign(angleDiff);
    
    // Calcula o vetor perpendicular à direção atual
    const perpendicular = {
      x: currentDirection.y / currentDirection.length,
      y: -currentDirection.x / currentDirection.length
    };

    // Ajusta o offset perpendicular baseado na curvatura
    const perpendicularOffset = distance * 0.2 * curveFactor * bellySide;

    return {
      cp1: {
        x: point1.x + currentDirection.x * controlDistance / distance + perpendicular.x * perpendicularOffset,
        y: point1.y + currentDirection.y * controlDistance / distance + perpendicular.y * perpendicularOffset
      },
      cp2: {
        x: point2.x - currentDirection.x * controlDistance / distance + perpendicular.x * perpendicularOffset,
        y: point2.y - currentDirection.y * controlDistance / distance + perpendicular.y * perpendicularOffset
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

    // Desenha as linhas laranjas nos pontos médios das curvas de Bézier pretas
    ctx.strokeStyle = "#FFA500";
    ctx.lineWidth = 2;

    outerPoints.forEach((point, index) => {
      const prevPoint = outerPoints[(index - 1 + outerPoints.length) % outerPoints.length];
      const nextPoint = outerPoints[(index + 1) % outerPoints.length];
      const nextNextPoint = outerPoints[(index + 2) % outerPoints.length];
      
      const controlPoints = this.calculateControlPoints(point, nextPoint, prevPoint, nextNextPoint);
      
      // Calcula o ponto médio da curva de Bézier (t = 0.5)
      const midPoint = this.calculateBezierPoint(point, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Calcula a direção tangente no ponto médio
      const tangent = this.calculateBezierTangent(point, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
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
      
      const controlPoints = this.calculateControlPoints(point, nextPoint, prevPoint, nextNextPoint);
      const midPoint = this.calculateBezierPoint(point, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      const tangent = this.calculateBezierTangent(point, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
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

    // Desenha as linhas perpendiculares a partir dos pontos médios das curvas roxas
    ctx.strokeStyle = "red"; // Cor turquesa para as novas linhas
    ctx.lineWidth = 2;
    
    outerMostPoints.forEach((point, index) => {
      const nextPoint = outerMostPoints[(index + 1) % outerMostPoints.length];
      
      // Calcula os pontos de controle para a curva roxa
      // const prevPoint = outerMostPoints[(index - 1 + outerMostPoints.length) % outerMostPoints.length];
      // const nextNextPoint = outerMostPoints[(index + 2) % outerMostPoints.length];
      
      // Encontra os pontos originais correspondentes
      const origPoint = outerPoints[index];
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

      // Ajusta o offset baseado no ângulo entre as linhas laranjas
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

      // Calcula o ponto médio da curva roxa usando os pontos de controle
      const midPoint = this.calculateBezierPoint(point, cp1, cp2, nextPoint, 0.5);
      
      // Calcula a direção tangente no ponto médio
      const tangent = this.calculateBezierTangent(point, cp1, cp2, nextPoint, 0.5);
      
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

    // Desenha as curvas conectando os pontos finais das linhas vermelhas
    ctx.strokeStyle = "gray"; // Mantém a mesma cor roxa para a última curva
    ctx.lineWidth = 2;
    
    // Calcula os pontos finais das linhas vermelhas
    const outerMostRedPoints = outerMostPoints.map((point, index) => {
      const nextPoint = outerMostPoints[(index + 1) % outerMostPoints.length];
      
      // Reutiliza o cálculo dos pontos de controle da curva roxa
      // const prevPoint = outerMostPoints[(index - 1 + outerMostPoints.length) % outerMostPoints.length];
      // const nextNextPoint = outerMostPoints[(index + 2) % outerMostPoints.length];
      
      // Encontra os pontos originais correspondentes
      const origPoint = outerPoints[index];
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

      // Ajusta o offset baseado no ângulo entre as linhas laranjas
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

      // Calcula o ponto médio da curva roxa usando os pontos de controle
      const midPoint = this.calculateBezierPoint(point, cp1, cp2, nextPoint, 0.5);
      
      // Calcula a direção tangente no ponto médio
      const tangent = this.calculateBezierTangent(point, cp1, cp2, nextPoint, 0.5);
      
      // Calcula o vetor perpendicular à tangente
      const midPerpendicular = {
        x: tangent.y,
        y: -tangent.x
      };
      
      // Retorna o ponto final da linha vermelha
      return {
        x: midPoint.x + midPerpendicular.x * cellWidth,
        y: midPoint.y + midPerpendicular.y * cellWidth
      };
    });

    // Desenha as curvas de Bézier conectando os pontos finais das linhas vermelhas
    ctx.beginPath();
    ctx.moveTo(outerMostRedPoints[0].x, outerMostRedPoints[0].y);
    
    outerMostRedPoints.forEach((point, index) => {
      const nextPoint = outerMostRedPoints[(index + 1) % outerMostRedPoints.length];
      const prevPoint = outerMostRedPoints[(index - 1 + outerMostRedPoints.length) % outerMostRedPoints.length];
      const nextNextPoint = outerMostRedPoints[(index + 2) % outerMostRedPoints.length];
      
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
  }
}
