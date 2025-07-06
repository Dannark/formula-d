export class DirectionalGenerator {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.random = this.createSeededRandom(seed);
    
    // Configurações da pista
    this.TRACK_WIDTH = 200; // 60px x 3 células
    this.TRACK_HALF_WIDTH = this.TRACK_WIDTH / 2;
    
    // Direções iniciais possíveis (8 direções)
    this.INITIAL_DIRECTIONS = [
      0,                    // Direita
      Math.PI / 4,         // Diagonal superior direita
      Math.PI / 2,         // Cima
      3 * Math.PI / 4,     // Diagonal superior esquerda
      Math.PI,             // Esquerda
      5 * Math.PI / 4,     // Diagonal inferior esquerda
      3 * Math.PI / 2,     // Baixo
      7 * Math.PI / 4      // Diagonal inferior direita
    ];
  }
  
  // Gerador de números aleatórios com seed
  createSeededRandom(seed) {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }
  
  // Normaliza um ângulo para o intervalo [0, 2π]
  normalizeAngle(angle) {
    while (angle < 0) angle += 2 * Math.PI;
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
    return angle;
  }
  
  // Calcula a distância entre dois pontos
  distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // Verifica se duas linhas se intersectam
  linesIntersect(p1, p2, p3, p4) {
    const d1 = this.direction(p3, p4, p1);
    const d2 = this.direction(p3, p4, p2);
    const d3 = this.direction(p1, p2, p3);
    const d4 = this.direction(p1, p2, p4);
    
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }
    
    return false;
  }
  
  // Calcula a direção do produto cruzado
  direction(pi, pj, pk) {
    return (pk.x - pi.x) * (pj.y - pi.y) - (pj.x - pi.x) * (pk.y - pi.y);
  }
  
  // Verifica se um ponto está muito próximo do caminho existente (considerando largura da pista)
  wouldCauseCollision(newPoint, existingPath, currentPoint, minDistance = null) {
    const safeDistance = minDistance || this.TRACK_WIDTH;
    
    // Não verifica colisão com os últimos 3 pontos (conexão direta)
    const pathToCheck = existingPath.slice(0, -3);
    
    // Verifica distância com pontos anteriores
    for (let i = 0; i < pathToCheck.length; i++) {
      const existingPoint = pathToCheck[i];
      const dist = this.distance(newPoint, existingPoint);
      
      if (dist < safeDistance) {
        console.log(`❌ Colisão por proximidade: ${Math.round(dist)}px < ${safeDistance}px`);
        return true;
      }
    }
    
    // Verifica intersecção de linhas
    if (currentPoint && pathToCheck.length > 1) {
      for (let i = 0; i < pathToCheck.length - 1; i++) {
        const lineStart = pathToCheck[i];
        const lineEnd = pathToCheck[i + 1];
        
        if (this.linesIntersect(currentPoint, newPoint, lineStart, lineEnd)) {
          console.log(`❌ Colisão por intersecção de linha`);
          return true;
        }
      }
    }
    
    return false;
  }

  // NOVO: Verifica colisão considerando a largura da pista (corredor)
  wouldCauseCorridorCollision(newPoint, existingPath, currentPoint, minDistance = null) {
    const safeDistance = minDistance || this.TRACK_WIDTH;
    
    // Não verifica colisão com os últimos 4 pontos (conexão direta + margem)
    const pathToCheck = existingPath.slice(0, -4);
    
    if (pathToCheck.length < 2) return false;
    
    // Verifica distância ponto-a-segmento considerando largura da pista
    for (let i = 0; i < pathToCheck.length - 1; i++) {
      const segmentStart = pathToCheck[i];
      const segmentEnd = pathToCheck[i + 1];
      
      const distanceToSegment = this.pointToSegmentDistance(newPoint, segmentStart, segmentEnd);
      
      if (distanceToSegment < safeDistance) {
        console.log(`❌ Colisão de corredor: ${Math.round(distanceToSegment)}px < ${safeDistance}px`);
        return true;
      }
    }
    
    // Verifica intersecção de corredores (não apenas linhas centrais)
    if (currentPoint && pathToCheck.length > 1) {
      for (let i = 0; i < pathToCheck.length - 1; i++) {
        const lineStart = pathToCheck[i];
        const lineEnd = pathToCheck[i + 1];
        
        if (this.corridorsIntersect(currentPoint, newPoint, lineStart, lineEnd, safeDistance)) {
          console.log(`❌ Colisão de corredor por intersecção`);
          return true;
        }
      }
    }
    
    return false;
  }

  // Calcula distância de um ponto a um segmento de linha
  pointToSegmentDistance(point, segmentStart, segmentEnd) {
    const dx = segmentEnd.x - segmentStart.x;
    const dy = segmentEnd.y - segmentStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      return this.distance(point, segmentStart);
    }
    
    // Parâmetro t para projeção do ponto no segmento
    const t = Math.max(0, Math.min(1, 
      ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / (length * length)
    ));
    
    // Ponto mais próximo no segmento
    const closestPoint = {
      x: segmentStart.x + t * dx,
      y: segmentStart.y + t * dy
    };
    
    return this.distance(point, closestPoint);
  }

  // Verifica se dois corredores (com largura) se intersectam
  corridorsIntersect(p1, p2, p3, p4, corridorWidth) {
    const halfWidth = corridorWidth / 2;
    
    // Calcula vetores perpendiculares para cada segmento
    const perp1 = this.getPerpendicularVector(p1, p2, halfWidth);
    const perp2 = this.getPerpendicularVector(p3, p4, halfWidth);
    
    // Cria os retângulos (corredores) para cada segmento
    const corridor1 = [
      { x: p1.x + perp1.x, y: p1.y + perp1.y },
      { x: p1.x - perp1.x, y: p1.y - perp1.y },
      { x: p2.x - perp1.x, y: p2.y - perp1.y },
      { x: p2.x + perp1.x, y: p2.y + perp1.y }
    ];
    
    const corridor2 = [
      { x: p3.x + perp2.x, y: p3.y + perp2.y },
      { x: p3.x - perp2.x, y: p3.y - perp2.y },
      { x: p4.x - perp2.x, y: p4.y - perp2.y },
      { x: p4.x + perp2.x, y: p4.y + perp2.y }
    ];
    
    // Verifica se os retângulos se intersectam
    return this.polygonsIntersect(corridor1, corridor2);
  }

  // Calcula vetor perpendicular a um segmento
  getPerpendicularVector(p1, p2, magnitude) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return { x: 0, y: 0 };
    
    // Vetor perpendicular normalizado
    return {
      x: (-dy / length) * magnitude,
      y: (dx / length) * magnitude
    };
  }

  // Verifica se dois polígonos se intersectam (algoritmo SAT simplificado)
  polygonsIntersect(poly1, poly2) {
    // Verifica se qualquer vértice de poly1 está dentro de poly2
    for (const vertex of poly1) {
      if (this.pointInPolygon(vertex, poly2)) {
        return true;
      }
    }
    
    // Verifica se qualquer vértice de poly2 está dentro de poly1
    for (const vertex of poly2) {
      if (this.pointInPolygon(vertex, poly1)) {
        return true;
      }
    }
    
    // Verifica se as arestas se intersectam
    for (let i = 0; i < poly1.length; i++) {
      const p1 = poly1[i];
      const p2 = poly1[(i + 1) % poly1.length];
      
      for (let j = 0; j < poly2.length; j++) {
        const p3 = poly2[j];
        const p4 = poly2[(j + 1) % poly2.length];
        
        if (this.linesIntersect(p1, p2, p3, p4)) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Verifica se um ponto está dentro de um polígono (ray casting)
  pointInPolygon(point, polygon) {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const pi = polygon[i];
      const pj = polygon[j];
      
      if (((pi.y > point.y) !== (pj.y > point.y)) &&
          (point.x < (pj.x - pi.x) * (point.y - pi.y) / (pj.y - pi.y) + pi.x)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  // NOVO: Verifica colisões mais inteligentes considerando densidade da pista
  wouldCauseSmartCollision(newPoint, existingPath, currentPoint, minDistance = null) {
    const safeDistance = minDistance || this.TRACK_WIDTH;
    
    // Não verifica colisão com os últimos 4 pontos
    const pathToCheck = existingPath.slice(0, -4);
    
    if (pathToCheck.length < 2) return false;
    
    // Cria um grid espacial para otimizar verificações
    const gridSize = this.TRACK_WIDTH;
    const nearbySegments = this.getNearbySegments(newPoint, pathToCheck, gridSize);
    
    // Verifica apenas segmentos próximos
    for (const segment of nearbySegments) {
      const distanceToSegment = this.pointToSegmentDistance(newPoint, segment.start, segment.end);
      
      if (distanceToSegment < safeDistance) {
        console.log(`❌ Colisão inteligente: ${Math.round(distanceToSegment)}px < ${safeDistance}px`);
        return true;
      }
    }
    
    // Verifica intersecção de corredores apenas com segmentos próximos
    if (currentPoint) {
      for (const segment of nearbySegments) {
        if (this.corridorsIntersect(currentPoint, newPoint, segment.start, segment.end, safeDistance)) {
          console.log(`❌ Colisão inteligente por intersecção`);
          return true;
        }
      }
    }
    
    return false;
  }

  // Otimização: retorna apenas segmentos próximos ao ponto
  getNearbySegments(point, path, searchRadius) {
    const segments = [];
    const radiusSquared = searchRadius * searchRadius;
    
    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];
      
      // Verifica se o segmento está dentro do raio de busca
      const distToStart = this.distanceSquared(point, start);
      const distToEnd = this.distanceSquared(point, end);
      
      if (distToStart <= radiusSquared || distToEnd <= radiusSquared) {
        segments.push({ start, end, index: i });
      }
    }
    
    return segments;
  }

  // Otimização: distância ao quadrado (evita sqrt)
  distanceSquared(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
  }
  
  // Verifica se uma sequência de movimentos criaria um loop fechado
  wouldCreateTightLoop(path, consecutiveTurns, direction) {
    // Para curvas à esquerda, é mais rigoroso (contra o sentido clockwise)
    const maxLeftTurns = 4;  // Mais rigoroso para esquerda
    const maxRightTurns = 6; // Mais permissivo para direita
    
    if (direction === 'left' && consecutiveTurns >= maxLeftTurns) {
      console.log(`❌ Loop esquerda detectado: ${consecutiveTurns} curvas consecutivas (limite: ${maxLeftTurns})`);
      return true;
    }
    
    if (direction === 'right' && consecutiveTurns >= maxRightTurns) {
      console.log(`❌ Loop direita detectado: ${consecutiveTurns} curvas consecutivas (limite: ${maxRightTurns})`);
      return true;
    }
    
    return false;
  }
  
  // Calcula o próximo ponto baseado na posição atual, direção e distância
  calculateNextPoint(currentPoint, direction, stepSize) {
    return {
      x: currentPoint.x + Math.cos(direction) * stepSize,
      y: currentPoint.y + Math.sin(direction) * stepSize
    };
  }
  
  // Verifica se pode fechar o circuito de forma limpa
  canCloseCircuit(currentPoint, startPoint, path, stepSize) {
    const distanceToStart = this.distance(currentPoint, startPoint);
    const maxCloseDistance = stepSize * 1.5; // Mais rigoroso
    
    if (distanceToStart > maxCloseDistance) {
      return false;
    }
    
    // Verifica se a linha de fechamento não cruza o path existente
    // Ignora os últimos 5 pontos para evitar verificação desnecessária
    const pathToCheck = path.slice(0, -5);
    
    for (let i = 0; i < pathToCheck.length - 1; i++) {
      const lineStart = pathToCheck[i];
      const lineEnd = pathToCheck[i + 1];
      
      if (this.linesIntersect(currentPoint, startPoint, lineStart, lineEnd)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Gera a fase de exploração (saída)
  generateExplorationPhase(startPoint, initialDirection, stepSize, explorationSteps, straightStartSteps, leftTurnAngleRange, rightTurnAngleRange) {
    console.log(`🚀 Iniciando fase de exploração (${explorationSteps} passos, ${straightStartSteps} retos iniciais)`);
    console.log(`   - Ângulo esquerda: ${Math.round(leftTurnAngleRange.min * 180 / Math.PI)}°-${Math.round(leftTurnAngleRange.max * 180 / Math.PI)}°`);
    console.log(`   - Ângulo direita: ${Math.round(rightTurnAngleRange.min * 180 / Math.PI)}°-${Math.round(rightTurnAngleRange.max * 180 / Math.PI)}°`);
    
    const path = [startPoint];
    let currentDirection = initialDirection;
    let currentPoint = startPoint;
    
    // Primeiros passos sempre retos (área de largada)
    for (let straightStep = 1; straightStep <= straightStartSteps; straightStep++) {
      const nextPoint = this.calculateNextPoint(currentPoint, currentDirection, stepSize);
      path.push(nextPoint);
      currentPoint = nextPoint;
      console.log(`   Passo ${straightStep}: straight (largada) - ${path.length} pontos total`);
    }
    
    // Contador de curvas consecutivas na mesma direção
    let consecutiveLeftTurns = 0;
    let consecutiveRightTurns = 0;
    
    // Sistema de ângulos variáveis
    let currentLeftAngle = this.getRandomAngleInRange(leftTurnAngleRange);
    let currentRightAngle = this.getRandomAngleInRange(rightTurnAngleRange);
    let angleConsistencyCounter = 0;
    let consistencyTarget = this.getConsistencyTarget(); // 2-4 células
    
    console.log(`   - Ângulos iniciais: esquerda ${Math.round(currentLeftAngle * 180 / Math.PI)}°, direita ${Math.round(currentRightAngle * 180 / Math.PI)}° (mantendo por ${consistencyTarget} células)`);
    
    // Restante dos passos de exploração (após os passos retos iniciais)
    for (let step = straightStartSteps + 1; step <= explorationSteps; step++) {
      // Pesos baseados nos ângulos - direita mais favorecida por ser mais agressiva
      const leftWeight = 1;
      const straightWeight = 4; // Aumentei um pouco
      const rightWeight = 2;    // Favorece direita por ser clockwise
      
      const moveOptions = [
        { direction: currentDirection - currentLeftAngle, type: 'left', weight: leftWeight, angle: currentLeftAngle },   
        { direction: currentDirection, type: 'straight', weight: straightWeight, angle: 0 },
        { direction: currentDirection + currentRightAngle, type: 'right', weight: rightWeight, angle: currentRightAngle } 
      ];
      
      // Normaliza as direções
      moveOptions.forEach(option => {
        option.direction = this.normalizeAngle(option.direction);
      });
      
      // Ajusta pesos baseado em curvas consecutivas (mais rigoroso para esquerda)
      if (consecutiveLeftTurns >= 2) { // Mais rigoroso para esquerda
        moveOptions[0].weight = 0.3; // Reduz muito o peso de virar à esquerda
        moveOptions[2].weight = 3;   // Aumenta muito o peso de virar à direita
      }
      if (consecutiveRightTurns >= 4) { // Mais permissivo para direita
        moveOptions[2].weight = 0.7; // Reduz peso de virar à direita
        moveOptions[0].weight = 1.5; // Aumenta peso de virar à esquerda
      }
      
      // Seleciona uma opção válida
      let selectedOption = null;
      let attempts = 0;
      
      while (selectedOption === null && attempts < 15) {
        // Seleciona baseado no peso
        const totalWeight = moveOptions.reduce((sum, opt) => sum + opt.weight, 0);
        let randomValue = this.random() * totalWeight;
        
        for (const option of moveOptions) {
          randomValue -= option.weight;
          if (randomValue <= 0) {
            const testPoint = this.calculateNextPoint(currentPoint, option.direction, stepSize);
            
            // Verifica se o movimento é válido
            const wouldLoop = this.wouldCreateTightLoop(path, 
              option.type === 'left' ? consecutiveLeftTurns + 1 : consecutiveRightTurns + 1, 
              option.type
            );
            
            if (!this.wouldCauseSmartCollision(testPoint, path, currentPoint) && !wouldLoop) {
              selectedOption = {
                direction: option.direction,
                point: testPoint,
                type: option.type,
                angle: option.angle
              };
              break;
            }
          }
        }
        
        attempts++;
        if (selectedOption === null) {
          // Aumenta peso de ir reto se não encontrou opção válida
          moveOptions[1].weight += 1;
          moveOptions[0].weight = Math.max(0.1, moveOptions[0].weight * 0.6);
          moveOptions[2].weight = Math.max(0.1, moveOptions[2].weight * 0.8);
        }
      }
      
      // Se ainda não encontrou, força ir reto com passo menor
      if (selectedOption === null) {
        console.log(`⚠️ Forçando movimento reto com passo reduzido`);
        selectedOption = {
          direction: this.normalizeAngle(currentDirection),
          point: this.calculateNextPoint(currentPoint, currentDirection, stepSize * 0.7),
          type: 'straight',
          angle: 0
        };
      }
      
      // Atualiza contadores de curvas consecutivas
      if (selectedOption.type === 'left') {
        consecutiveLeftTurns++;
        consecutiveRightTurns = 0;
      } else if (selectedOption.type === 'right') {
        consecutiveRightTurns++;
        consecutiveLeftTurns = 0;
      } else {
        consecutiveLeftTurns = 0;
        consecutiveRightTurns = 0;
      }
      
      // Gerencia a consistência dos ângulos
      angleConsistencyCounter++;
      
      // Se atingiu o alvo de consistência OU mudou de direção, gera novos ângulos
      if (angleConsistencyCounter >= consistencyTarget || selectedOption.type === 'straight') {
        const oldLeftAngle = currentLeftAngle;
        const oldRightAngle = currentRightAngle;
        
        currentLeftAngle = this.getRandomAngleInRange(leftTurnAngleRange);
        currentRightAngle = this.getRandomAngleInRange(rightTurnAngleRange);
        angleConsistencyCounter = 0;
        consistencyTarget = this.getConsistencyTarget();
        
        console.log(`   🔄 Novos ângulos: esquerda ${Math.round(oldLeftAngle * 180 / Math.PI)}°→${Math.round(currentLeftAngle * 180 / Math.PI)}°, direita ${Math.round(oldRightAngle * 180 / Math.PI)}°→${Math.round(currentRightAngle * 180 / Math.PI)}° (mantendo por ${consistencyTarget} células)`);
      }
      
      // Aplica o movimento
      currentDirection = selectedOption.direction;
      currentPoint = selectedOption.point;
      path.push(currentPoint);
      
      const angleInfo = selectedOption.angle > 0 ? ` (${Math.round(selectedOption.angle * 180 / Math.PI)}°)` : '';
      console.log(`   Passo ${step}: ${selectedOption.type}${angleInfo} (${path.length} pontos total)`);
    }
    
    return { 
      path, 
      finalDirection: currentDirection,
      finalAngles: { left: currentLeftAngle, right: currentRightAngle }
    };
  }
  
  // Gera a fase de retorno (sempre clockwise)
  generateReturnPhase(explorationPath, finalDirection, stepSize, startPoint, leftTurnAngleRange, rightTurnAngleRange, initialAngles) {
    console.log(`🔄 Iniciando fase de retorno (clockwise)`);
    
    const path = [...explorationPath];
    let currentDirection = finalDirection;
    let currentPoint = path[path.length - 1];
    
    const maxReturnSteps = 100; // Aumentei o limite
    let returnSteps = 0;
    let stuckCounter = 0; // Contador para detectar quando está preso
    
    // Sistema de ângulos variáveis para a volta
    let currentLeftAngle = initialAngles.left;
    let currentRightAngle = initialAngles.right;
    let angleConsistencyCounter = 0;
    let consistencyTarget = this.getConsistencyTarget();
    
    // Distâncias de controle
    const ALIGNMENT_DISTANCE = 500; // Começa a alinhar quando está a 500px
    const AGGRESSIVE_ALIGNMENT = 350; // Alinhamento agressivo a partir de 350px
    const CLOSE_DISTANCE = stepSize * 4; // Considera "perto" quando está a 4x stepSize
    const FINAL_DISTANCE = stepSize * 1.5; // Pode fechar quando está a 1.5x stepSize
    
    while (returnSteps < maxReturnSteps) {
      const distanceToStart = this.distance(currentPoint, startPoint);
      
      // Verifica se pode fechar o circuito
      if (returnSteps > 5 && distanceToStart <= FINAL_DISTANCE && this.canCloseCircuit(currentPoint, startPoint, path, stepSize)) {
        console.log(`✅ Circuito fechado após ${returnSteps} passos de retorno`);
        break;
      }
      
      // Calcula ângulo para o ponto inicial
      const dx = startPoint.x - currentPoint.x;
      const dy = startPoint.y - currentPoint.y;
      const angleToStart = Math.atan2(dy, dx);
      
      // Calcula diferença angular atual
      let angleDiff = angleToStart - currentDirection;
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // Opções de movimento
      const moveOptions = [
        { direction: currentDirection - currentLeftAngle, type: 'left', weight: 0.5, angle: currentLeftAngle },   
        { direction: currentDirection, type: 'straight', weight: 2, angle: 0 },
        { direction: currentDirection + currentRightAngle, type: 'right', weight: 4, angle: currentRightAngle }    
      ];
      
      // Normaliza as direções
      moveOptions.forEach(option => {
        option.direction = this.normalizeAngle(option.direction);
      });
      
      // SISTEMA DE ALINHAMENTO AGRESSIVO
      if (distanceToStart <= ALIGNMENT_DISTANCE) {
        const alignmentFactor = Math.max(0.2, (ALIGNMENT_DISTANCE - distanceToStart) / ALIGNMENT_DISTANCE);
        const isAggressiveZone = distanceToStart <= AGGRESSIVE_ALIGNMENT;
        
        console.log(`   🎯 Alinhando: ${Math.round(distanceToStart)}px do início (fator: ${alignmentFactor.toFixed(2)}, agressivo: ${isAggressiveZone})`);
        
        // Calcula qual movimento levaria mais próximo ao ângulo desejado
        const leftAngleDiff = Math.abs(this.normalizeAngleDifference(angleToStart - moveOptions[0].direction));
        const straightAngleDiff = Math.abs(this.normalizeAngleDifference(angleToStart - moveOptions[1].direction));
        const rightAngleDiff = Math.abs(this.normalizeAngleDifference(angleToStart - moveOptions[2].direction));
        
        // Encontra a melhor direção (menor diferença angular)
        const minDiff = Math.min(leftAngleDiff, straightAngleDiff, rightAngleDiff);
        
        // ALINHAMENTO SUPER AGRESSIVO na zona crítica
        if (isAggressiveZone) {
          console.log(`   🚨 MODO AGRESSIVO: Forçando alinhamento!`);
          
          // Reseta pesos para dar prioridade total ao alinhamento
          moveOptions[0].weight = 0.1;
          moveOptions[1].weight = 0.1;
          moveOptions[2].weight = 0.1;
          
          // Aplica bônus MASSIVO para a melhor direção
          if (leftAngleDiff === minDiff) {
            moveOptions[0].weight = 10;
            console.log(`     ↰ OVERRIDE ESQUERDA: peso 10 (diff: ${Math.round(leftAngleDiff * 180 / Math.PI)}°)`);
          }
          if (straightAngleDiff === minDiff) {
            moveOptions[1].weight = 10;
            console.log(`     ↑ OVERRIDE RETO: peso 10 (diff: ${Math.round(straightAngleDiff * 180 / Math.PI)}°)`);
          }
          if (rightAngleDiff === minDiff) {
            moveOptions[2].weight = 10;
            console.log(`     ↱ OVERRIDE DIREITA: peso 10 (diff: ${Math.round(rightAngleDiff * 180 / Math.PI)}°)`);
          }
        } else {
          // Alinhamento normal (menos agressivo)
          const bonusMultiplier = isAggressiveZone ? 8 : 4;
          
          if (leftAngleDiff === minDiff) {
            moveOptions[0].weight += alignmentFactor * bonusMultiplier;
            console.log(`     ↰ Bônus esquerda: +${(alignmentFactor * bonusMultiplier).toFixed(1)} (diff: ${Math.round(leftAngleDiff * 180 / Math.PI)}°)`);
          }
          if (straightAngleDiff === minDiff) {
            moveOptions[1].weight += alignmentFactor * (bonusMultiplier + 1);
            console.log(`     ↑ Bônus reto: +${(alignmentFactor * (bonusMultiplier + 1)).toFixed(1)} (diff: ${Math.round(straightAngleDiff * 180 / Math.PI)}°)`);
          }
          if (rightAngleDiff === minDiff) {
            moveOptions[2].weight += alignmentFactor * bonusMultiplier;
            console.log(`     ↱ Bônus direita: +${(alignmentFactor * bonusMultiplier).toFixed(1)} (diff: ${Math.round(rightAngleDiff * 180 / Math.PI)}°)`);
          }
        }
        
        // Se está muito próximo e bem alinhado, mega bônus para ir reto
        if (distanceToStart <= CLOSE_DISTANCE && minDiff < Math.PI / 6) { // < 30 graus
          if (straightAngleDiff === minDiff) {
            moveOptions[1].weight += 8;
            console.log(`     🎯 Muito próximo e alinhado: mega bônus reto (+8)!`);
          }
        }
        
        // Override total se a diferença angular for muito pequena (já bem alinhado)
        if (minDiff < Math.PI / 8) { // < 22.5 graus - bem alinhado
          if (leftAngleDiff === minDiff) moveOptions[0].weight += 15;
          if (straightAngleDiff === minDiff) moveOptions[1].weight += 15;
          if (rightAngleDiff === minDiff) moveOptions[2].weight += 15;
          console.log(`     🎯 BEM ALINHADO: mega override (+15)!`);
        }
      }
      
      // Sistema original de ajuste por proximidade (agora mais sutil)
      else if (distanceToStart < CLOSE_DISTANCE) {
        if (Math.abs(angleDiff) < Math.PI / 4) {
          moveOptions[1].weight += 1; // Bônus menor para ir reto
        } else if (angleDiff > 0) {
          moveOptions[2].weight += 1; // Bônus menor para direita
        } else {
          moveOptions[0].weight += 1; // Bônus menor para esquerda
        }
      }
      
      // Mantém tendência clockwise apenas quando longe
      else if (distanceToStart > ALIGNMENT_DISTANCE) {
        if (angleDiff > 0) {
          moveOptions[2].weight += 1; // Favorece direita quando longe
        }
      }
      
      // Seleciona uma opção válida
      let selectedOption = null;
      let attempts = 0;
      
      while (selectedOption === null && attempts < 15) {
        const totalWeight = moveOptions.reduce((sum, opt) => sum + opt.weight, 0);
        let randomValue = this.random() * totalWeight;
        
        for (const option of moveOptions) {
          randomValue -= option.weight;
          if (randomValue <= 0) {
            const testPoint = this.calculateNextPoint(currentPoint, option.direction, stepSize);
            
            if (!this.wouldCauseSmartCollision(testPoint, path, currentPoint)) {
              selectedOption = {
                direction: option.direction,
                point: testPoint,
                type: option.type,
                angle: option.angle
              };
              break;
            }
          }
        }
        
        attempts++;
        if (selectedOption === null) {
          moveOptions[1].weight += 1; // Aumenta peso de ir reto
          moveOptions[0].weight = Math.max(0.1, moveOptions[0].weight * 0.8);
          moveOptions[2].weight = Math.max(0.1, moveOptions[2].weight * 0.8);
        }
      }
      
      // Se ainda não encontrou, força ir reto com passo menor
      if (selectedOption === null) {
        console.log(`⚠️ Forçando movimento reto na volta com passo reduzido`);
        selectedOption = {
          direction: this.normalizeAngle(currentDirection),
          point: this.calculateNextPoint(currentPoint, currentDirection, stepSize * 0.7),
          type: 'straight',
          angle: 0
        };
        stuckCounter++;
      } else {
        stuckCounter = 0;
      }
      
      // Se está preso por muito tempo, tenta uma direção aleatória
      if (stuckCounter > 5) {
        console.log(`⚠️ Preso por muito tempo, tentando direção aleatória`);
        const randomDirection = this.normalizeAngle(currentDirection + (this.random() - 0.5) * Math.PI);
        selectedOption = {
          direction: randomDirection,
          point: this.calculateNextPoint(currentPoint, randomDirection, stepSize * 0.5),
          type: 'random',
          angle: 0
        };
        stuckCounter = 0;
      }
      
      // Gerencia a consistência dos ângulos (só na zona não-agressiva)
      if (distanceToStart > AGGRESSIVE_ALIGNMENT) {
        angleConsistencyCounter++;
        
        if (angleConsistencyCounter >= consistencyTarget || selectedOption.type === 'straight') {
          const oldLeftAngle = currentLeftAngle;
          const oldRightAngle = currentRightAngle;
          
          currentLeftAngle = this.getRandomAngleInRange(leftTurnAngleRange);
          currentRightAngle = this.getRandomAngleInRange(rightTurnAngleRange);
          angleConsistencyCounter = 0;
          consistencyTarget = this.getConsistencyTarget();
          
          console.log(`   🔄 Volta - Novos ângulos: esquerda ${Math.round(oldLeftAngle * 180 / Math.PI)}°→${Math.round(currentLeftAngle * 180 / Math.PI)}°, direita ${Math.round(oldRightAngle * 180 / Math.PI)}°→${Math.round(currentRightAngle * 180 / Math.PI)}°`);
        }
      }
      
      // Aplica o movimento
      currentDirection = selectedOption.direction;
      currentPoint = selectedOption.point;
      path.push(currentPoint);
      
      returnSteps++;
      const angleInfo = selectedOption.angle > 0 ? ` (${Math.round(selectedOption.angle * 180 / Math.PI)}°)` : '';
      console.log(`   Retorno ${returnSteps}: ${selectedOption.type}${angleInfo} (${Math.round(distanceToStart)}px do início)`);
    }
    
    if (returnSteps >= maxReturnSteps) {
      console.log(`⚠️ Atingiu limite máximo de ${maxReturnSteps} passos de retorno`);
    }
    
    return path;
  }
  
  // Função auxiliar para normalizar diferença de ângulo
  normalizeAngleDifference(angleDiff) {
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    return angleDiff;
  }
  
  // Função auxiliar para gerar ângulo aleatório dentro de um range
  getRandomAngleInRange(angleRange) {
    const diff = angleRange.max - angleRange.min;
    return angleRange.min + (this.random() * diff);
  }
  
  // Função auxiliar para determinar quantas células manter o mesmo ângulo (consistência)
  getConsistencyTarget() {
    // Gera um número entre 2 e 4 células para manter consistência
    return Math.floor(this.random() * 3) + 2; // 2, 3 ou 4
  }
  
  // Gera uma pista completa
  generateDirectionalTrack(options = {}) {
    const {
      centerX = window.innerWidth / 2,
      centerY = window.innerHeight / 2,
      stepSize = 100, // Tamanho do passo (distância entre pontos)
      explorationSteps = 10, // Número de passos de exploração
      straightStartSteps = 6, // Número de passos retos iniciais (área de largada)
      leftTurnAngleRange = { min: 20 * Math.PI / 180, max: 35 * Math.PI / 180 },  // 25-40 graus para esquerda (mais variado)
      rightTurnAngleRange = { min: 30 * Math.PI / 180, max: 65 * Math.PI / 180 }, // 30-75 graus para direita (mais variado)
      initialDirection = null // Direção inicial (null = aleatória)
    } = options;
    
    console.log('🎯 Gerando pista direcional avançada...');
    console.log(`   - Centro: (${centerX}, ${centerY})`);
    console.log(`   - Tamanho do passo: ${stepSize}px`);
    console.log(`   - Passos de exploração: ${explorationSteps}`);
    console.log(`   - Passos retos iniciais: ${straightStartSteps}`);
    console.log(`   - Largura da pista: ${this.TRACK_WIDTH}px`);
    
    // Ponto inicial
    const startPoint = { x: centerX, y: centerY };
    
    // Seleciona direção inicial
    const selectedDirection = initialDirection !== null ? 
      initialDirection : 
      this.INITIAL_DIRECTIONS[Math.floor(this.random() * this.INITIAL_DIRECTIONS.length)];
    
    console.log(`   - Direção inicial: ${Math.round(selectedDirection * 180 / Math.PI)}°`);
    
    // Fase de exploração
    const explorationResult = this.generateExplorationPhase(
      startPoint, 
      selectedDirection, 
      stepSize, 
      explorationSteps,
      straightStartSteps,
      leftTurnAngleRange,
      rightTurnAngleRange
    );
    
    // Fase de retorno
    const completePath = this.generateReturnPhase(
      explorationResult.path,
      explorationResult.finalDirection,
      stepSize,
      startPoint,
      leftTurnAngleRange,
      rightTurnAngleRange,
      explorationResult.finalAngles
    );
    
    console.log(`📊 Pista completa gerada com ${completePath.length} pontos`);
    console.log(`   - Exploração: ${explorationResult.path.length} pontos`);
    console.log(`   - Retorno: ${completePath.length - explorationResult.path.length} pontos`);
    
    return completePath;
  }
  
  // Gera uma pista com múltiplas tentativas
  generateSafeDirectionalTrack(options = {}, maxAttempts = 3) {
    let bestTrack = null;
    let bestScore = 0;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 Tentativa ${attempt}/${maxAttempts}`);
      
      const track = this.generateDirectionalTrack(options);
      const score = this.scoreTrack(track);
      
      if (score > bestScore) {
        bestScore = score;
        bestTrack = track;
      }
    }
    
    console.log(`✅ Melhor pista selecionada (pontuação: ${bestScore.toFixed(2)})`);
    return bestTrack;
  }
  
  // Calcula pontuação da pista
  scoreTrack(track) {
    if (!track || track.length < 5) return 0;
    
    let score = 100; // Pontuação base
    
    // Pontuação pelo tamanho da pista
    score += Math.min(track.length * 2, 100);
    
    // Pontuação pelo fechamento do circuito
    const startPoint = track[0];
    const endPoint = track[track.length - 1];
    const closingDistance = this.distance(startPoint, endPoint);
    
    if (closingDistance < 120) {
      score += 150; // Bônus por fechar bem
    } else if (closingDistance < 200) {
      score += 75;
    } else {
      score -= closingDistance * 0.5; // Penalidade por não fechar bem
    }
    
    // Pontuação pela variação (evita pistas muito retas)
    let totalVariation = 0;
    for (let i = 2; i < track.length - 1; i++) {
      const v1 = {
        x: track[i-1].x - track[i-2].x,
        y: track[i-1].y - track[i-2].y
      };
      const v2 = {
        x: track[i].x - track[i-1].x,
        y: track[i].y - track[i-1].y
      };
      
      const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      
      if (len1 > 0 && len2 > 0) {
        const dot = (v1.x * v2.x + v1.y * v2.y) / (len1 * len2);
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        totalVariation += angle;
      }
    }
    
    score += Math.min(totalVariation * 20, 100);
    
    return score;
  }
}
