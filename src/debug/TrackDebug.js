import { trackConfig } from "../config/trackPoints.js";
import { Track } from "../components/Track.js";
import { TrackGenerator } from "../generators/TrackGenerator.js";

// Função auxiliar para criar pontos em círculo (copiada do trackPoints.js)
function createCircularPoints(centerX, centerY, radius, numPoints) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({ x, y });
  }
  return points;
}

// Referência para a entidade da pista (será definida quando disponível)
let trackEntity = null;

// Instância do gerador de pistas
const generator = new TrackGenerator();

// Função para registrar a entidade da pista
function registerTrackEntity(entity) {
  trackEntity = entity;
  console.log('🎯 Entidade da pista registrada no sistema de debug');
}

// Função para atualizar tanto o config quanto a entidade
function updateTrackPoints(newPoints) {
  // Atualiza o config
  trackConfig.points = newPoints;
  
  // Atualiza a entidade se ela estiver disponível
  if (trackEntity) {
    trackEntity.getComponent(Track).points = newPoints;
  } else {
    console.log('⚠️ Entidade da pista não encontrada - apenas config atualizado');
    console.log('💡 Dica: Recarregue a página para ver as mudanças');
  }
}

// Função global para gerar novo mapa circular via console
function generateCircularTrack(numPoints = 12, radiusPercent = 0.25) {
  console.log(`🏁 Gerando nova pista circular:`);
  console.log(`   - Pontos: ${numPoints}`);
  console.log(`   - Raio: ${radiusPercent * 100}% da tela`);
  
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const radius = Math.min(window.innerWidth, window.innerHeight) * radiusPercent;
  
  const newPoints = createCircularPoints(centerX, centerY, radius, numPoints);
  
  // Atualiza tanto o config quanto a entidade
  updateTrackPoints(newPoints);
  
  console.log(`✅ Nova pista gerada com ${newPoints.length} pontos`);
  console.log(`   - Centro: (${centerX}, ${centerY})`);
  console.log(`   - Raio: ${radius}px`);
  
  return newPoints;
}

// Função para obter informações da pista atual
function getTrackInfo() {
  console.log(`📊 Informações da pista atual:`);
  console.log(`   - Pontos: ${trackConfig.points.length}`);
  console.log(`   - Largura: ${trackConfig.trackWidth}px`);
  console.log(`   - Distância máxima: ${trackConfig.maxPointDistance}px`);
  console.log(`   - Distância mínima: ${trackConfig.minPointDistance}px`);
  console.log(`   - Entidade registrada: ${trackEntity ? 'Sim' : 'Não'}`);
  console.log('📍 Pontos da pista:', trackConfig.points);
  
  return trackConfig;
}

// Função para resetar para a pista padrão
function resetToDefaultTrack() {
  console.log('🔄 Resetando para pista padrão...');
  
  const defaultPoints = createCircularPoints(
    window.innerWidth / 2,
    window.innerHeight / 2,
    Math.min(window.innerWidth, window.innerHeight) * 0.25,
    12
  );
  
  updateTrackPoints(defaultPoints);
  
  console.log('✅ Pista resetada para configuração padrão');
  
  return defaultPoints;
}

// === FUNÇÕES DE GERAÇÃO PROCEDURAL ===

// Gera pista direcional inteligente DIRETO (sem sistema de avaliação)
function generateDirectionalTrack(options = {}) {
  console.log('🎯 Gerando pista direcional diretamente...');
  
  const defaultOptions = {
    stepSize: 100,
    maxSteps: 30,
    turnAngle: Math.PI / 4,
    returnPhaseRatio: 0.6,
    minCircuitDistance: 60,
    clockwise: true, // Direção horária por padrão
    maxDistanceFromCenter: 0.8, // Permite pistas até 80% da tela do centro
    ...options
  };
  
  // Chama diretamente o gerador sem passar pelo sistema de avaliação
  const newPoints = generator.directionalGenerator.generateSafeDirectionalTrack(defaultOptions);
  
  if (newPoints && newPoints.length > 0) {
    updateTrackPoints(newPoints);
    console.log(`✅ Pista direcional gerada com ${newPoints.length} pontos`);
  } else {
    console.log('❌ Falha ao gerar pista direcional');
  }
  
  return newPoints;
}

