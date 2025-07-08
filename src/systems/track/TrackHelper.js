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

  // Inicializa os dados das células da pista
  static initializeTrackCells(points) {
    const numCells = points.length;
    
    const createCellList = (type) => {
      return Array.from({ length: numCells }, (_, index) => ({
        index: index,
        centerX: 0,         // Será atualizado durante o render
        centerY: 0,         // Será atualizado durante o render
        occupiedBy: 0,      // 0 = livre, >0 = ID do jogador
        curveAngle: 0,      // Ângulo da curva, será calculado durante o render
        type: type          // Tipo da faixa para referência
      }));
    };
    
    return {
      inner: createCellList('inner'),
      middle: createCellList('middle'),
      outer: createCellList('outer')
    };
  }

  // Calcula o ângulo da curva em um ponto específico
  static calculateCurveAngle(p0, cp1, cp2, p1, t = 0.5) {
    // Calcula a tangente no ponto
    const tangent = this.calculateBezierTangent(p0, cp1, cp2, p1, t);
    
    // Calcula o ângulo em radianos
    const angle = Math.atan2(tangent.y, tangent.x);
    
    return angle;
  }

  // Atualiza os dados da célula com polígono e bounds
  static updateCellDataWithBounds(cell, centerX, centerY, curveAngle, boundaryPoints) {
    cell.centerX = centerX;
    cell.centerY = centerY;
    cell.curveAngle = curveAngle;
    cell.boundaryPoints = boundaryPoints;
    
    // Calcula o bounding box
    if (boundaryPoints && boundaryPoints.length > 0) {
      let minX = boundaryPoints[0].x;
      let maxX = boundaryPoints[0].x;
      let minY = boundaryPoints[0].y;
      let maxY = boundaryPoints[0].y;
      
      for (const point of boundaryPoints) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
      
      cell.bounds = {
        left: minX,
        right: maxX,
        top: minY,
        bottom: maxY,
        width: maxX - minX,
        height: maxY - minY
      };

    } else {
      console.warn(`⚠️ Célula ${cell.type}[${cell.index}]: sem pontos de boundary!`);
      cell.bounds = null;
    }
  }

  // Função de compatibilidade (para código legado)
  static updateCellData(cell, centerX, centerY, curveAngle) {
    // Chama a nova função sem boundary points
    this.updateCellDataWithBounds(cell, centerX, centerY, curveAngle, null);
  }

  // Verifica se um ponto está dentro de um polígono usando ray casting
  static isPointInPolygon(point, polygon) {
    if (!polygon || polygon.length < 3) return false;
    
    let inside = false;
    const x = point.x;
    const y = point.y;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      // Verifica se o raio horizontal cruza a aresta
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  // Verifica se um ponto está dentro dos bounds (otimização antes do point-in-polygon)
  static isPointInBounds(x, y, bounds) {
    return bounds && 
           x >= bounds.left && 
           x <= bounds.right && 
           y >= bounds.top && 
           y <= bounds.bottom;
  }

  // Busca a célula que contém o ponto exato (não apenas proximidade)
  static findCellContainingPoint(trackCells, x, y) {
    // Verifica cada tipo de célula
    for (const type of ['inner', 'middle', 'outer']) {
      const cells = trackCells[type];
      
      for (const cell of cells) {
        // Primeira verificação: bounding box (mais rápida)
        if (cell.bounds && !this.isPointInBounds(x, y, cell.bounds)) {
          continue;
        }
        
        // Segunda verificação: dentro do polígono da célula
        if (cell.boundaryPoints && this.isPointInPolygon({ x, y }, cell.boundaryPoints)) {
          return { cell, type, exactMatch: true };
        }
      }
    }
    
    return null;
  }

  // Função fallback: busca célula mais próxima (apenas para debug)
  static findNearestCellFallback(trackCells, x, y, maxDistance = 30) {
    let nearestCell = null;
    let nearestDistance = Infinity;
    let nearestType = null;
    
    // Busca em todas as faixas
    ['inner', 'middle', 'outer'].forEach(type => {
      const cells = trackCells[type];
      
      cells.forEach((cell, index) => {
        // Só verifica células com posições válidas
        if (cell.centerX !== undefined && cell.centerY !== undefined && cell.centerX !== 0 && cell.centerY !== 0) {
          const distance = Math.sqrt(
            Math.pow(cell.centerX - x, 2) + Math.pow(cell.centerY - y, 2)
          );
          
          if (distance < nearestDistance && distance <= maxDistance) {
            nearestDistance = distance;
            nearestCell = cell;
            nearestType = type;
          }
        }
      });
    });
    
    return nearestCell ? { cell: nearestCell, type: nearestType, distance: nearestDistance, exactMatch: false } : null;
  }

  // Busca a célula mais próxima de uma posição específica (mantida para compatibilidade)
  static findNearestCell(trackCells, x, y, maxDistance = 50) {
    // Primeira tentativa: busca célula que contém exatamente o ponto
    const exactMatch = this.findCellContainingPoint(trackCells, x, y);
    if (exactMatch) {
      console.log(`🎯 Clique exato na célula ${exactMatch.type}[${exactMatch.cell.index}]`);
      return exactMatch;
    }
    
    // Fallback: busca por proximidade (com distância menor)
    const nearestMatch = this.findNearestCellFallback(trackCells, x, y, 20);
    if (nearestMatch) {
      console.log(`📍 Clique próximo à célula ${nearestMatch.type}[${nearestMatch.cell.index}] (${nearestMatch.distance.toFixed(1)}px)`);
      return nearestMatch;
    }
    
    return null;
  }

  // Verifica se uma célula está livre para ocupação
  static isCellFree(cell) {
    return cell.occupiedBy === 0;
  }

  // Ocupa uma célula com o ID do jogador
  static occupyCell(cell, playerId) {
    if (this.isCellFree(cell)) {
      cell.occupiedBy = playerId;
      return true;
    }
    return false;
  }

  // Libera uma célula
  static freeCell(cell) {
    cell.occupiedBy = 0;
  }

  // Busca células ocupadas por um jogador específico
  static getCellsByPlayer(trackCells, playerId) {
    const playerCells = [];
    
    ['inner', 'middle', 'outer'].forEach(type => {
      trackCells[type].forEach(cell => {
        if (cell.occupiedBy === playerId) {
          playerCells.push({ cell, type });
        }
      });
    });
    
    return playerCells;
  }

  // Busca células em um raio específico a partir de uma célula
  static getCellsInRadius(trackCells, centerCell, radius = 2) {
    const cellsInRadius = [];
    const centerIndex = centerCell.index;
    
    ['inner', 'middle', 'outer'].forEach(type => {
      for (let i = -radius; i <= radius; i++) {
        const index = (centerIndex + i + trackCells[type].length) % trackCells[type].length;
        if (index !== centerIndex) {
          cellsInRadius.push({ cell: trackCells[type][index], type });
        }
      }
    });
    
    return cellsInRadius;
  }

  // Converte ângulo de radianos para graus
  static radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  // Obtém estatísticas das células
  static getCellStatistics(trackCells) {
    const stats = {
      total: 0,
      occupied: 0,
      free: 0,
      byType: {}
    };
    
    ['inner', 'middle', 'outer'].forEach(type => {
      const cells = trackCells[type];
      const typeStats = {
        total: cells.length,
        occupied: cells.filter(cell => cell.occupiedBy > 0).length,
        free: cells.filter(cell => cell.occupiedBy === 0).length
      };
      
      stats.byType[type] = typeStats;
      stats.total += typeStats.total;
      stats.occupied += typeStats.occupied;
      stats.free += typeStats.free;
    });
    
    return stats;
  }

} 