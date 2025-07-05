export class DirectionalGenerator {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.random = this.createSeededRandom(seed);
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
  
  // Verifica se uma linha cruza com outras linhas existentes
  crossesExistingPath(newPoint, currentPath, minDistance = 30) {
    if (currentPath.length < 3) return false;
    
    const lastPoint = currentPath[currentPath.length - 1];
    
    // Verifica distância mínima com pontos anteriores (exceto os últimos 2)
    for (let i = 0; i < currentPath.length - 2; i++) {
      if (this.distance(newPoint, currentPath[i]) < minDistance) {
        return true;
      }
    }
    
    // Verifica intersecção de linhas (exceto com as últimas 2 linhas)
    for (let i = 0; i < currentPath.length - 3; i++) {
      const p1 = currentPath[i];
      const p2 = currentPath[i + 1];
      
      if (this.linesIntersect(lastPoint, newPoint, p1, p2)) {
        return true;
      }
    }
    
    return false;
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
  
  // Calcula o ângulo para retornar ao ponto inicial
  getAngleToStart(currentPoint, startPoint, currentAngle) {
    const dx = startPoint.x - currentPoint.x;
    const dy = startPoint.y - currentPoint.y;
    const targetAngle = Math.atan2(dy, dx);
    
    // Calcula a diferença angular mais curta
    let diff = targetAngle - currentAngle;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    
    return diff;
  }
  
  // Verifica se pode fechar o circuito conectando ao ponto inicial
  canCloseCircuit(currentPoint, startPoint, path, maxDistance = 80) {
    const distToStart = this.distance(currentPoint, startPoint);
    
    // Se está próximo o suficiente e não cruza outras linhas
    if (distToStart <= maxDistance) {
      // Verifica se a linha de fechamento não cruza o path existente
      for (let i = 1; i < path.length - 2; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        
        if (this.linesIntersect(currentPoint, startPoint, p1, p2)) {
          return false;
        }
      }
      return true;
    }
    
    return false;
  }
  
  // Gera uma pista usando navegação direcional
  generateDirectionalTrack(options = {}) {
    const {
      centerX = window.innerWidth / 2,
      centerY = window.innerHeight / 2,
      stepSize = 40,
      maxSteps = 50,
      turnAngle = Math.PI / 4, // 45 graus
      returnPhaseRatio = 0.6, // Após 60% dos passos, tenta retornar
      minCircuitDistance = 60,
      clockwise = true, // NOVO: direção horária por padrão
      maxDistanceFromCenter = 1.7 // NOVO: máximo 70% da tela do centro
    } = options;
    
    console.log('🎯 Gerando pista direcional...');
    console.log(`   - Passos máximos: ${maxSteps}`);
    console.log(`   - Tamanho do passo: ${stepSize}px`);
    console.log(`   - Ângulo de curva: ${Math.round(turnAngle * 180 / Math.PI)}°`);
    console.log(`   - Direção: ${clockwise ? 'Horária' : 'Anti-horária'}`);
    
    const path = [];
    let currentAngle = 0; // Começa indo para a direita
    
    // Multiplicador para direção (horária = -1, anti-horária = +1)
    const directionMultiplier = clockwise ? -1 : 1;
    
    // Ponto inicial
    const startPoint = { x: centerX, y: centerY };
    path.push(startPoint);
    
    let currentPoint = { ...startPoint };
    const returnPhaseStep = Math.floor(maxSteps * returnPhaseRatio);
    
    for (let step = 1; step < maxSteps; step++) {
      const isReturnPhase = step > returnPhaseStep;
      
      // Define as opções de movimento
      // Para direção horária, invertemos a lógica das curvas
      const leftTurn = clockwise ? currentAngle + turnAngle : currentAngle - turnAngle;
      const rightTurn = clockwise ? currentAngle - turnAngle : currentAngle + turnAngle;
      
      const options = [
        { angle: currentAngle, weight: 3 }, // Continuar reto (maior peso)
        { angle: leftTurn, weight: 1 }, // Virar à esquerda
        { angle: rightTurn, weight: 1 }  // Virar à direita
      ];
      
      // Na fase de retorno, aumenta o peso da direção que leva ao início
      if (isReturnPhase) {
        const angleToStart = this.getAngleToStart(currentPoint, startPoint, currentAngle);
        
        if (Math.abs(angleToStart) < turnAngle * 0.7) {
          // Se já está apontando aproximadamente para o início, aumenta peso de seguir reto
          options[0].weight = 5;
        } else if (angleToStart < 0) {
          // Precisa virar à esquerda para voltar ao início
          options[1].weight = 4;
        } else {
          // Precisa virar à direita para voltar ao início
          options[2].weight = 4;
        }
      }
      
      // Seleciona uma direção baseada nos pesos
      let selectedOption = null;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (selectedOption === null && attempts < maxAttempts) {
        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let randomValue = this.random() * totalWeight;
        
        for (const option of options) {
          randomValue -= option.weight;
          if (randomValue <= 0) {
            const testAngle = this.normalizeAngle(option.angle);
            const testPoint = {
              x: currentPoint.x + Math.cos(testAngle) * stepSize,
              y: currentPoint.y + Math.sin(testAngle) * stepSize * directionMultiplier
            };
            
            // Verifica se o movimento é válido
            if (!this.crossesExistingPath(testPoint, path, 25)) {
              selectedOption = { angle: testAngle, point: testPoint };
              break;
            }
          }
        }
        
        attempts++;
        
        // Se não encontrou opção válida, reduz os pesos das opções de curva
        if (selectedOption === null) {
          options[1].weight = Math.max(0.5, options[1].weight * 0.7);
          options[2].weight = Math.max(0.5, options[2].weight * 0.7);
          options[0].weight += 1; // Aumenta a tendência de ir reto
        }
      }
      
      // Se ainda não encontrou uma opção válida, força ir reto
      if (selectedOption === null) {
        const testAngle = this.normalizeAngle(currentAngle);
        selectedOption = {
          angle: testAngle,
          point: {
            x: currentPoint.x + Math.cos(testAngle) * stepSize * 0.5,
            y: currentPoint.y + Math.sin(testAngle) * stepSize * 0.5 * directionMultiplier
          }
        };
      }
      
      // Verifica se pode fechar o circuito
      if (step > 8 && this.canCloseCircuit(selectedOption.point, startPoint, path, minCircuitDistance)) {
        console.log(`✅ Circuito fechado após ${step} passos`);
        break;
      }
      
      // Aplica o movimento
      currentAngle = selectedOption.angle;
      currentPoint = selectedOption.point;
      path.push(currentPoint);
      
      // Verifica se está se afastando muito do centro (failsafe)
      const distanceFromCenter = this.distance(currentPoint, startPoint);
      const maxDistance = Math.min(window.innerWidth, window.innerHeight) * maxDistanceFromCenter;
      
      if (distanceFromCenter > maxDistance) {
        console.log(`⚠️ Muito longe do centro (${Math.round(distanceFromCenter)}px / ${Math.round(maxDistance)}px), forçando retorno`);
        // Força retorno ao centro
        const angleToCenter = Math.atan2(startPoint.y - currentPoint.y, startPoint.x - currentPoint.x);
        currentAngle = angleToCenter;
      }
    }
    
    console.log(`📊 Pista gerada com ${path.length} pontos`);
    return path;
  }
  
  // Gera uma pista com múltiplas tentativas para garantir qualidade
  generateSafeDirectionalTrack(options = {}, maxAttempts = 5) {
    let bestTrack = null;
    let bestScore = 0;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 Tentativa ${attempt}/${maxAttempts}`);
      
      const track = this.generateDirectionalTrack({
        ...options,
        // Varia ligeiramente os parâmetros a cada tentativa
        stepSize: (options.stepSize || 40) + (this.random() - 0.5) * 10,
        turnAngle: (options.turnAngle || Math.PI / 4) + (this.random() - 0.5) * 0.3
      });
      
      // Calcula uma pontuação para a pista
      const score = this.scoreTrack(track);
      
      if (score > bestScore) {
        bestScore = score;
        bestTrack = track;
      }
    }
    
    console.log(`✅ Melhor pista selecionada (pontuação: ${bestScore.toFixed(2)})`);
    return bestTrack;
  }
  
  // Calcula uma pontuação para avaliar a qualidade da pista
  scoreTrack(track) {
    if (!track || track.length < 3) return 0;
    
    let score = 0;
    
    // Pontuação base por ter uma pista válida
    score += 100;
    
    // Pontuação pelo número de pontos (mais pontos = melhor, mas com limite)
    score += Math.min(track.length * 3, 150); // Máximo 50 pontos extras
    
    // Pontuação pela variação na pista (evita pistas muito retas)
    let totalAngleChange = 0;
    let validAngles = 0;
    
    for (let i = 2; i < track.length; i++) {
      const v1 = {
        x: track[i-1].x - track[i-2].x,
        y: track[i-1].y - track[i-2].y
      };
      const v2 = {
        x: track[i].x - track[i-1].x,
        y: track[i].y - track[i-1].y
      };
      
      // Verifica se os vetores são válidos (não zero)
      const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      
      if (len1 > 0.1 && len2 > 0.1) {
        const angle1 = Math.atan2(v1.y, v1.x);
        const angle2 = Math.atan2(v2.y, v2.x);
        let angleDiff = Math.abs(angle2 - angle1);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        
        totalAngleChange += angleDiff;
        validAngles++;
      }
    }
    
    if (validAngles > 0) {
      const avgAngleChange = totalAngleChange / validAngles;
      score += Math.min(avgAngleChange * 50, 100); // Recompensa variação moderada, máximo 100 pontos
    }
    
    // Avalia o fechamento da pista (menos rigoroso)
    const startPoint = track[0];
    const endPoint = track[track.length - 1];
    const closingDistance = this.distance(startPoint, endPoint);
    
    if (closingDistance < 120) {
      score += 100; // Bônus generoso por fechar razoavelmente bem
    } else if (closingDistance < 200) {
      score += 50; // Bônus menor mas ainda positivo
    } else {
      score -= Math.min(closingDistance * 0.2, 50); // Penalidade limitada
    }
    
    // Garante pontuação mínima para pistas válidas
    return Math.max(score, 50);
  }
}