// Gera pista direcional SIMPLES (uma única tentativa)
function generateSimpleDirectionalTrack(options = {}) {
  console.log('⚡ Gerando pista direcional simples (1 tentativa)...');
  
  const defaultOptions = {
    stepSize: 100,
    maxSteps: 60,
    turnAngle: Math.PI / 4,
    returnPhaseRatio: 0.6,
    minCircuitDistance: 60,
    clockwise: true,
    maxDistanceFromCenter: 0.8,
    ...options
  };
  
  // Chama apenas uma vez, sem múltiplas tentativas
  const newPoints = generator.directionalGenerator.generateDirectionalTrack(defaultOptions);
  
  if (newPoints && newPoints.length > 0) {
    updateTrackPoints(newPoints);
    console.log(`✅ Pista direcional simples gerada com ${newPoints.length} pontos`);
  } else {
    console.log('❌ Falha ao gerar pista direcional simples');
  }
  
  return newPoints;
}

// Gera pista inteligente (testa múltiplos geradores)
function generateBestTrack(options = {}) {
  console.log('🏆 Gerando melhor pista possível...');
  
  const defaultOptions = {
    preferDirectional: true,
    ...options
  };
  
  const newPoints = generator.generateBestTrack(defaultOptions);
  
  if (newPoints && newPoints.length > 0) {
    updateTrackPoints(newPoints);
    console.log(`✅ Melhor pista gerada com ${newPoints.length} pontos`);
  } else {
    console.log('❌ Falha ao gerar melhor pista');
  }
  
  return newPoints;
}

