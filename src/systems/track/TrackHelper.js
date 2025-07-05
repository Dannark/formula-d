import { calculateDirection } from "../../utils/mathUtils.js";

export class TrackHelper {
  // Calcula um ponto em uma curva de Bézier para um valor t específico (0 <= t <= 1)
  static calculateBezierPoint(p0, cp1, cp2, p1, t) {
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
  static calculateBezierTangent(p0, cp1, cp2, p1, t) {
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

  static calculateControlPoints(point1, point2, prevPoint, nextPoint) {
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

  static calculateOuterControlPoints(point1, point2, prevPoint, nextPoint, originalPoints) {
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
} 