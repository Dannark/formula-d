import { PerlinNoiseGenerator } from './PerlinNoiseGenerator.js';
import { DirectionalGenerator } from './DirectionalGenerator.js';

export class TrackGenerator {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.perlinGenerator = new PerlinNoiseGenerator(seed);
    this.directionalGenerator = new DirectionalGenerator(seed);
  }
  
  // === GERADOR DIRECIONAL (NOVO) ===
  
  // Gera uma pista usando navegação direcional inteligente
  generateDirectionalTrack(options = {}) {
    return this.directionalGenerator.generateSafeDirectionalTrack(options);
  }
  
  // === GERADORES PERLIN NOISE (LEGADO) ===
  
  // Gera uma pista circular com perturbações orgânicas
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
  
  // === INTERFACE UNIFICADA ===
  
  // Gera uma pista aleatória escolhendo entre todos os tipos disponíveis
  generateRandomTrack(options = {}) {
    const types = ['directional', 'organic', 'oval', 'figure8', 'complex'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    console.log(`🎲 Gerando pista aleatória do tipo: ${randomType}`);
    
    switch (randomType) {
      case 'directional':
        return this.generateDirectionalTrack(options);
      case 'organic':
        return this.generateOrganicCircuit(options);
      case 'oval':
        return this.generateOrganicOval(options);
      case 'figure8':
        return this.generateOrganicFigureEight(options);
      case 'complex':
        return this.generateComplexCircuit(options);
      default:
        return this.generateDirectionalTrack(options);
    }
  }
  
  // Gera uma pista inteligente baseada em parâmetros de qualidade
  generateBestTrack(options = {}) {
    const {
      preferDirectional = true,
      maxAttempts = 3
    } = options;
    
    let bestTrack = null;
    let bestScore = -1; // Mudança: aceita qualquer pontuação positiva
    
    const generators = preferDirectional 
      ? ['directional', 'organic', 'oval'] 
      : ['organic', 'oval', 'figure8', 'complex'];
    
    for (const type of generators) {
      console.log(`🔍 Testando gerador: ${type}`);
      
      let track;
      switch (type) {
        case 'directional':
          track = this.generateDirectionalTrack(options);
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
      }
      
      // Se a pista foi gerada com sucesso, use ela mesmo com pontuação baixa
      if (track && track.length > 0) {
        const score = this.scoreTrack(track);
        console.log(`   - Pontuação: ${score.toFixed(2)} (${track.length} pontos)`);
        
        if (score > bestScore) {
          bestScore = score;
          bestTrack = track;
        }
        
        // Se ainda não tem uma pista válida, aceita qualquer uma que foi gerada
        if (bestTrack === null) {
          bestTrack = track;
          bestScore = score;
        }
      } else {
        console.log(`   - ❌ Falha na geração`);
      }
    }
    
    if (bestTrack && bestTrack.length > 0) {
      console.log(`✅ Melhor pista selecionada (pontuação: ${bestScore.toFixed(2)}, ${bestTrack.length} pontos)`);
      return bestTrack;
    } else {
      console.log(`❌ Nenhuma pista válida gerada`);
      return null;
    }
  }
  
  // Pontua uma pista com base em critérios de qualidade
  scoreTrack(track) {
    // Delega para o gerador direcional que tem um sistema de pontuação mais sofisticado
    return this.directionalGenerator.scoreTrack(track);
  }
}

// Instância global para uso fácil
export const trackGenerator = new TrackGenerator(); 