// Gera pista orgânica com Perlin Noise
function generateOrganicTrack(options = {}) {
  console.log('🌿 Gerando pista orgânica com Perlin Noise...');
  
  const defaultOptions = {
    numPoints: 16,
    baseRadius: Math.min(window.innerWidth, window.innerHeight) * 0.25,
    noiseAmplitude: 0.3,
    complexity: 1.0
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  const newPoints = generator.generateSafeTrack('organic', finalOptions);
  
  updateTrackPoints(newPoints);
  
  console.log(`✅ Pista orgânica gerada com ${newPoints.length} pontos`);
  
  return newPoints;
}

// Gera pista oval com perturbações
function generateOvalTrack(options = {}) {
  console.log('🏁 Gerando pista oval com perturbações...');
  
  const defaultOptions = {
    numPoints: 20,
    radiusX: Math.min(window.innerWidth, window.innerHeight) * 0.3,
    radiusY: Math.min(window.innerWidth, window.innerHeight) * 0.2,
    noiseAmplitude: 0.2
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  const newPoints = generator.generateSafeTrack('oval', finalOptions);
  
  updateTrackPoints(newPoints);
  
  console.log(`✅ Pista oval gerada com ${newPoints.length} pontos`);
  
  return newPoints;
}

// Gera pista em forma de 8
function generateFigureEightTrack(options = {}) {
  console.log('∞ Gerando pista em forma de 8...');
  
  const defaultOptions = {
    numPoints: 24,
    lobeRadius: Math.min(window.innerWidth, window.innerHeight) * 0.15,
    noiseAmplitude: 0.25
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  const newPoints = generator.generateSafeTrack('figure8', finalOptions);
  
  updateTrackPoints(newPoints);
  
  console.log(`✅ Pista figura-8 gerada com ${newPoints.length} pontos`);
  
  return newPoints;
}

// Gera pista complexa com múltiplas seções
function generateComplexTrack(options = {}) {
  console.log('🏎️ Gerando pista complexa...');
  
  const defaultOptions = {
    numPoints: 20,
    sections: 3,
    noiseAmplitude: 0.4,
    baseRadius: Math.min(window.innerWidth, window.innerHeight) * 0.25
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  const newPoints = generator.generateSafeTrack('complex', finalOptions);
  
  updateTrackPoints(newPoints);
  
  console.log(`✅ Pista complexa gerada com ${newPoints.length} pontos`);
  
  return newPoints;
}

// Gera pista randomizada (escolhe tipo aleatório)
function generateRandomTrack(options = {}) {
  console.log('🎲 Gerando pista completamente aleatória...');
  
  // Opções randomizadas
  const baseSize = Math.min(window.innerWidth, window.innerHeight);
  const randomOptions = {
    numPoints: 12 + Math.floor(Math.random() * 16), // 12-28 pontos
    baseRadius: baseSize * (0.2 + Math.random() * 0.2), // 20-40% da tela
    noiseAmplitude: 0.2 + Math.random() * 0.3, // 0.2-0.5
    complexity: 0.5 + Math.random() * 1.5, // 0.5-2.0
    stepSize: 30 + Math.random() * 20, // 30-50 para pistas direcionais
    maxSteps: 20 + Math.floor(Math.random() * 20), // 20-40 passos
    ...options
  };
  
  const newPoints = generator.generateRandomTrack(randomOptions);
  
  if (newPoints && newPoints.length > 0) {
    updateTrackPoints(newPoints);
    console.log(`✅ Pista aleatória gerada com ${newPoints.length} pontos`);
  } else {
    console.log('❌ Falha ao gerar pista aleatória');
  }
  
  return newPoints;
}

// Função de ajuda para mostrar como usar as funções
function trackHelp() {
  console.log(`
🏁 === FORMULA-D TRACK DEBUG SYSTEM === 🏁

📋 Funções disponíveis no console:

=== GERAÇÃO BÁSICA ===
🎯 generateCircularTrack(numPoints, radiusPercent)
   - Gera uma nova pista circular simples
   
   Exemplos:
   generateCircularTrack()           // Pista padrão
   generateCircularTrack(8, 0.3)     // 8 pontos, 30% da tela

=== GERAÇÃO PROCEDURAL ===
🎯 generateDirectionalTrack(options)
   - Pista direcional com múltiplas tentativas (RECOMENDADO)
   - options: stepSize, maxSteps, turnAngle, returnPhaseRatio, clockwise, maxDistanceFromCenter
   
⚡ generateSimpleDirectionalTrack(options)
   - Pista direcional com 1 tentativa apenas (MAIS RÁPIDO)
   - Mesmas opções da função acima
   
🏆 generateBestTrack(options)
   - options: preferDirectional
   - Testa múltiplos geradores e escolhe o melhor
   
🌿 generateOrganicTrack(options)
   - options: numPoints, baseRadius, noiseAmplitude, complexity
   - Pista circular com perturbações orgânicas (Perlin Noise)
   
🏁 generateOvalTrack(options)
   - options: numPoints, radiusX, radiusY, noiseAmplitude
   - Pista oval com variações naturais
   
∞ generateFigureEightTrack(options)
   - Pista em forma de 8 com perturbações
   
🏎️ generateComplexTrack(options)
   - Pista complexa com múltiplas seções
   
🎲 generateRandomTrack(options)
   - Gera pista totalmente randomizada (inclui novos tipos!)

=== UTILITÁRIOS ===
📊 getTrackInfo()
   - Mostra informações da pista atual
   
🔄 resetToDefaultTrack()
   - Volta para a pista padrão
   
❓ trackHelp()
   - Mostra esta ajuda

=== EXEMPLOS AVANÇADOS ===
generateDirectionalTrack({ stepSize: 80, maxSteps: 40 })
generateSimpleDirectionalTrack({ clockwise: false }) // Anti-horária
generateDirectionalTrack({ maxDistanceFromCenter: 0.9 }) // Permite 90% da tela
generateBestTrack({ preferDirectional: true })
generateOrganicTrack({ numPoints: 20, noiseAmplitude: 0.5 })
generateOvalTrack({ radiusX: 400, radiusY: 200 })
generateComplexTrack({ sections: 4, noiseAmplitude: 0.6 })
generateRandomTrack({ stepSize: 45 })

💡 Dica: Todas as pistas são verificadas automaticamente para evitar cruzamentos!
🎮 As mudanças são aplicadas instantaneamente na tela.
  `);
}

// Expõe as funções globalmente no console
window.generateCircularTrack = generateCircularTrack;
window.generateDirectionalTrack = generateDirectionalTrack;
window.generateSimpleDirectionalTrack = generateSimpleDirectionalTrack;
window.generateBestTrack = generateBestTrack;
window.generateOrganicTrack = generateOrganicTrack;
window.generateOvalTrack = generateOvalTrack;
window.generateFigureEightTrack = generateFigureEightTrack;
window.generateComplexTrack = generateComplexTrack;
window.generateRandomTrack = generateRandomTrack;
window.getTrackInfo = getTrackInfo;
window.resetToDefaultTrack = resetToDefaultTrack;
window.trackHelp = trackHelp;

// Função interna para registrar entidade (não exposta globalmente)
window.__registerTrackEntity = registerTrackEntity;

// Mostra a ajuda quando o arquivo é carregado
console.log('🏁 Formula-D Track Debug System carregado!');
console.log('🎯 Sistema de geração direcional melhorado disponível!');
console.log('⚡ Nova função: generateSimpleDirectionalTrack() - mais rápida!');
console.log('🌿 Sistema de geração procedural com Perlin Noise disponível!');
console.log('💡 Digite trackHelp() no console para ver todas as funções disponíveis.');
console.log('🎲 Experimente: generateSimpleDirectionalTrack() ou generateDirectionalTrack()!');

export { registerTrackEntity }; 