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
  generateExplorationPhase(startPoint, initialDirection, stepSize, explorationSteps, straightStartSteps, leftTurnAngle, rightTurnAngle) {
    console.log(`🚀 Iniciando fase de exploração (${explorationSteps} passos, ${straightStartSteps} retos iniciais)`);
    console.log(`   - Ângulo esquerda: ${Math.round(leftTurnAngle * 180 / Math.PI)}°`);
    console.log(`   - Ângulo direita: ${Math.round(rightTurnAngle * 180 / Math.PI)}°`);
    
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
    
    // Restante dos passos de exploração (após os passos retos iniciais)
    for (let step = straightStartSteps + 1; step <= explorationSteps; step++) {
      // Pesos baseados nos ângulos - direita mais favorecida por ser mais agressiva
      const leftWeight = 1;
      const straightWeight = 4; // Aumentei um pouco
      const rightWeight = 2;    // Favorece direita por ser clockwise
      
      const moveOptions = [
        { direction: currentDirection - leftTurnAngle, type: 'left', weight: leftWeight },   // Negativo para esquerda
        { direction: currentDirection, type: 'straight', weight: straightWeight },
        { direction: currentDirection + rightTurnAngle, type: 'right', weight: rightWeight } // Positivo para direita
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
            
            if (!this.wouldCauseCollision(testPoint, path, currentPoint) && !wouldLoop) {
              selectedOption = {
                direction: option.direction,
                point: testPoint,
                type: option.type
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
          type: 'straight'
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
      
      // Aplica o movimento
      currentDirection = selectedOption.direction;
      currentPoint = selectedOption.point;
      path.push(currentPoint);
      
      console.log(`   Passo ${step}: ${selectedOption.type} (${path.length} pontos total)`);
    }
    
    return { path, finalDirection: currentDirection };
  }
  
  // Gera a fase de retorno (sempre clockwise)
  generateReturnPhase(explorationPath, finalDirection, stepSize, startPoint, leftTurnAngle, rightTurnAngle) {
    console.log(`🔄 Iniciando fase de retorno (clockwise)`);
    
    const path = [...explorationPath];
    let currentDirection = finalDirection;
    let currentPoint = path[path.length - 1];
    
    const maxReturnSteps = 100; // Aumentei o limite
    let returnSteps = 0;
    let stuckCounter = 0; // Contador para detectar quando está preso
    
    while (returnSteps < maxReturnSteps) {
      // Verifica se pode fechar o circuito
      if (returnSteps > 5 && this.canCloseCircuit(currentPoint, startPoint, path, stepSize)) {
        console.log(`✅ Circuito fechado após ${returnSteps} passos de retorno`);
        break;
      }
      
      // Calcula ângulo para o ponto inicial
      const dx = startPoint.x - currentPoint.x;
      const dy = startPoint.y - currentPoint.y;
      const angleToStart = Math.atan2(dy, dx);
      const distanceToStart = this.distance(currentPoint, startPoint);
      
      // Opções de movimento priorizando sentido horário (clockwise)
      // Na volta, prioriza ainda mais a direita
      const moveOptions = [
        { direction: currentDirection - leftTurnAngle, type: 'left', weight: 0.5 },   // Peso baixo para esquerda
        { direction: currentDirection, type: 'straight', weight: 2 },
        { direction: currentDirection + rightTurnAngle, type: 'right', weight: 4 }    // Peso alto para direita (clockwise)
      ];
      
      // Normaliza as direções
      moveOptions.forEach(option => {
        option.direction = this.normalizeAngle(option.direction);
      });
      
      // Ajusta pesos baseado na direção ao início
      let angleDiff = angleToStart - currentDirection;
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // Se está se aproximando do ponto inicial, prioriza a direção correta
      if (distanceToStart < stepSize * 4) {
        if (Math.abs(angleDiff) < Math.PI / 4) {
          moveOptions[1].weight = 5; // Prioriza ir reto
        } else if (angleDiff > 0) {
          moveOptions[2].weight = 5; // Prioriza direita
        } else {
          moveOptions[0].weight = 3; // Prioriza esquerda (mas ainda menos que direita)
        }
      } else {
        // Se está longe, prioriza virar à direita (clockwise)
        if (angleDiff > 0) {
          moveOptions[2].weight = 5; // Aumenta muito o peso de virar à direita
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
            
            if (!this.wouldCauseCollision(testPoint, path, currentPoint)) {
              selectedOption = {
                direction: option.direction,
                point: testPoint,
                type: option.type
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
          type: 'straight'
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
          type: 'random'
        };
        stuckCounter = 0;
      }
      
      // Aplica o movimento
      currentDirection = selectedOption.direction;
      currentPoint = selectedOption.point;
      path.push(currentPoint);
      
      returnSteps++;
      console.log(`   Retorno ${returnSteps}: ${selectedOption.type} (distância ao início: ${Math.round(distanceToStart)}px)`);
    }
    
    if (returnSteps >= maxReturnSteps) {
      console.log(`⚠️ Atingiu limite máximo de ${maxReturnSteps} passos de retorno`);
    }
    
    return path;
  }
  
  // Gera uma pista completa
  generateDirectionalTrack(options = {}) {
    const {
      centerX = window.innerWidth / 2,
      centerY = window.innerHeight / 2,
      stepSize = 100, // Tamanho do passo (distância entre pontos)
      explorationSteps = 10, // Número de passos de exploração
      straightStartSteps = 4, // Número de passos retos iniciais (área de largada)
      leftTurnAngle = 35 * Math.PI / 180,  // 35 graus para esquerda (mais suave)
      rightTurnAngle = 75 * Math.PI / 180, // 75 graus para direita (mais agressivo)
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
      leftTurnAngle,
      rightTurnAngle
    );
    
    // Fase de retorno
    const completePath = this.generateReturnPhase(
      explorationResult.path,
      explorationResult.finalDirection,
      stepSize,
      startPoint,
      leftTurnAngle,
      rightTurnAngle
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
