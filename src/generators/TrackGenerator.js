import { DirectionalGenerator } from './DirectionalGenerator.js';
import { PerlinNoiseGenerator } from './PerlinNoiseGenerator.js';
import { SkeletonTrackGenerator } from './SkeletonTrackGenerator.js';

export class TrackGenerator {
  constructor(seed = Math.random()) {
    this.directionalGenerator = new DirectionalGenerator(seed);
    this.perlinGenerator = new PerlinNoiseGenerator(seed);
    this.skeletonGenerator = new SkeletonTrackGenerator(seed);
  }

  // === GERADORES DIRECIONAIS ===
  
  // Gera uma pista direcional avançada
  generateDirectionalTrack(options = {}) {
    return this.directionalGenerator.generateDirectionalTrack(options);
  }

  // Gera uma pista direcional com múltiplas tentativas
  generateSafeDirectionalTrack(options = {}, maxAttempts = 3) {
    return this.directionalGenerator.generateSafeDirectionalTrack(options, maxAttempts);
  }

  // === GERADORES PERLIN NOISE ===
  
  // Gera uma pista orgânica circular
  generateOrganicCircuit(options = {}) {
    return this.perlinGenerator.generateOrganicCircuit(options);
  }
  
  // Gera uma pista oval com perturbações
  generateOrganicOval(options = {}) {
    return this.perlinGenerator.generateOrganicOval(options);
  }
  
  // Gera uma pista em forma de 8 com perturbações
  generateOrganicFigureEight(options = {}) {
    return this.perlinGenerator.generateOrganicFigureEight(options);
  }
  
  // Gera uma pista complexa com múltiplas curvas
  generateComplexCircuit(options = {}) {
    return this.perlinGenerator.generateComplexCircuit(options);
  }

  // === GERADORES SKELETON ===
  
  // Gera uma pista usando o método de skeleton
  generateSkeletonTrack(options = {}) {
    return this.skeletonGenerator.generateSkeletonTrack(options);
  }

  // Gera uma pista skeleton com preset
  generatePresetSkeletonTrack(type = 'balanced', options = {}) {
    return this.skeletonGenerator.generatePresetTrack(type, options);
  }

  // Gera a melhor pista skeleton após múltiplas tentativas
  generateBestSkeletonTrack(options = {}, attempts = 3) {
    return this.skeletonGenerator.generateBestSkeletonTrack(options, attempts);
  }

  // === UTILITÁRIOS ===
  
  // Verifica se a pista tem auto-interseções (cruzamentos)
  hasIntersections(points) {
    return this.perlinGenerator.hasIntersections(points);
  }
  
  // Gera uma pista segura (sem cruzamentos) usando Perlin Noise
  generateSafeTrack(type = 'organic', options = {}, maxAttempts = 10) {
    return this.perlinGenerator.generateSafeTrack(type, options, maxAttempts);
  }
  
  // Gera uma pista circular simples como fallback
  generateSimpleCircle(options = {}) {
    return this.perlinGenerator.generateSimpleCircle(options);
  }

  // === GERADOR INTELIGENTE ===
  
