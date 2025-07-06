/**
 * Gerador de pistas baseado em Skeleton (Esqueleto)
 * 
 * Esta abordagem funciona em duas fases:
 * 1. Gera um esqueleto (linha central) da pista
 * 2. Expande o esqueleto para criar o corredor completo
 * 
 * Vantagens:
 * - Evita auto-intersecções por design
 * - Mais controle sobre a forma da pista
 * - Melhor performance na detecção de colisões
 * - Pistas mais consistentes e navegáveis
 */

export class SkeletonTrackGenerator {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.random = this.createSeededRandom(seed);
    
    // Configurações da pista
    this.TRACK_WIDTH = 200;
    this.TRACK_HALF_WIDTH = this.TRACK_WIDTH / 2;
    this.MIN_SEGMENT_LENGTH = 80;
    this.MAX_SEGMENT_LENGTH = 150;
    this.MIN_TURN_RADIUS = 100;
    this.MAX_TURN_RADIUS = 250;
  }

  // Gerador de números aleatórios com seed
  createSeededRandom(seed) {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  // Gera um esqueleto de pista usando controle de curvatura
  generateSkeleton(options = {}) {
    const {
      centerX = window.innerWidth / 2,
      centerY = window.innerHeight / 2,
      maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.3,
      segments = 12,
      complexity = 0.5 // 0 = circular, 1 = muito complexo
    } = options;

    console.log('🦴 Gerando esqueleto da pista...');
    console.log(`   - Segmentos: ${segments}`);
    console.log(`   - Complexidade: ${complexity}`);

    const skeleton = [];
    const angleStep = (2 * Math.PI) / segments;
    
    // Calcula um raio base para cada segmento
    const baseRadius = maxRadius * (0.7 + complexity * 0.3);
    
    for (let i = 0; i < segments; i++) {
      const angle = i * angleStep;
      
      // Variação do raio baseada na complexidade
      const radiusVariation = 1 + (this.random() - 0.5) * complexity * 0.6;
      const radius = baseRadius * radiusVariation;
      
      // Variação angular para criar curvas orgânicas
      const angleVariation = (this.random() - 0.5) * complexity * 0.4;
      const finalAngle = angle + angleVariation;
      
      const x = centerX + radius * Math.cos(finalAngle);
      const y = centerY + radius * Math.sin(finalAngle);
      
      skeleton.push({ x, y, radius, angle: finalAngle });
    }

    // Suaviza o esqueleto para evitar ângulos muito abruptos
    const smoothedSkeleton = this.smoothSkeleton(skeleton);
    
    console.log(`   - Esqueleto gerado com ${smoothedSkeleton.length} pontos`);
    return smoothedSkeleton;
  }

  // Suaviza o esqueleto para criar curvas mais naturais
  smoothSkeleton(skeleton) {
    const smoothed = [];
    const smoothingFactor = 0.3; // Quanto maior, mais suave
    
    for (let i = 0; i < skeleton.length; i++) {
      const current = skeleton[i];
      const prev = skeleton[(i - 1 + skeleton.length) % skeleton.length];
      const next = skeleton[(i + 1) % skeleton.length];
      
      // Interpolação entre pontos vizinhos
      const smoothedX = current.x + (prev.x + next.x - 2 * current.x) * smoothingFactor;
      const smoothedY = current.y + (prev.y + next.y - 2 * current.y) * smoothingFactor;
      
      smoothed.push({
        x: smoothedX,
        y: smoothedY,
        radius: current.radius,
        angle: current.angle
      });
    }
    
    return smoothed;
  }

  // Interpola pontos entre o esqueleto para criar densidade adequada
  interpolateSkeleton(skeleton, targetDensity = 100) {
    const interpolated = [];
    
    for (let i = 0; i < skeleton.length; i++) {
      const current = skeleton[i];
      const next = skeleton[(i + 1) % skeleton.length];
      
      interpolated.push(current);
      
      // Calcula distância entre pontos atuais
      const distance = this.distance(current, next);
      
      // Determina quantos pontos intermediários são necessários
      const numInterpolations = Math.floor(distance / targetDensity);
      
      for (let j = 1; j <= numInterpolations; j++) {
        const t = j / (numInterpolations + 1);
        
        // Interpolação linear
        const x = current.x + (next.x - current.x) * t;
        const y = current.y + (next.y - current.y) * t;
        
        interpolated.push({ x, y });
      }
    }
    
    console.log(`   - Interpolado para ${interpolated.length} pontos`);
    return interpolated;
  }

  // Gera uma pista usando o método de skeleton
  generateSkeletonTrack(options = {}) {
    console.log('🏁 Gerando pista baseada em skeleton...');
    
    // Fase 1: Gera o esqueleto
    const skeleton = this.generateSkeleton(options);
    
    // Fase 2: Interpola pontos para densidade adequada
    const interpolatedSkeleton = this.interpolateSkeleton(skeleton, options.pointDensity || 100);
    
    // Fase 3: Valida e ajusta se necessário
    const validatedTrack = this.validateAndAdjustTrack(interpolatedSkeleton);
    
    console.log(`✅ Pista skeleton gerada com ${validatedTrack.length} pontos`);
    return validatedTrack;
  }

  // Valida e ajusta a pista para evitar problemas
  validateAndAdjustTrack(track) {
    // Verifica se há pontos muito próximos
    const adjusted = this.removeClosePoints(track, 50);
    
    // Verifica se há ângulos muito abruptos
    const smoothed = this.smoothSharpAngles(adjusted);
    
    return smoothed;
  }

  // Remove pontos muito próximos uns dos outros
  removeClosePoints(track, minDistance) {
    const filtered = [track[0]]; // Sempre mantém o primeiro ponto
    
    for (let i = 1; i < track.length; i++) {
      const current = track[i];
      const last = filtered[filtered.length - 1];
      
      if (this.distance(current, last) >= minDistance) {
        filtered.push(current);
      }
    }
    
    console.log(`   - Pontos filtrados: ${track.length} → ${filtered.length}`);
    return filtered;
  }

  // Suaviza ângulos muito abruptos
  smoothSharpAngles(track, maxAngleChange = Math.PI / 3) {
    const smoothed = [...track];
    
    for (let i = 1; i < track.length - 1; i++) {
      const prev = track[i - 1];
      const current = track[i];
      const next = track[i + 1];
      
      // Calcula ângulos dos vetores
      const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
      const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
      
      // Diferença angular
      let angleDiff = angle2 - angle1;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // Se o ângulo é muito abrupto, suaviza
      if (Math.abs(angleDiff) > maxAngleChange) {
        const smoothingFactor = 0.5;
        smoothed[i] = {
          x: current.x + (prev.x + next.x - 2 * current.x) * smoothingFactor,
          y: current.y + (prev.y + next.y - 2 * current.y) * smoothingFactor
        };
      }
    }
    
    return smoothed;
  }

  // Utilitário: calcula distância entre dois pontos
  distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Gera diferentes tipos de pistas usando skeleton
  generatePresetTrack(type = 'balanced', options = {}) {
    const presets = {
      simple: {
        segments: 8,
        complexity: 0.2,
        pointDensity: 120
      },
      balanced: {
        segments: 12,
        complexity: 0.4,
        pointDensity: 100
      },
      complex: {
        segments: 16,
        complexity: 0.7,
        pointDensity: 80
      },
      organic: {
        segments: 20,
        complexity: 0.5,
        pointDensity: 90
      }
    };

    const preset = presets[type] || presets.balanced;
    const finalOptions = { ...preset, ...options };

    console.log(`🎯 Gerando pista preset "${type}"`);
    return this.generateSkeletonTrack(finalOptions);
  }

  // Gera múltiplas pistas e escolhe a melhor
  generateBestSkeletonTrack(options = {}, attempts = 3) {
    let bestTrack = null;
    let bestScore = -1;

    for (let i = 0; i < attempts; i++) {
      console.log(`🔄 Tentativa ${i + 1}/${attempts}`);
      
      const track = this.generateSkeletonTrack(options);
      const score = this.scoreTrack(track);
      
      if (score > bestScore) {
        bestScore = score;
        bestTrack = track;
      }
    }

    console.log(`✅ Melhor pista skeleton selecionada (pontuação: ${bestScore.toFixed(2)})`);
    return bestTrack;
  }

  // Pontua uma pista baseada em critérios de qualidade
  scoreTrack(track) {
    if (!track || track.length < 5) return 0;
    
    let score = 100;
    
    // Pontuação pelo tamanho
    score += Math.min(track.length, 50);
    
    // Pontuação pela variação (evita pistas muito retas ou muito curvas)
    let totalCurvature = 0;
    let straightSections = 0;
    
    for (let i = 1; i < track.length - 1; i++) {
      const prev = track[i - 1];
      const current = track[i];
      const next = track[i + 1];
      
      // Calcula curvatura local
      const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
      const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
      let curvature = Math.abs(angle2 - angle1);
      
      if (curvature > Math.PI) curvature = 2 * Math.PI - curvature;
      
      totalCurvature += curvature;
      
      if (curvature < 0.1) straightSections++;
    }
    
    // Favorece pistas com boa mistura de curvas e retas
    const avgCurvature = totalCurvature / (track.length - 2);
    const straightRatio = straightSections / (track.length - 2);
    
    // Pontuação ótima para curvatura moderada
    if (avgCurvature > 0.1 && avgCurvature < 0.5) {
      score += 50;
    }
    
    // Pontuação ótima para 20-40% de seções retas
    if (straightRatio > 0.2 && straightRatio < 0.4) {
      score += 30;
    }
    
    // Penaliza pistas muito pequenas ou muito grandes
    if (track.length < 8) {
      score -= 30;
    } else if (track.length > 30) {
      score -= 10;
    }
    
    return score;
  }
} 