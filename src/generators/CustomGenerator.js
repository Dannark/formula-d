export class CustomGenerator {
  constructor() {
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
    this.random = this.createSeededRandom(Math.random());
  }

  generateDirectionalTrack(options = {}) {
    const {
      centerX = window.innerWidth / 2,
      centerY = window.innerHeight / 2,
      stepSize = 100, // Tamanho do passo (distância entre pontos)
      explorationSteps = 10, // Mantido para compatibilidade (agora usado como fallback)
      numberOfRandomActions = 13, // NOVO: Número de ações aleatórias a executar
      straightStartSteps = 6, // Número de passos retos iniciais (área de largada)
      leftTurnAngleRange = { min: 20 * Math.PI / 180, max: 35 * Math.PI / 180 },  // 25-40 graus para esquerda
      rightTurnAngleRange = { min: 30 * Math.PI / 180, max: 65 * Math.PI / 180 }, // 30-75 graus para direita
      initialDirection = null // Direção inicial (null = aleatória)
    } = options;

    const startPoint = { x: centerX, y: centerY };

    const selectedDirection = initialDirection !== null ? 
      initialDirection : 
      this.INITIAL_DIRECTIONS[Math.floor(this.random() * this.INITIAL_DIRECTIONS.length)];

    const explorationPath = this.generateExplorationPhase(
      startPoint,
      selectedDirection,
      stepSize,
      numberOfRandomActions, // Passa o número de ações ao invés de explorationSteps
      straightStartSteps,
      leftTurnAngleRange,
      rightTurnAngleRange,
    );

    const completePath = this.generateReturnPhase(
      explorationPath,
      selectedDirection,
      stepSize,
      startPoint,
      leftTurnAngleRange,
      rightTurnAngleRange,
    );

    return completePath;
  }

  generateExplorationPhase(startPoint, initialDirection, stepSize, numberOfRandomActions, straightStartSteps, leftTurnAngleRange, rightTurnAngleRange) {
    const path = [startPoint];
    let currentDirection = initialDirection;
    let currentPoint = startPoint;
    let lastAction = null; // Rastreia a última ação executada
    
    // Fase inicial: alguns passos retos para área de largada
    for (let i = 0; i < straightStartSteps; i++) {
      const nextPoint = this.calculateNextPoint(currentPoint, currentDirection, stepSize);
      path.push(nextPoint);
      currentPoint = nextPoint;
    }
    
    // Fase de exploração aleatória - agora baseada no NÚMERO DE AÇÕES
    let actionsExecuted = 0;
    const maxAttempts = 5; // Máximo de tentativas para evitar loop infinito
    
    console.log(`[DEBUG] Iniciando exploração aleatória: ${numberOfRandomActions} ações planejadas`);
    
    while (actionsExecuted < numberOfRandomActions) {
      // Escolhe uma ação aleatória, evitando FRENTE consecutivo
      const action = this.getRandomAction(lastAction);
      console.log(`[DEBUG] Ação ${actionsExecuted + 1}/${numberOfRandomActions} - Tentando: ${action.type} (última ação: ${lastAction || 'nenhuma'})`);
      
      let actionSuccessful = false;
      let attempts = 0;
      const availableActions = ['FRENTE', 'ESQUERDA', 'DIREITA'];
      
      // Se a última ação foi FRENTE, remove FRENTE das ações disponíveis no fallback também
      if (lastAction === 'FRENTE') {
        const frenteIndex = availableActions.indexOf('FRENTE');
        if (frenteIndex > -1) {
          availableActions.splice(frenteIndex, 1);
        }
      }
      
      // Tenta a ação escolhida e fallback se houver cruzamento
      while (!actionSuccessful && attempts < maxAttempts && availableActions.length > 0) {
        const currentAction = attempts === 0 ? action.type : availableActions[Math.floor(Math.random() * availableActions.length)];
        
        let newSegment = null;
        let newDirection = currentDirection;
        
        switch (currentAction) {
          case 'FRENTE':
            const straightSteps = Math.floor(Math.random() * 6) + 3; // 5-15 células
            newSegment = this.generateStraightSegment(currentPoint, currentDirection, stepSize, straightSteps);
            break;
            
          case 'ESQUERDA':
            const leftCurve = this.generateCurveSegment(
              currentPoint, 
              currentDirection, 
              stepSize, 
              'left',
              leftTurnAngleRange
            );
            newSegment = leftCurve.path;
            newDirection = leftCurve.finalDirection;
            break;
            
          case 'DIREITA':
            const rightCurve = this.generateCurveSegment(
              currentPoint, 
              currentDirection, 
              stepSize, 
              'right',
              rightTurnAngleRange
            );
            newSegment = rightCurve.path;
            newDirection = rightCurve.finalDirection;
            break;
        }
        
        // Verifica se há cruzamento com o caminho existente
        if (newSegment && !this.checkSelfIntersection(path, newSegment)) {
          // Sem cruzamento! Adiciona o segmento
          path.push(...newSegment.slice(1)); // Remove o primeiro ponto (duplicado)
          currentPoint = path[path.length - 1];
          currentDirection = newDirection;
          lastAction = currentAction; // Atualiza a última ação executada
          actionsExecuted++; // Incrementa o contador de AÇÕES, não pontos
          actionSuccessful = true;
          console.log(`[DEBUG] ✅ Ação ${currentAction} executada! (${newSegment.length - 1} pontos adicionados) - Total de ações: ${actionsExecuted}/${numberOfRandomActions}`);
        } else {
          // Cruzamento detectado! Remove esta ação das opções e tenta outra
          const actionIndex = availableActions.indexOf(currentAction);
          if (actionIndex > -1) {
            availableActions.splice(actionIndex, 1);
          }
          console.log(`[DEBUG] ❌ Cruzamento detectado em ${currentAction}. Tentando outra ação...`);
        }
        
        attempts++;
      }
      
      // Se nenhuma ação funcionou, força um movimento reto pequeno mas CONTA como ação
      if (!actionSuccessful) {
        console.log('[DEBUG] 🚨 Nenhuma ação válida encontrada. Forçando movimento de emergência.');
        const emergencySegment = this.generateStraightSegment(currentPoint, currentDirection, stepSize, 2);
        path.push(...emergencySegment.slice(1));
        currentPoint = path[path.length - 1];
        lastAction = 'FRENTE'; // Ação de emergência é considerada FRENTE
        actionsExecuted++; // Conta como uma ação executada
        console.log(`[DEBUG] ⚠️ Ação de emergência executada - Total de ações: ${actionsExecuted}/${numberOfRandomActions}`);
      }
    }
    
    console.log(`[DEBUG] 🏁 Exploração concluída! ${actionsExecuted} ações executadas, ${path.length} pontos totais`);
    return path;
  }

  /**
   * Escolhe uma ação aleatória com probabilidades definidas
   * @param {string} lastAction - Última ação executada (opcional)
   * @returns {Object} Ação escolhida
   */
  getRandomAction(lastAction = null) {
    let actions = [
      { type: 'FRENTE', probability: 0.4 },    // 40% - movimento reto
      { type: 'ESQUERDA', probability: 0.3 },  // 30% - curva esquerda
      { type: 'DIREITA', probability: 0.3 }    // 30% - curva direita
    ];
    
    // Se a última ação foi FRENTE, remove FRENTE das opções disponíveis
    if (lastAction === 'FRENTE') {
      actions = actions.filter(action => action.type !== 'FRENTE');
      // Redistribui as probabilidades entre ESQUERDA e DIREITA
      // Cada uma fica com 50% (0.3 + 0.2 = 0.5)
      actions.forEach(action => {
        action.probability = 0.5;
      });
      console.log('[DEBUG] 🚫 Última ação foi FRENTE - evitando repetição. Opções: ESQUERDA (50%) e DIREITA (50%)');
    }
    
    const randomValue = Math.random();
    let accumulatedProbability = 0;
    
    for (const action of actions) {
      accumulatedProbability += action.probability;
      if (randomValue <= accumulatedProbability) {
        return action;
      }
    }
    
    return actions[0]; // Fallback
  }

  /**
   * Gera um segmento reto
   * @param {Object} startPoint - Ponto inicial
   * @param {number} direction - Direção em radianos
   * @param {number} stepSize - Tamanho do passo
   * @param {number} steps - Número de passos
   * @returns {Array} Segmento de pontos
   */
  generateStraightSegment(startPoint, direction, stepSize, steps) {
    const segment = [startPoint];
    let currentPoint = startPoint;
    
    for (let i = 0; i < steps; i++) {
      const nextPoint = this.calculateNextPoint(currentPoint, direction, stepSize);
      segment.push(nextPoint);
      currentPoint = nextPoint;
    }
    
    return segment;
  }

  /**
   * Gera um segmento de curva
   * @param {Object} startPoint - Ponto inicial
   * @param {number} initialDirection - Direção inicial
   * @param {number} stepSize - Tamanho do passo
   * @param {string} turnDirection - 'left' ou 'right'
   * @param {Object} angleRange - Range de ângulos {min, max}
   * @returns {Object} {path: Array, finalDirection: number}
   */
  generateCurveSegment(startPoint, initialDirection, stepSize, turnDirection, angleRange) {
    const segment = [startPoint];
    let currentPoint = startPoint;
    let currentDirection = initialDirection;
    
    // Ângulo total da curva (aleatório dentro do range)
    const totalAngle = angleRange.min + Math.random() * (angleRange.max - angleRange.min);
    const angleMultiplier = turnDirection === 'left' ? 1 : -1;
    const finalAngle = totalAngle * angleMultiplier;
    
    // Número de passos na curva (baseado no ângulo)
    const curveSteps = Math.max(3, Math.ceil(Math.abs(finalAngle) / (Math.PI / 8))); // Mínimo 3 passos
    const angleIncrement = finalAngle / curveSteps;
    
    for (let i = 0; i < curveSteps; i++) {
      currentDirection += angleIncrement;
      const nextPoint = this.calculateNextPoint(currentPoint, currentDirection, stepSize);
      segment.push(nextPoint);
      currentPoint = nextPoint;
    }
    
    return {
      path: segment,
      finalDirection: currentDirection
    };
  }

  /**
   * Verifica se um novo segmento cruza com o caminho existente
   * @param {Array} existingPath - Caminho atual
   * @param {Array} newSegment - Novo segmento a verificar
   * @returns {boolean} True se há cruzamento
   */
  checkSelfIntersection(existingPath, newSegment) {
    const minDistance = 80; // Distância mínima para considerar cruzamento
    
    // Verifica cada ponto do novo segmento contra o caminho existente
    for (let i = 1; i < newSegment.length; i++) { // Começa em 1 para pular o ponto inicial
      const newPoint = newSegment[i];
      
      // Verifica contra todos os pontos do caminho existente (exceto os últimos 3 para evitar falsos positivos)
      for (let j = 0; j < existingPath.length - 3; j++) {
        const existingPoint = existingPath[j];
        const distance = this.calculateDistance(newPoint, existingPoint);
        
        if (distance < minDistance) {
          return true; // Cruzamento detectado
        }
      }
    }
    
    return false; // Sem cruzamento
  }

  generateReturnPhase(explorationPath, initialDirection, stepSize, startPoint, leftTurnAngleRange, rightTurnAngleRange) {
    const path = [...explorationPath];
    const lastPoint = explorationPath[explorationPath.length - 1];
    
    // Calcula as dimensões e limites da pista atual
    const trackBounds = this.calculateTrackBounds(explorationPath, stepSize);
    
    // Gera o caminho de retorno contornando a pista
    const returnPath = this.generateOptimizedContourPath(
      lastPoint,
      startPoint,
      trackBounds,
      explorationPath,
      stepSize
    );
    
    // Adiciona o caminho de retorno (exceto o primeiro ponto que já está no path)
    path.push(...returnPath.slice(1));
    
    return path;
  }

  /**
   * Calcula os limites e dimensões da pista gerada
   * @param {Array} trackPath - Caminho da pista atual
   * @param {number} stepSize - Tamanho do passo
   * @returns {Object} Objeto com informações dos limites da pista
   */
  calculateTrackBounds(trackPath, stepSize) {
    let minX = trackPath[0].x;
    let maxX = trackPath[0].x;
    let minY = trackPath[0].y;
    let maxY = trackPath[0].y;
    
    // Encontra os limites extremos da pista
    trackPath.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
    
    // Adiciona margem de segurança baseada no stepSize
    const margin = stepSize * 3; // 3x o stepSize como margem de segurança
    
    return {
      minX: minX - margin,
      maxX: maxX + margin,
      minY: minY - margin,
      maxY: maxY + margin,
      width: (maxX - minX) + (margin * 2),
      height: (maxY - minY) + (margin * 2),
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      margin
    };
  }

  /**
   * Determina a melhor estratégia de contorno baseada nas posições
   * SEMPRE no sentido horário (clockwise)
   * @param {Object} start - Ponto inicial
   * @param {Object} target - Ponto alvo
   * @param {Object} bounds - Limites da pista
   * @returns {string} Estratégia de contorno
   */
  determineContourStrategy(start, target, bounds) {
    // Para garantir sentido horário, sempre contornamos pela direita
    // A estratégia é determinada pela posição relativa ao centro da pista
    const startQuadrant = this.getQuadrant(start, bounds);
    const targetQuadrant = this.getQuadrant(target, bounds);
    
    // Determina o contorno horário baseado nos quadrantes
    return this.getClockwiseStrategy(startQuadrant, targetQuadrant);
  }

  /**
   * Determina a estratégia de contorno no sentido horário
   * @param {string} startQuadrant - Quadrante inicial
   * @param {string} targetQuadrant - Quadrante alvo
   * @returns {string} Estratégia horária
   */
  getClockwiseStrategy(startQuadrant, targetQuadrant) {
    // Mapeia os quadrantes em ordem horária: top-right -> bottom-right -> bottom-left -> top-left
    const clockwiseOrder = ['top-right', 'bottom-right', 'bottom-left', 'top-left'];
    
    const startIndex = clockwiseOrder.indexOf(startQuadrant);
    const targetIndex = clockwiseOrder.indexOf(targetQuadrant);
    
    // Calcula a direção horária mais curta
    let steps = (targetIndex - startIndex + 4) % 4;
    
    // Se for mais eficiente ir no sentido contrário, ainda mantemos horário mas ajustamos a rota
    if (steps > 2) {
      return 'clockwise-long';
    } else {
      return 'clockwise-short';
    }
  }

  /**
   * Gera pontos de waypoint para contornar a pista SEMPRE no sentido horário
   * @param {Object} start - Ponto inicial
   * @param {Object} target - Ponto alvo
   * @param {Object} bounds - Limites da pista
   * @param {string} strategy - Estratégia de contorno
   * @returns {Array} Array de waypoints
   */
  generateWaypoints(start, target, bounds, strategy) {
    const waypoints = [];
    
    // Sempre usa contorno horário, removendo a opção diagonal aleatória
    const clockwiseWaypoints = this.generateClockwiseWaypoints(start, target, bounds);
    
    return clockwiseWaypoints;
  }

  /**
   * Gera waypoints seguindo sempre o sentido horário ao redor da pista
   * @param {Object} start - Ponto inicial
   * @param {Object} target - Ponto alvo
   * @param {Object} bounds - Limites da pista
   * @returns {Array} Array de waypoints no sentido horário
   */
  generateClockwiseWaypoints(start, target, bounds) {
    const waypoints = [];
    const proximityThreshold = 100; // Distância para parar
    
    // Define os pontos de canto em ordem horária
    const corners = {
      'top-right': { x: bounds.maxX, y: bounds.minY },
      'bottom-right': { x: bounds.maxX, y: bounds.maxY },
      'bottom-left': { x: bounds.minX, y: bounds.maxY },
      'top-left': { x: bounds.minX, y: bounds.minY }
    };
    
    const startQuadrant = this.getQuadrant(start, bounds);
    const targetQuadrant = this.getQuadrant(target, bounds);
    
    // Ordem horária dos quadrantes
    const clockwiseOrder = ['top-right', 'bottom-right', 'bottom-left', 'top-left'];
    
    const startIndex = clockwiseOrder.indexOf(startQuadrant);
    const targetIndex = clockwiseOrder.indexOf(targetQuadrant);
    
    // Move primeiro para a borda do quadrante atual
    this.addQuadrantEdgePoint(waypoints, start, startQuadrant, bounds);
    
    // Verifica se já está próximo o suficiente após mover para a borda
    if (waypoints.length > 0) {
      const lastWaypoint = waypoints[waypoints.length - 1];
      const distanceToTarget = this.calculateDistance(lastWaypoint, target);
      if (distanceToTarget <= proximityThreshold) {
        return waypoints; // Para aqui, não adiciona mais waypoints
      }
    }
    
    // Navega pelos cantos no sentido horário até chegar ao quadrante alvo
    let currentIndex = startIndex;
    while (currentIndex !== targetIndex) {
      currentIndex = (currentIndex + 1) % 4;
      const cornerQuadrant = clockwiseOrder[currentIndex];
      const cornerPoint = corners[cornerQuadrant];
      
      // Verifica se adicionar este canto nos deixará próximos o suficiente do target
      const distanceToTarget = this.calculateDistance(cornerPoint, target);
      if (distanceToTarget <= proximityThreshold) {
        // Estamos próximos o suficiente, para aqui
        break;
      }
      
      waypoints.push(cornerPoint);
      
      // Se chegou no quadrante alvo, para
      if (currentIndex === targetIndex) {
        break;
      }
    }
    
    // REMOVIDO: Não adiciona automaticamente o target
    // Só adiciona o target se estivermos muito longe ainda
    const lastPoint = waypoints.length > 0 ? waypoints[waypoints.length - 1] : start;
    const finalDistanceToTarget = this.calculateDistance(lastPoint, target);
    
    // Só adiciona o target se estivermos ainda muito longe (mais que o threshold)
    if (finalDistanceToTarget > proximityThreshold) {
      waypoints.push(target);
    }
    
    return waypoints;
  }

  /**
   * Adiciona um ponto na borda do quadrante para iniciar o contorno
   * @param {Array} waypoints - Array de waypoints
   * @param {Object} start - Ponto inicial
   * @param {string} quadrant - Quadrante atual
   * @param {Object} bounds - Limites da pista
   */
  addQuadrantEdgePoint(waypoints, start, quadrant, bounds) {
    switch (quadrant) {
      case 'top-right':
        // Move para a borda direita ou superior (o que for mais próximo no sentido horário)
        waypoints.push({ x: bounds.maxX, y: start.y });
        break;
      case 'bottom-right':
        // Move para a borda inferior ou direita
        waypoints.push({ x: start.x, y: bounds.maxY });
        break;
      case 'bottom-left':
        // Move para a borda esquerda ou inferior
        waypoints.push({ x: bounds.minX, y: start.y });
        break;
      case 'top-left':
        // Move para a borda superior ou esquerda
        waypoints.push({ x: start.x, y: bounds.minY });
        break;
    }
  }

  /**
   * Determina em qual quadrante o ponto está em relação aos limites
   * @param {Object} point - Ponto a verificar
   * @param {Object} bounds - Limites da pista
   * @returns {string} Quadrante
   */
  getQuadrant(point, bounds) {
    const isLeft = point.x < bounds.centerX;
    const isTop = point.y < bounds.centerY;
    
    if (isLeft && isTop) return 'top-left';
    if (!isLeft && isTop) return 'top-right';
    if (isLeft && !isTop) return 'bottom-left';
    return 'bottom-right';
  }

  /**
   * Gera um caminho reto entre dois pontos com opção de parar por proximidade
   * @param {Object} start - Ponto inicial
   * @param {Object} end - Ponto final
   * @param {number} stepSize - Tamanho do passo
   * @param {number} proximityThreshold - Distância para parar (opcional)
   * @returns {Array} Caminho reto
   */
  generateStraightPath(start, end, stepSize, proximityThreshold = null) {
    const path = [start];
    
    const distance = this.calculateDistance(start, end);
    
    // Se foi especificada proximidade e já está próximo, retorna apenas o start
    if (proximityThreshold && distance <= proximityThreshold) {
      return path;
    }
    
    const numSteps = Math.ceil(distance / stepSize);
    
    for (let i = 1; i <= numSteps; i++) {
      const t = i / numSteps;
      const point = {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      };
      
      // Se foi especificada proximidade, verifica se deve parar
      if (proximityThreshold) {
        const distanceToEnd = this.calculateDistance(point, end);
        if (distanceToEnd <= proximityThreshold) {
          path.push(point);
          break; // Para aqui, próximo o suficiente
        }
      }
      
      path.push(point);
    }
    
    return path;
  }

  /**
   * Versão avançada da geração de contorno com otimizações
   * @param {Object} startPoint - Ponto de início do retorno
   * @param {Object} targetPoint - Ponto alvo (início da pista)
   * @param {Object} trackBounds - Limites da pista
   * @param {Array} existingPath - Caminho existente para evitar cruzamentos
   * @param {number} stepSize - Tamanho do passo
   * @returns {Array} Caminho de retorno otimizado
   */
  generateOptimizedContourPath(startPoint, targetPoint, trackBounds, existingPath, stepSize) {
    const path = [startPoint];
    let currentPoint = { ...startPoint };
    const proximityThreshold = 300;
    
    // Verifica se já está próximo o suficiente do target desde o início
    const initialDistance = this.calculateDistance(startPoint, targetPoint);
    if (initialDistance <= proximityThreshold) {
      console.log(`[DEBUG] Já próximo no início: ${initialDistance}px`);
      return path; // Já está próximo, não precisa contornar
    }
    
    // Tenta primeiro um caminho direto se não houver obstáculos
    if (this.isDirectPathClear(startPoint, targetPoint, existingPath, stepSize)) {
      console.log('[DEBUG] Caminho direto livre, usando linha reta com proximidade');
      const directPath = this.generateStraightPath(startPoint, targetPoint, stepSize, proximityThreshold);
      return directPath;
    }
    
    // Caso contrário, usa a estratégia de contorno
    console.log('[DEBUG] Caminho direto bloqueado, usando contorno horário');
    const strategy = this.determineContourStrategy(startPoint, targetPoint, trackBounds);
    const waypoints = this.generateWaypoints(startPoint, targetPoint, trackBounds, strategy);
    
    console.log(`[DEBUG] Waypoints gerados: ${waypoints.length}`);
    
    // Navega através dos waypoints
    for (let i = 0; i < waypoints.length; i++) {
      const waypoint = waypoints[i];
      console.log(`[DEBUG] Navegando para waypoint ${i}: (${waypoint.x}, ${waypoint.y})`);
      
      const segmentPath = this.generateStraightPath(currentPoint, waypoint, stepSize, proximityThreshold);
      
      // Remove o primeiro ponto apenas se não for o primeiro segmento
      const pointsToAdd = i === 0 ? segmentPath.slice(1) : segmentPath.slice(1);
      path.push(...pointsToAdd);
      
      // Atualiza currentPoint para o último ponto realmente adicionado
      currentPoint = path[path.length - 1];
      
      // Verifica se está próximo o suficiente do alvo
      const distanceToTarget = this.calculateDistance(currentPoint, targetPoint);
      console.log(`[DEBUG] Distância para target após waypoint ${i}: ${distanceToTarget}px`);
      
      if (distanceToTarget <= proximityThreshold) {
        console.log(`[DEBUG] Próximo o suficiente! Parando navegação.`);
        break; // Para aqui, próximo o suficiente
      }
    }
    
    console.log(`[DEBUG] Caminho final tem ${path.length} pontos`);
    return path;
  }

  /**
   * Verifica se um caminho direto está livre de obstáculos
   * @param {Object} start - Ponto inicial
   * @param {Object} end - Ponto final
   * @param {Array} existingPath - Caminho existente
   * @param {number} stepSize - Tamanho do passo
   * @returns {boolean} Se o caminho está livre
   */
  isDirectPathClear(start, end, existingPath, stepSize) {
    const checkPoints = 10; // Número de pontos para verificar ao longo da linha
    const safeDistance = stepSize * 2; // Distância segura dos pontos existentes
    
    for (let i = 0; i <= checkPoints; i++) {
      const t = i / checkPoints;
      const checkPoint = {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      };
      
      // Verifica se este ponto está muito próximo de algum ponto do caminho existente
      for (const existingPoint of existingPath) {
        const distance = this.calculateDistance(checkPoint, existingPoint);
        if (distance < safeDistance) {
          return false; // Caminho bloqueado
        }
      }
    }
    
    return true; // Caminho livre
  }

  /**
   * Calcula a distância entre dois pontos
   * @param {Object} point1 - Primeiro ponto
   * @param {Object} point2 - Segundo ponto
   * @returns {number} Distância
   */
  calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  calculateNextPoint(currentPoint, direction, stepSize) {
    return {
      x: currentPoint.x + Math.cos(direction) * stepSize,
      y: currentPoint.y + Math.sin(direction) * stepSize
    };
  }

  createSeededRandom(seed) {
    return () => 0;
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }
}
