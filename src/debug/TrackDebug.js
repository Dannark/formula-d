import { trackConfig } from "../config/trackPoints.js";
import { Track } from "../components/Track.js";

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
    console.log('✅ Entidade da pista atualizada');
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
  console.log('🎮 Pista atualizada visualmente!');
  
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
  console.log('🎮 Pista atualizada visualmente!');
  
  return defaultPoints;
}

// Função de ajuda para mostrar como usar as funções
function trackHelp() {
  console.log(`
🏁 === FORMULA-D TRACK DEBUG SYSTEM === 🏁

📋 Funções disponíveis no console:

🎯 generateCircularTrack(numPoints, radiusPercent)
   - Gera uma nova pista circular
   - numPoints: número de pontos (padrão: 12)
   - radiusPercent: raio como % da tela (padrão: 0.25)
   
   Exemplos:
   generateCircularTrack()           // Pista padrão
   generateCircularTrack(8)          // 8 pontos, raio padrão
   generateCircularTrack(16, 0.3)    // 16 pontos, 30% da tela
   generateCircularTrack(6, 0.15)    // 6 pontos, 15% da tela

📊 getTrackInfo()
   - Mostra informações da pista atual
   
🔄 resetToDefaultTrack()
   - Volta para a pista padrão (12 pontos, 25% da tela)

❓ trackHelp()
   - Mostra esta ajuda novamente

💡 Dica: As mudanças são aplicadas automaticamente na tela!
   Se não funcionar, recarregue a página.
  `);
}

// Expõe as funções globalmente no console
window.generateCircularTrack = generateCircularTrack;
window.getTrackInfo = getTrackInfo;
window.resetToDefaultTrack = resetToDefaultTrack;
window.trackHelp = trackHelp;

// Função interna para registrar entidade (não exposta globalmente)
window.__registerTrackEntity = registerTrackEntity;

// Mostra a ajuda quando o arquivo é carregado
console.log('🏁 Formula-D Track Debug System carregado!');
console.log('💡 Digite trackHelp() no console para ver as funções disponíveis.');

export { registerTrackEntity }; 