  // Gera uma pista inteligente baseada em parâmetros de qualidade
  generateBestTrack(options = {}) {
    const {
      preferDirectional = false,
      preferSkeleton = true,
      maxAttempts = 3,
      algorithm = 'auto' // 'auto', 'directional', 'skeleton', 'perlin'
    } = options;
    
    let bestTrack = null;
    let bestScore = -1;
    
    // Determina quais algoritmos testar baseado nas preferências
    let algorithmsToTest = [];
    
    if (algorithm === 'auto') {
      if (preferSkeleton) {
        algorithmsToTest = ['skeleton', 'directional', 'organic'];
      } else if (preferDirectional) {
        algorithmsToTest = ['directional', 'skeleton', 'organic'];
      } else {
        algorithmsToTest = ['skeleton', 'directional', 'organic', 'oval'];
      }
    } else {
      algorithmsToTest = [algorithm];
    }
    
    for (const alg of algorithmsToTest) {
      console.log(`🔍 Testando algoritmo: ${alg}`);
      
      let track;
      try {
        switch (alg) {
          case 'directional':
            track = this.generateSafeDirectionalTrack(options, maxAttempts);
            break;
          case 'skeleton':
            track = this.generateBestSkeletonTrack(options, maxAttempts);
            break;
          case 'organic':
            track = this.generateOrganicCircuit(options);
            break;
          case 'oval':
            track = this.generateOrganicOval(options);
            break;
          case 'figure8':
            track = this.generateOrganicFigureEight(options);
            break;
          case 'complex':
            track = this.generateComplexCircuit(options);
            break;
          default:
            track = this.generateBestSkeletonTrack(options, maxAttempts);
        }
        
        if (track && track.length > 0) {
          const score = this.scoreTrack(track);
          console.log(`   - Pontuação: ${score.toFixed(2)} (${track.length} pontos)`);
          
          if (score > bestScore) {
            bestScore = score;
            bestTrack = track;
          }
        } else {
          console.log(`   - ❌ Falha na geração`);
        }
      } catch (error) {
        console.log(`   - ❌ Erro na geração: ${error.message}`);
      }
    }
    
    if (bestTrack && bestTrack.length > 0) {
      console.log(`✅ Melhor pista selecionada (pontuação: ${bestScore.toFixed(2)}, ${bestTrack.length} pontos)`);
      return bestTrack;
    } else {
      console.log(`❌ Nenhuma pista válida gerada, usando fallback`);
      return this.generateSimpleCircle(options);
    }
  }

  // === GERADOR AVANÇADO COM CRITÉRIOS DE QUALIDADE ===
  
  // Gera uma pista com critérios específicos de qualidade
  generateQualityTrack(criteria = {}) {
    const {
      minLength = 10,
      maxLength = 25,
      minComplexity = 0.3,
      maxComplexity = 0.7,
      preferredAlgorithm = 'skeleton',
      maxAttempts = 5
    } = criteria;
    
    console.log('🎯 Gerando pista com critérios de qualidade...');
    console.log(`   - Comprimento: ${minLength}-${maxLength} pontos`);
    console.log(`   - Complexidade: ${minComplexity}-${maxComplexity}`);
    console.log(`   - Algoritmo preferido: ${preferredAlgorithm}`);
    
    let bestTrack = null;
    let bestScore = -1;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let track;
      
      // Ajusta parâmetros baseado nos critérios
      const complexity = minComplexity + (maxComplexity - minComplexity) * Math.random();
      const segments = Math.floor(minLength + (maxLength - minLength) * Math.random());
      
      const options = {
        segments,
        complexity,
        pointDensity: 100
      };
      
      switch (preferredAlgorithm) {
        case 'skeleton':
          track = this.generateSkeletonTrack(options);
          break;
        case 'directional':
          track = this.generateDirectionalTrack({
            ...options,
            explorationSteps: segments,
            leftTurnAngleRange: { min: 20 * Math.PI / 180, max: 35 * Math.PI / 180 },
            rightTurnAngleRange: { min: 30 * Math.PI / 180, max: 65 * Math.PI / 180 }
          });
          break;
        default:
          track = this.generateSkeletonTrack(options);
      }
      
      if (track && track.length >= minLength && track.length <= maxLength) {
        const score = this.scoreTrack(track);
        
        if (score > bestScore) {
          bestScore = score;
          bestTrack = track;
        }
      }
    }
    
    if (bestTrack) {
      console.log(`✅ Pista de qualidade gerada (pontuação: ${bestScore.toFixed(2)})`);
      return bestTrack;
    } else {
      console.log(`⚠️ Critérios não atendidos, usando melhor pista disponível`);
      return this.generateBestTrack({ algorithm: preferredAlgorithm });
    }
  }
  
  // Pontua uma pista com base em critérios de qualidade
  scoreTrack(track) {
    // Usa o sistema de pontuação do skeleton generator que é mais avançado
    return this.skeletonGenerator.scoreTrack(track);
  }
}

// Instância global para uso fácil
export const trackGenerator = new TrackGenerator(); 